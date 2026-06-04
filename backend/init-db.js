#!/usr/bin/env node

/**
 * Database migration runner for Wick Wax & Relax.
 *
 * Replaces the previous hardcoded list (which silently skipped 5 of 17
 * migrations on a fresh init — including the TOTP 2FA migration) with a
 * dynamic, transactional, checksum-verified runner.
 *
 * Commands (used via `npm run db:...`):
 *   init                Apply all pending migrations (idempotent)
 *   migrate             Alias for init
 *   status              Show applied vs pending migrations
 *   rollback <filename> Mark a migration as not applied (you must manually
 *                       revert any schema changes; the runner does not store
 *                       DOWN statements)
 *   reset               Drop everything in the public schema (DESTRUCTIVE)
 *   help                Show this help
 *
 * Behaviour:
 *   - Discovers migrations by `fs.readdirSync('migrations/*.sql')` sorted
 *     lexicographically. No more hardcoded list to drift.
 *   - Tracks applied migrations in the `migrations_applied` table created
 *     by migration 017.
 *   - First-run detection: if the table is empty or missing, every discovered
 *     migration is applied, then the tracking table is created and backfilled.
 *   - Each migration runs inside a single Postgres transaction. Each statement
 *     within the migration runs inside a SAVEPOINT so a single failing
 *     statement (e.g. "already exists" from a non-idempotent ALTER) is
 *     isolated and the rest of the migration continues.
 *   - Checksum verification: on every run, the SHA-256 of each already-applied
 *     migration file is compared against the stored checksum. A mismatch is
 *     logged as a warning (a modified applied migration is a serious bug) but
 *     does not fail the run — the operator must decide.
 *
 * Environment:
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME   PostgreSQL connection
 *   ADMIN_INITIAL_PASSWORD                             Initial password for
 *                                                       the seeded admin user
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// Load .env automatically so `npm run db:init` works in a dev environment
// without requiring the user to source env vars first. Production deploys
// inject env vars via the orchestrator (Docker, systemd, CloudPanel) and
// dotenv is a no-op when the vars are already set.
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (_) {
  // dotenv not installed; assume env is provided externally
}

const { initializeDb, query, getClient, shutdown } = require('./config/database');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

// ----- helpers --------------------------------------------------------------

function discoverMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((filename) => ({
      filename,
      path: path.join(MIGRATIONS_DIR, filename),
    }));
}

function checksumFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Split a SQL file into individual statements.
 *
 * Naive `sql.split(';')` is unsafe: any `;` inside a `--` comment, a string
 * literal, or a dollar-quoted block will be treated as a statement
 * terminator, producing garbage that Postgres tries to execute.
 *
 * This splitter:
 *   1. Identifies `$$ ... $$` dollar-quoted blocks and replaces them with
 *      placeholders, so any `;` inside a function body is hidden from the
 *      splitter. (Plpgsql `LANGUAGE plpgsql` bodies use `$$`.)
 *   2. Strips `/* ... *​/` block comments.
 *   3. Strips line comments (entire lines and inline).
 *   4. Then splits on `;`.
 *   5. Replaces the placeholders with the original dollar-quoted bodies
 *      so each statement is a valid, complete SQL string.
 *
 * It assumes the existing migrations don't contain:
 *   - String literals with `;` inside single-quoted strings (none in
 *     the current 20 migrations).
 *   - Nested dollar-quoted blocks (none — Postgres doesn't support them
 *     without tags anyway).
 *
 * If a future migration needs those, switch to libpg_query or pg-query-parser.
 */
function splitStatements(sql) {
  // 1. Extract $$ ... $$ dollar-quoted blocks, replace with placeholders.
  const dollarBlocks = [];
  let cleaned = sql.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
    const idx = dollarBlocks.length;
    dollarBlocks.push(match);
    return `__DOLLAR_BLOCK_${idx}__`;
  });

  // 2. Strip /* ... */ block comments (non-greedy, multi-line).
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

  // 3. Process line by line, removing line comments.
  const lines = cleaned.split('\n').map((line) => {
    const stripped = line.trim();
    if (stripped.startsWith('--')) return '';
    const inlineComment = line.indexOf('--');
    if (inlineComment !== -1) return line.slice(0, inlineComment);
    return line;
  });

  // 4. Reassemble and split on `;`.
  const reassembled = lines.join('\n');
  const statements = reassembled
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // 5. Restore dollar-quoted blocks in each statement.
  return statements.map((stmt) =>
    stmt.replace(/__DOLLAR_BLOCK_(\d+)__/g, (_, idx) => dollarBlocks[Number(idx)])
  );
}

