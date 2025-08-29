// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const { initDb, getPool, closeDb } = require('./models/db');

const authRoutes = require('./routes/authRoutes');
const programRoutes = require('./routes/programRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(bodyParser.json());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);

// Ping simple
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'API ADU Admissions' });
});

// Endpoints de debug (temporaires – à supprimer ensuite)
app.get('/debug/env', (req, res) => {
  res.json({
    PORT: process.env.PORT || '(non défini)',
    FRONTEND_URL: process.env.FRONTEND_URL || '(non défini)',
    DB_HOST: process.env.DB_HOST || process.env.MYSQLHOST || '(non défini)',
    DB_PORT: process.env.DB_PORT || process.env.MYSQLPORT || '(non défini)',
    DB_USER: process.env.DB_USER || process.env.MYSQLUSER || '(non défini)',
    DB_NAME: process.env.DB_NAME || process.env.MYSQLDATABASE || '(non défini)',
    DB_SSL: process.env.DB_SSL || 'false',
  });
});

app.get('/health', async (_req, res) => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    res.json({ db: 'up' });
  } catch (e) {
    res.status(500).json({ db: 'down', error: e && (e.message || e) });
  }
});

let server;

(async () => {
  try {
    await initDb(); // essaie de connecter la DB

    server = app.listen(PORT, () => {
      console.log(`✅ Serveur démarré sur le port ${PORT}`);
    });
  } catch (err) {
    // IMPORTANT : log complet, sans filtrer
    console.error('❌ Impossible de démarrer le serveur (boot) :', err && (err.stack || err));
    // On démarre quand même le serveur pour voir /debug/env depuis Railway
    server = app.listen(PORT, () => {
      console.warn(`⚠️ Serveur démarré SANS DB sur le port ${PORT} pour debug.`);
      console.warn('👉 Ouvre /debug/env et /health pour diagnostiquer.');
    });
  }
})();

// Arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt...');
  try {
    await closeDb();
    console.log('✅ Pool MySQL fermé');
  } catch (_) {}
  if (server) server.close(() => process.exit(0));
});
