const Redis = require('ioredis');

let client = null;

function getRedis() {
  if (client) return client;

  const url = process.env.REDIS_URL;
  const opts = {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    // TLS for managed Redis (Upstash, Redis Cloud, Elasticache)
    tls: process.env.REDIS_TLS === 'true' ? { rejectUnauthorized: true } : undefined,
  };

  if (url) {
    client = new Redis(url, opts);
  } else {
    client = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      ...opts,
    });
  }

  client.on('error', (err) => {
    // Avoid throwing in callers; the consuming middleware must check isReady().
    // eslint-disable-next-line no-console
    console.error('[redis] error:', err.message);
  });

  return client;
}

function isReady() {
  return client && client.status === 'ready';
}

async function close() {
  if (client) {
    await client.quit().catch(() => {});
    client = null;
  }
}

module.exports = { getRedis, isReady, close };