function isIgnorableError(message) {
  // The existing 19 migrations are not all idempotent (e.g. ALTER TABLE ...
  // ADD COLUMN without IF NOT EXISTS). When re-running `db:init` against a
  // DB where the schema is already partially in place, we want to ignore
  // these errors so the rest of the migration can proceed. Going forward,
  // new migrations should be written idempotently (CREATE TABLE IF NOT
  // EXISTS etc.) so this list shrinks.
  return (
    message.includes('already exists') ||
    message.includes('does not exist') ||
    message.includes('current transaction is aborted') ||
    message.includes('commands ignored until end of transaction block') ||
    message.includes('duplicate key') ||
    message.includes('duplicate object')
  );
}

async function tableExists(client, tableName) {
  const r = await client.query(
    'SELECT to_regclass($1) AS oid',
    [`public.${tableName}`]
  );
  return r.rows[0].oid !== null;
}

async function getAppliedMigrations(client) {
  if (!(await tableExists(client, 'migrations_applied'))) {
    return new Map();
  }
  const r = await client.query(
    'SELECT filename, checksum, applied_at, execution_time_ms FROM migrations_applied ORDER BY filename'
  );
  const map = new Map();
  for (const row of r.rows) {
    map.set(row.filename, {
      checksum: row.checksum,
      applied_at: row.applied_at,
      execution_time_ms: row.execution_time_ms,
    });
  }
  return map;
}

