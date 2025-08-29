const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDb() {
  try {
    console.log("📡 Tentative de connexion MySQL avec les variables :");
    console.log({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      multipleStatements: true,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log("✅ Connecté à la base MySQL Railway");
    return connection;

  } catch (err) {
    console.error("🔥 ERREUR initDb :", err);  // <= affiche l’erreur brute
    throw err; // on renvoie pour que server.js stoppe
  }
}

module.exports = { initDb };
