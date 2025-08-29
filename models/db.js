// models/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

function resolveConfig() {
  // Supporte soit tes variables DB_*, soit celles auto de Railway (MYSQL*)
  const cfg = {
    host: process.env.DB_HOST || process.env.MYSQLHOST,
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
    database: process.env.DB_NAME || process.env.MYSQLDATABASE,
    multipleStatements: true,
    // N’active l’SSL que si demandé (évite des erreurs inutiles)
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  };

  // Fallback : si Railway te donne une URL publique (ex: MYSQLPUBLICURL)
  if (process.env.MYSQLPUBLICURL && (!cfg.host || !cfg.user)) {
    try {
      const url = new URL(process.env.MYSQLPUBLICURL.replace('mysql://', 'http://'));
      cfg.host = cfg.host || url.hostname;
      cfg.port = cfg.port || Number(url.port || 3306);
      cfg.user = cfg.user || decodeURIComponent(url.username);
      cfg.password = cfg.password || decodeURIComponent(url.password);
      const dbname = url.pathname.replace('/', '');
      if (!cfg.database && dbname) cfg.database = dbname;
    } catch (_) {}
  }

  return cfg;
}

let pool;

async function initDb() {
  const cfg = resolveConfig();

  console.log('🧩 Config DB détectée (sanitisée) :', {
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    database: cfg.database,
    ssl: !!cfg.ssl,
  });

  try {
    pool = mysql.createPool({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: cfg.multipleStatements,
      ssl: cfg.ssl,
    });

    // Test simple
    await pool.query('SELECT 1');
    console.log('✅ Connecté à MySQL');
    return pool;
  } catch (err) {
    console.error('🔥 ERREUR connexion MySQL :', err && (err.stack || err));
    throw err;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('DB non initialisée. Appelle initDb() d’abord.');
  }
  return pool;
}

async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { initDb, getPool, closeDb };