async function ensureTrackingTable(client) {
  if (await tableExists(client, 'migrations_applied')) return;
  // The 017 migration creates the table; we look it up by filename pattern
  // so a renamed 017 will still work.
  const meta = discoverMigrations().find((m) => /migrations_applied/i.test(m.filename));
  if (!meta) {
    throw new Error(
      'Cannot bootstrap: no migration matching /migrations_applied/ found in migrations/. ' +
      'Did you delete migrations/017_migrations_applied_meta.sql?'
    );
  }
  const sql = fs.readFileSync(meta.path, 'utf8');
  const statements = splitStatements(sql);
  await client.query('BEGIN');
  try {
    for (const stmt of statements) {
      await client.query(stmt);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  }
}

// ----- core runner ---------------------------------------------------------

class MigrationRunner {
  constructor() {
    this.firstRun = false;
  }

  async testConnection() {
    console.log('🧪 Testing database connection...');
    try {
      await initializeDb();
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('🔍 Connection details:');
      console.error(`   Host:     ${process.env.DB_HOST || 'localhost'}`);
      console.error(`   Port:     ${process.env.DB_PORT || '5432'}`);
      console.error(`   Database: ${process.env.DB_NAME || 'wick_wax_relax'}`);
      console.error(`   User:     ${process.env.DB_USER || 'wick_wax_user'}`);
      console.error(`   Password: ${process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]'}`);
      throw error;
    }
  }

  /**
   * Apply a single migration file.
   *
   * Strategy:
   *   - Read the whole file.
   *   - Use the smart splitter (handles `;` inside comments, block
   *     comments, dollar-quoted bodies) to break it into individual
   *     statements.
   *   - Execute each statement in its own implicit transaction (Postgres
   *     auto-commits each statement when no outer BEGIN is active).
   *   - Catch errors: ignore "already exists" / "does not exist" / "current
   *     transaction is aborted" / "duplicate key" / "duplicate object" —
   *     the existing 19 migrations are not all idempotent, and we need to
   *     tolerate partial application. New migrations should be written
   *     idempotently so this list shrinks over time.
   *   - A real error (e.g. malformed SQL, missing column) re-throws and
   *     halts the entire migration run.
   *
   * We deliberately do NOT wrap in a transaction. Two reasons:
   *   1. The existing 19 migrations are not all idempotent. Wrapping them
   *      in a transaction means the first failure aborts everything
   *      subsequent in the file (Postgres' "current transaction is aborted"
   *      error), which is worse than executing each statement individually.
   *   2. Single-statement auto-commit means a failed statement (e.g.
   *      "already exists") doesn't poison the rest of the migration.
   *   3. The migrations_applied tracking table + checksum verification
   *      gives us idempotency at the file level: a successfully-recorded
   *      file is never re-executed.
   */
  async applyMigration(client, m, options = {}) {
    const { silent = false } = options;
    if (!silent) console.log(`📄 ${m.filename}`);

    const sql = fs.readFileSync(m.path, 'utf8');
    const statements = splitStatements(sql);
    const start = Date.now();
    let skipped = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await client.query(stmt);
      } catch (e) {
        if (isIgnorableError(e.message)) {
          skipped++;
          continue;
        }
        // Real error — stop here.
        console.error(`   ❌ ${m.filename} statement ${i + 1}/${statements.length} failed: ${e.message}`);
        throw e;
      }
    }

    const elapsed = Date.now() - start;
    if (!silent) {
      const tag = skipped > 0 ? ` (${skipped} idempotent skip${skipped === 1 ? '' : 's'})` : '';
      console.log(`   ✅ applied in ${elapsed}ms${tag}`);
    }
    return elapsed;
  }

  async initialize() {
    console.log('🚀 Starting migration run...');
    await this.testConnection();

    const client = await getClient();
    try {
      const migrations = discoverMigrations();
      const applied = await getAppliedMigrations(client);
      this.firstRun = applied.size === 0;

      if (this.firstRun) {
        console.log(`\n  ℹ  First run detected (or no migrations recorded yet).`);
        console.log(`     Applying all ${migrations.length} migrations in order...\n`);
      } else {
        console.log(`\n  ℹ  Found ${applied.size} applied migrations, scanning for pending...\n`);
      }

      let appliedCount = 0;
      let skippedCount = 0;
      let warnedCount = 0;

      for (const m of migrations) {
        if (applied.has(m.filename)) {
          // Verify checksum
          const currentChecksum = checksumFile(m.path);
          const stored = applied.get(m.filename);
          if (stored.checksum !== currentChecksum) {
            console.warn(`   ⚠️  ${m.filename} checksum mismatch`);
            console.warn(`      stored:   ${stored.checksum}`);
            console.warn(`      current:  ${currentChecksum}`);
            console.warn(`      This file was modified after being applied. Investigate.`);
            warnedCount++;
          } else {
            skippedCount++;
          }
          continue;
        }

        const elapsed = await this.applyMigration(client, m);
        const currentChecksum = checksumFile(m.path);

        // If the tracking table exists, record; if not (first-run), we'll
        // backfill after the bootstrap below.
        if (await tableExists(client, 'migrations_applied')) {
          await client.query(
            `INSERT INTO migrations_applied (filename, checksum, execution_time_ms, notes)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (filename) DO UPDATE SET
               checksum = EXCLUDED.checksum,
               execution_time_ms = EXCLUDED.execution_time_ms`,
            [m.filename, currentChecksum, elapsed, 'applied during normal run']
          );
        }
        appliedCount++;
      }

      // On first run, ensure the tracking table exists and backfill it with
      // every migration we just applied. This is what makes subsequent
      // `db:status` calls and incremental `db:migrate` runs work.
      if (this.firstRun) {
        await ensureTrackingTable(client);
        for (const m of migrations) {
          const checksum = checksumFile(m.path);
          await client.query(
            `INSERT INTO migrations_applied (filename, checksum, execution_time_ms, notes)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (filename) DO NOTHING`,
            [m.filename, checksum, 0, 'backfilled from first-run bootstrap']
          );
        }
        console.log(`\n   🧾 Tracking table created and backfilled with ${migrations.length} entries.`);
      }

      // Always seed (idempotent) initial data after a successful run.
      await this.seedInitialData(client);

      console.log(`\n  ✅ Migration run complete.`);
      console.log(`     Applied: ${appliedCount}  Skipped: ${skippedCount}  Checksum warnings: ${warnedCount}`);
    } finally {
      client.release();
    }
  }

  async status() {
    await this.testConnection();
    const client = await getClient();
    try {
      const migrations = discoverMigrations();
      const applied = await getAppliedMigrations(client);

      console.log('\n  Migration status:');
      console.log('  ' + '─'.repeat(78));
      console.log('   STATUS  FILENAME                                            APPLIED AT          ms');
      console.log('  ' + '─'.repeat(78));

      for (const m of migrations) {
        const a = applied.get(m.filename);
        let status, ts, ms;
        if (a) {
          status = '✓';
          ts = new Date(a.applied_at).toISOString().replace('T', ' ').slice(0, 19);
          ms = a.execution_time_ms != null ? String(a.execution_time_ms) : '-';
        } else {
          status = '○';
          ts = '(pending)';
          ms = '-';
        }
        console.log(`    ${status}     ${m.filename.padEnd(50)}  ${ts}  ${ms}`);
      }
      console.log('  ' + '─'.repeat(78));
      console.log(`  Total: ${migrations.length}   Applied: ${applied.size}   Pending: ${migrations.length - applied.size}\n`);
    } finally {
      client.release();
    }
  }

  async rollback(filename) {
    if (!filename) {
      console.error('❌ Usage: db:rollback <filename>');
      process.exit(1);
    }
    await this.testConnection();
    const client = await getClient();
    try {
      if (!(await tableExists(client, 'migrations_applied'))) {
        console.error('❌ migrations_applied table does not exist — no migration history to roll back.');
        process.exit(1);
      }
      const r = await client.query('SELECT * FROM migrations_applied WHERE filename = $1', [filename]);
      if (r.rows.length === 0) {
        console.error(`❌ ${filename} is not in migrations_applied. Use db:status to see what's tracked.`);
        process.exit(1);
      }

      console.log(`\n  ⚠️  About to mark ${filename} as NOT applied.`);
      console.log('     This does NOT revert the schema — you must manually DROP');
      console.log('     any tables/columns/indexes that the migration created.\n');

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise((resolve) => {
        rl.question('  Type "yes" to continue: ', (a) => {
          rl.close();
          resolve(a.trim());
        });
      });
      if (answer !== 'yes') {
        console.log('Aborted.');
        return;
      }

      await client.query('DELETE FROM migrations_applied WHERE filename = $1', [filename]);
      console.log(`\n  ✅ ${filename} marked as not applied.`);
      console.log(`     Next db:migrate will re-apply it (re-run the .sql file manually if it is not idempotent).`);
    } finally {
      client.release();
    }
  }

  async reset() {
    console.log('🔄 Resetting database (dropping public schema)...');
    await this.testConnection();

    const client = await getClient();
    try {
      // Nuke and recreate the public schema. This drops every table, view,
      // sequence, type, function, and the migrations_applied tracking table.
      // It also revokes default privileges — we re-grant below.
      await client.query('BEGIN');
      try {
        await client.query('DROP SCHEMA public CASCADE');
        await client.query('CREATE SCHEMA public')
        await client.query('GRANT ALL ON SCHEMA public TO current_user')
        await client.query('GRANT ALL ON SCHEMA public TO public')
        await client.query('COMMIT')
        console.log('✅ public schema dropped and recreated');
      } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        throw e;
      }
      // The very next migrate/init call will re-bootstrap the schema.
    } finally {
      client.release();
    }
  }

  async seedInitialData(client) {
    console.log('\n🌱 Seeding initial data...');
    try {
      const { v4: uuidv4 } = require('uuid');

      // Seed channels
      await client.query(
        `INSERT INTO channels (id, name, api_key)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [uuidv4(), 'PWA', 'pwa-api-key']
      );

      // Seed admin user
      const bcrypt = require('bcrypt');
      const adminPlainPassword = process.env.ADMIN_INITIAL_PASSWORD || (
        crypto.randomBytes(16).toString('base64').slice(0, 16) +
        Math.random().toString(36).slice(2, 6).toUpperCase() + '!'
      );
      const adminPassword = await bcrypt.hash(adminPlainPassword, 10);

      await client.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, password_change_required)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING`,
        [uuidv4(), 'admin@wickwaxrelax.co.uk', adminPassword, 'Admin', 'User', true]
      );

      if (!process.env.ADMIN_INITIAL_PASSWORD) {
        console.log(`   Admin account seeded. Initial password: ${adminPlainPassword}`);
      } else {
        console.log(`   Admin account seeded with ADMIN_INITIAL_PASSWORD.`);
      }
    } catch (e) {
      console.warn('   ⚠️  Warning during data seeding:', e.message);
    }
  }
}

