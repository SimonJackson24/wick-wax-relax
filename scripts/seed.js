#!/usr/bin/env node

/**
 * Database seed runner for Wick Wax & Relax.
 *
 * Refuses to seed if any migration has not been applied. The actual
 * seed step (inserting demo products, variants, categories, etc.) is
 * delegated to scripts/seed-demo-products.js, which has been the
 * project's seed script since 2025-11-22.
 *
 * Usage:
 *   npm run db:seed         (from backend/)
 *   node scripts/seed.js    (from project root)
 *
 * Required env (auto-loaded from backend/.env if dotenv is present):
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 *
 * Exit codes:
 *   0  seed succeeded
 *   1  migrations_applied table missing — run `npm run db:migrate` first
 *   1  one or more migrations missing — run `npm run db:migrate` first
 *   1  seed-demo-products.js failed (non-zero exit)
 *   1  connection or other error
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Auto-load .env from backend/ so this script works in dev without
// exporting env vars manually. Production deploys inject env vars via
// the orchestrator (Docker, systemd, CloudPanel) and dotenv is a no-op
// when the vars are already set.
try {
  require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
} catch (_) {
  // dotenv not installed; assume env is provided externally
}

const { query, shutdown } = require('../backend/config/database');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

/**
 * Discover all .sql migration files on disk. Same approach as
 * backend/init-db.js: dynamic fs.readdirSync sorted lexicographically.
 */
function discoverMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

/**
 * Verify that every migration on disk has been recorded in the
 * migrations_applied tracking table. Throws with a clear, actionable
 * error if anything is missing.
 *
 * @returns {Promise<number>} the number of migrations confirmed applied
 */
async function checkMigrationsApplied() {
  // 1. Discover all .sql files in migrations/
  const allMigrations = discoverMigrations();
  if (allMigrations.length === 0) {
    throw new Error('No migrations found in migrations/ directory');
  }

  // 2. Check if the migrations_applied tracking table exists. It is
  //    created by migration 017, so a missing table means the runner
  //    has never been used here — the operator should run db:migrate
  //    (which will create the table as part of applying 017, then
  //    backfill tracking rows for already-applied migrations).
  const tableCheck = await query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'migrations_applied'
    ) AS exists
  `);

  if (!tableCheck.rows[0].exists) {
    throw new Error(
      'migrations_applied tracking table does not exist.\n' +
      'Run `npm run db:migrate` first to apply all migrations and\n' +
      'create the tracking table (created by migration 017).'
    );
  }

  // 3. Read applied migrations from the tracking table
  const applied = await query(`
    SELECT filename
      FROM migrations_applied
     ORDER BY filename
  `);
  const appliedSet = new Set(applied.rows.map((r) => r.filename));

  // 4. Diff: which migrations on disk are NOT in the tracking table?
  const missing = allMigrations.filter((m) => !appliedSet.has(m));
  if (missing.length > 0) {
    throw new Error(
      `${missing.length} migration(s) on disk have not been applied:\n  ` +
      missing.join('\n  ') +
      '\n\nRun `npm run db:migrate` first to apply pending migrations.'
    );
  }

  return allMigrations.length;
}

/**
 * Spawn the existing seed-demo-products.js as a child process and
 * forward its stdio to the parent. Returns when the child exits.
 *
 * Why spawn instead of import: scripts/seed-demo-products.js currently
 * creates its own pg.Pool using a hardcoded absolute path to
 * backend/node_modules. Refactoring that file is out of scope for 1.3
 * (the seed runner), so we keep it as a black box and just gate its
 * execution on the migrations check. The hardcoded path is a known
 * portability bug tracked separately.
 *
 * @returns {Promise<void>}
 */
function runSeedScript() {
  return new Promise((resolve, reject) => {
    const seedScript = path.join(__dirname, 'seed-demo-products.js');
    if (!fs.existsSync(seedScript)) {
      reject(new Error(`Seed script not found: ${seedScript}`));
      return;
    }
    const child = spawn('node', [seedScript], {
      stdio: 'inherit',
      env: process.env,  // forward the env we loaded from .env
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`seed-demo-products.js exited with code ${code}`));
    });
    child.on('error', (err) => reject(err));
  });
}

async function main() {
  console.log('=== Wick Wax & Relax — Database Seed Runner ===\n');

  let migrationCount = 0;
  try {
    migrationCount = await checkMigrationsApplied();
    console.log(`✓ All ${migrationCount} migrations applied`);
    console.log('Starting seed (delegating to scripts/seed-demo-products.js)...\n');

    await runSeedScript();

    console.log('\n✓ Seed complete');
  } catch (e) {
    console.error('\n✗ Seed failed:');
    console.error(`  ${e.message}`);
    if (migrationCount === 0) {
      // Migration check failed — hint to the operator
      console.error('\n  Hint: run `npm run db:migrate` from backend/ first.');
    }
    process.exit(1);
  } finally {
    // Best-effort shutdown of the pool we used for the migrations check
    await shutdown();
  }
}

main();
