const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initDb } = require('./models/db'); // ✅ importer la fonction d’init
const authRoutes = require('./routes/authRoutes');
const programRoutes = require('./routes/programRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000; // ✅ variable d’environnement

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL // ← mets ça dans ton .env
  ],
  credentials: true
}));

app.use(bodyParser.json());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);

// ✅ Route test
app.get('/', (req, res) => {
  res.json({
    message: 'API ADU Admissions - Serveur fonctionnel',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth/*',
      programs: '/api/programs',
      applications: '/api/applications',
      docs: '/uploads/*'
    }
  });
});

// ✅ Lancer serveur SEULEMENT si la DB est OK

let db; // déclaration globale

(async () => {
  try {
    db = await initDb(); // on l’affecte ici
    console.log("✅ Base de données connectée");

    app.listen(PORT, () => {
      console.log(`✅ Serveur backend lancé sur http://localhost:${PORT}`);
      console.log(`📁 Fichiers statiques: http://localhost:${PORT}/uploads/`);
    });
  } catch (err) {
    console.error("❌ Impossible de démarrer le serveur :", err);
    process.exit(1); // on arrête le serveur si la DB échoue
  }
})();

// ✅ Fermer proprement
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  if (db && db.end) {
    await db.end();
    console.log('✅ Connexion MySQL fermée');
  }
  process.exit(0);
});