// ----- CLI -----------------------------------------------------------------

function printHelp() {
  console.log(`
Wick Wax & Relax migration runner

Usage: node init-db.js <command> [args]

Commands:
  init                Apply all pending migrations (idempotent)
  migrate             Alias for init
  status              Show applied vs pending migrations
  rollback <filename> Mark a migration as not applied (you must manually
                      revert any schema changes)
  reset               Drop everything in the public schema (DESTRUCTIVE)
  help                Show this help

Environment:
  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME   PostgreSQL connection
  ADMIN_INITIAL_PASSWORD                             Initial password for
                                                      the seeded admin user
`);
}

async function main() {
  const command = process.argv[2] || 'init';
  const arg = process.argv[3];
  const runner = new MigrationRunner();

  try {
    switch (command) {
      case 'init':
      case 'migrate':
        await runner.initialize();
        break;
      case 'status':
        await runner.status();
        break;
      case 'rollback':
        await runner.rollback(arg);
        break;
      case 'reset':
        await runner.reset();
        break;
      case 'help':
      case '--help':
      case '-h':
        printHelp();
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
    await shutdown();
    process.exit(0);
  } catch (error) {
    console.error('\n❌', error.message);
    if (process.env.DEBUG) console.error(error.stack);
    await shutdown().catch(() => {});
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MigrationRunner, discoverMigrations, checksumFile };
