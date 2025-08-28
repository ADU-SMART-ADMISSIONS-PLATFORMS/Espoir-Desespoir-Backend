const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const SECRET_KEY = 'supersecret123';

exports.register = async (req, res) => {
  const {
    first_name, last_name, email, password,
    date_of_birth, country_of_birth, nationality,
    address, phone_number,
    guardian_name, guardian_phone, guardian_address
  } = req.body;
  try {
    console.log('POST /api/auth/register payload:', {
      first_name, last_name, email,
      date_of_birth, country_of_birth, nationality,
      address, phone_number,
      guardian_name_present: Boolean(guardian_name),
      guardian_phone_present: Boolean(guardian_phone),
      guardian_address_present: Boolean(guardian_address)
    });
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }
    let role = 'student';
    const emailLower = email.toLowerCase();
    if (emailLower.endsWith('@ilimi.edu.ne')) {
      if (emailLower.startsWith('officer')) role = 'officer';
      else if (emailLower.startsWith('admin')) role = 'admin';
    }
    if (role === 'student') {
      if (!guardian_name || !guardian_phone || !guardian_address) {
        return res.status(400).json({
          message: 'Les informations du tuteur sont obligatoires pour les étudiants.'
        });
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.promise().query(
      `INSERT INTO users (
        first_name, last_name, email, password, role,
        date_of_birth, country_of_birth, nationality,
        address, phone_number,
        guardian_name, guardian_phone, guardian_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name, last_name, email, hashedPassword, role,
        date_of_birth, country_of_birth, nationality,
        address, phone_number,
        role === 'student' ? guardian_name : '',
        role === 'student' ? guardian_phone : '',
        role === 'student' ? guardian_address : ''
      ]
    );
    res.status(201).json({ 
      message: 'Inscription réussie', 
      role,
      userId: result.insertId 
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    } else {
      res.status(500).json({ message: 'Erreur lors de l\'inscription', details: err.message });
    }
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }
    const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email non trouvé' });
    }
    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }
    let expectedRole = 'student';
    const emailLower = email.toLowerCase();
    if (emailLower.endsWith('@ilimi.edu.ne')) {
      if (emailLower.startsWith('officer')) expectedRole = 'officer';
      else if (emailLower.startsWith('admin')) expectedRole = 'admin';
    }
    if (user.role !== expectedRole) {
      return res.status(403).json({
        message: `Rôle invalide pour cet email. Attendu: '${expectedRole}', trouvé: '${user.role}'`
      });
    }
    // Met à jour la dernière connexion (ignorer silencieusement si la colonne n'existe pas)
    try {
      await db.promise().query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);
    } catch (updateErr) {
      console.warn('Impossible de mettre à jour last_login (colonne manquante ?):', updateErr.code || updateErr.message);
      // Ne pas interrompre le processus de connexion si la colonne n'existe pas
    }

    const token = jwt.sign(
      { id: user.user_id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    delete user.password;
    // Récupère l'utilisateur mis à jour pour inclure last_login
    const [updatedRows] = await db.promise().query('SELECT * FROM users WHERE user_id = ?', [user.user_id]);
    const updatedUser = updatedRows[0] || user;
    if (updatedUser) delete updatedUser.password;
    res.json({ token, user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM users WHERE user_id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    const user = rows[0];
    delete user.password;
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
