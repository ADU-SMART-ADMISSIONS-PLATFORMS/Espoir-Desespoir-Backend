const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

// Charger le script SQL (optionnel si tu veux créer tes tables automatiquement)
const initScript = fs.existsSync("init.sql") ? fs.readFileSync("init.sql", "utf-8") : null;

async function initDb() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    multipleStatements: true
  });

  console.log("✅ Connecté à la base MySQL Railway");

  if (initScript) {
    await connection.query(initScript);
    console.log("✅ Script init.sql exécuté");
  }

  return connection;
}

// ✅ Exporter la fonction pour pouvoir l’utiliser dans server.js
module.exports = { initDb };
