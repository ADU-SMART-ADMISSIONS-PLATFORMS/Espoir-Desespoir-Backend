const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./models/db');
const authRoutes = require('./routes/authRoutes');
const programRoutes = require('./routes/programRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000; // ✅ utilise la variable d’environnement

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL || 'https://espoir-frontend.vercel.app' // ✅ FRONTEND_URL mis dans .env
  ],
  credentials: true
}));

app.use(bodyParser.json());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);

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

app.listen(PORT, () => {
  console.log(`✅ Serveur backend lancé sur http://localhost:${PORT}`);
  console.log(`📁 Fichiers statiques: http://localhost:${PORT}/uploads/`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Le port ${PORT} est déjà utilisé.`);
    console.log('💡 Solutions:');
    console.log('   - Arrêtez le processus utilisant ce port');
    console.log(`   - Ou changez le PORT dans ce fichier ou .env`);
  } else {
    console.error('❌ Erreur serveur:', err);
  }
});

process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  db.end(() => {
    console.log('✅ Connexion MySQL fermée');
    process.exit(0);
  });
});
