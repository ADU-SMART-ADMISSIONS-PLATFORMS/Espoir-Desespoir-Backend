const db = require('../models/db');
const upload = require('../middlewares/upload');
const jwt = require('jsonwebtoken');

// ====================== FONCTIONS CANDIDATURES ======================

// Soumettre une candidature (infos + fichiers)
async function submitApplication(req, res) {
  const user_id = req.user.id;
  const { 
    program_id,
    nom,
    prenom,
    date_naissance,
    sexe,
    telephone,
    email,
    ville_quartier,
    dernier_diplome,
    annee_diplome,
    motivation_letter,
    previous_education,
    comment_connu_adu,
    souhaite_recontact
  } = req.body;
  // Log minimal pour diagnostiquer les problèmes de soumission (ne pas loguer de données sensibles)
  try {
    console.log('Soumission candidature - champs reçus:', Object.keys(req.body));
    console.log('Soumission candidature - fichiers reçus:', req.files ? Object.keys(req.files) : []);
  } catch (_) {}

  // Validation minimale selon le schéma actuel de la table Application
  const requiredFields = { program_id };
  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => value === undefined || value === null || String(value).trim() === '')
    .map(([key]) => key);
  if (missingFields.length > 0) {
    return res.status(400).json({
      message: 'Champs manquants ou vides',
      missing: missingFields
    });
  }
  try {
    const [programCheck] = await db.promise().query('SELECT program_id FROM Program WHERE program_id = ?', [program_id]);
    if (programCheck.length === 0) {
      return res.status(404).json({ message: 'Programme non trouvé' });
    }
    const [existingApplication] = await db.promise().query(
      'SELECT application_id FROM Application WHERE user_id = ?',
      [user_id]
    );
    if (existingApplication.length > 0) {
      return res.status(400).json({
        message: 'Vous avez déjà soumis une candidature. Vous ne pouvez candidater qu\'une seule fois.'
      });
    }
    const application_number = `APP-${Date.now()}-${user_id}`;
    let result;
    try {
      [result] = await db.promise().query(
        `INSERT INTO Application (
          user_id, program_id, application_number, status, submitted_at,
          date_naissance, sexe, telephone, email, ville_quartier,
          dernier_diplome, annee_diplome, motivation_letter, previous_education,
          comment_connu_adu, souhaite_recontact
        ) VALUES (?, ?, ?, 'pending', NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id, program_id, application_number,
          date_naissance || null,
          sexe || null,
          telephone || null,
          email || null,
          ville_quartier || null,
          dernier_diplome || null,
          annee_diplome || null,
          motivation_letter || null,
          previous_education || null,
          comment_connu_adu || null,
          souhaite_recontact || null
        ]
      );
    } catch (insertErr) {
      // Fallback: bases qui n'ont pas encore les colonnes étendues
      if (insertErr && insertErr.code === 'ER_BAD_FIELD_ERROR') {
        [result] = await db.promise().query(
          `INSERT INTO Application (
            user_id, program_id, application_number, status, submitted_at
          ) VALUES (?, ?, ?, 'pending', NOW())`,
          [user_id, program_id, application_number]
        );
      } else {
        throw insertErr;
      }
    }
    const applicationId = result.insertId;
    // Assurer que req.files est défini même si aucun fichier n'est envoyé
    const files = req.files || {};
    const docs = [];
    for (const [field, arr] of Object.entries(files)) {
      if (!arr || arr.length === 0) {
        continue;
      }
      const file = arr[0];
      if (!file) {
        continue;
      }
      docs.push([
        applicationId,
        file.originalname,
        `/uploads/${file.filename}`,
        field,
        'pending'
      ]);
    }
    if (docs.length > 0) {
      await db.promise().query(
        `INSERT INTO Document (application_id, original_name, file_path, type, verification_status)
         VALUES ?`,
        [docs]
      );
    }
    res.status(201).json({ message: 'Candidature soumise avec succès', id: applicationId });
  } catch (err) {
    console.error('Erreur soumission candidature:', err);
    // Retour plus détaillé pour faciliter le diagnostic en dev (à restreindre en prod)
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: {
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage
      }
    });
  }
}

// Récupérer ses candidatures (applicant)
async function getMyApplications(req, res) {
  try {
    const [rows] = await db.promise().query(
      `SELECT a.*, p.name AS program_name 
       FROM Application a 
       JOIN Program p ON a.program_id = p.program_id 
       WHERE a.user_id = ? 
       ORDER BY a.submitted_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Erreur récupération candidatures:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// Toutes les candidatures (officers et coordinateurs)
async function getAllApplications(req, res) {
  try {
    const [rows] = await db.promise().query(
      `SELECT 
          a.application_id, a.user_id, a.program_id, a.application_number, a.status, a.submitted_at,
          a.eligibility_score, a.admission_decision_date,
          p.name AS program_name,
          u.first_name, u.last_name, u.email AS user_email, u.phone_number AS user_phone_number,
          u.last_name AS display_nom,
          u.first_name AS display_prenom,
          u.email AS display_email,
          u.phone_number AS display_telephone
       FROM Application a 
       LEFT JOIN Program p ON a.program_id = p.program_id 
       LEFT JOIN users u ON a.user_id = u.user_id
       ORDER BY a.submitted_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Erreur récupération candidatures:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// Détail d'une candidature (officer, coordinateurs et étudiants)
async function getApplicationDetail(req, res) {
  const { id } = req.params;
  try {
    let query;
    let params;
    if (req.user.role === 'student') {
      query = `
        SELECT 
          a.application_id, a.user_id, a.program_id, a.application_number, a.status, a.submitted_at,
          a.eligibility_score, a.admission_decision_date,
          p.name AS program_name,
          a.date_naissance, a.sexe, a.telephone, a.email, a.ville_quartier,
          a.dernier_diplome, a.annee_diplome, a.motivation_letter, a.previous_education,
          a.comment_connu_adu, a.souhaite_recontact,
          u.first_name, u.last_name, u.email AS user_email, u.phone_number AS user_phone_number,
          u.last_name AS display_nom,
          u.first_name AS display_prenom,
          u.email AS display_email,
          u.phone_number AS display_telephone
        FROM Application a
        LEFT JOIN Program p ON a.program_id = p.program_id
        LEFT JOIN users u ON a.user_id = u.user_id
        WHERE a.application_id = ? AND a.user_id = ?
      `;
      params = [id, req.user.id];
    } else if (req.user.role === 'officer' || req.user.role === 'admin') {
      query = `
        SELECT 
          a.application_id, a.user_id, a.program_id, a.application_number, a.status, a.submitted_at,
          a.eligibility_score, a.admission_decision_date,
          p.name AS program_name,
          a.date_naissance, a.sexe, a.telephone, a.email, a.ville_quartier,
          a.dernier_diplome, a.annee_diplome, a.motivation_letter, a.previous_education,
          a.comment_connu_adu, a.souhaite_recontact,
          u.first_name, u.last_name, u.email AS user_email, u.phone_number AS user_phone_number,
          u.last_name AS display_nom,
          u.first_name AS display_prenom,
          u.email AS display_email,
          u.phone_number AS display_telephone
        FROM Application a
        LEFT JOIN Program p ON a.program_id = p.program_id
        LEFT JOIN users u ON a.user_id = u.user_id
        WHERE a.application_id = ?
      `;
      params = [id];
    } else {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    let rows;
    try {
      [rows] = await db.promise().query(query, params);
    } catch (selectErr) {
      // Fallback si certaines colonnes n'existent pas encore dans la base
      if (selectErr && selectErr.code === 'ER_BAD_FIELD_ERROR') {
        const fallbackQuery = req.user.role === 'student'
          ? `
            SELECT 
              a.application_id, a.user_id, a.program_id, a.application_number, a.status, a.submitted_at,
              a.eligibility_score, a.admission_decision_date,
              p.name AS program_name,
              u.first_name, u.last_name, u.email AS user_email, u.phone_number AS user_phone_number,
              u.last_name AS display_nom,
              u.first_name AS display_prenom,
              u.email AS display_email,
              u.phone_number AS display_telephone
            FROM Application a
            LEFT JOIN Program p ON a.program_id = p.program_id
            LEFT JOIN users u ON a.user_id = u.user_id
            WHERE a.application_id = ? AND a.user_id = ?
          `
          : `
            SELECT 
              a.application_id, a.user_id, a.program_id, a.application_number, a.status, a.submitted_at,
              a.eligibility_score, a.admission_decision_date,
              p.name AS program_name,
              u.first_name, u.last_name, u.email AS user_email, u.phone_number AS user_phone_number,
              u.last_name AS display_nom,
              u.first_name AS display_prenom,
              u.email AS display_email,
              u.phone_number AS display_telephone
            FROM Application a
            LEFT JOIN Program p ON a.program_id = p.program_id
            LEFT JOIN users u ON a.user_id = u.user_id
            WHERE a.application_id = ?
          `;
        const fallbackParams = req.user.role === 'student' ? [id, req.user.id] : [id];
        [rows] = await db.promise().query(fallbackQuery, fallbackParams);
      } else {
        throw selectErr;
      }
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Erreur récupération détail candidature:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// Mettre à jour le statut d'une candidature (officers et coordinateurs)
async function updateApplicationStatus(req, res) {
  const { status } = req.body;
  const { id } = req.params;
  if (!['pending', 'under_review', 'interview', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Statut invalide' });
  }
  try {
    const [application] = await db.promise().query(
      `SELECT a.*, u.email, u.first_name, u.last_name, p.name as program_name 
       FROM Application a 
       LEFT JOIN users u ON a.user_id = u.user_id 
       LEFT JOIN Program p ON a.program_id = p.program_id 
       WHERE a.application_id = ?`,
      [id]
    );
    if (application.length === 0) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    const candidature = application[0];
    const [result] = await db.promise().query(
      'UPDATE Application SET status = ? WHERE application_id = ?',
      [status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    // Créer automatiquement une notification pour le candidat
    const statusLabels = {
      'pending': 'en attente',
      'under_review': 'en cours d\'examen',
      'interview': 'en attente d\'entretien',
      'accepted': 'acceptée',
      'rejected': 'rejetée'
    };
    const statusLabel = statusLabels[status] || status;
    const notificationMessage = `Votre candidature pour ${candidature.program_name || 'le programme'} a été ${statusLabel}.`;
    const notificationTitle = `Mise à jour de votre candidature`;
    await db.promise().query(
      `INSERT INTO Notification (user_id, application_id, title, message, type) 
       VALUES (?, ?, ?, ?, ?)`,
      [candidature.user_id, id, notificationTitle, notificationMessage, 'status_update']
    );
    res.json({
      message: `Statut mis à jour: ${status}`,
      notification_sent: true,
      recipient: candidature.email
    });
  } catch (err) {
    console.error('Erreur mise à jour statut:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// Upload de documents pour une candidature
async function uploadDocuments(req, res) {
  const applicationId = req.params.id;
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: 'Aucun fichier reçu' });
  }
  try {
    const [appCheck] = await db.promise().query(
      'SELECT application_id FROM Application WHERE application_id = ? AND user_id = ?',
      [applicationId, req.user.id]
    );
    if (appCheck.length === 0) {
      return res.status(404).json({ message: 'Candidature non trouvée ou accès non autorisé' });
    }
    const documents = [];
    for (const [field, files] of Object.entries(req.files)) {
      const file = files[0];
      if (file) {
        documents.push([
          applicationId,
          file.originalname,
          `/uploads/${file.filename}`,
          field,
          'pending'
        ]);
      }
    }
    if (documents.length > 0) {
      await db.promise().query(
        `INSERT INTO Document (application_id, original_name, file_path, type, verification_status)
         VALUES ?`,
        [documents]
      );
    }
    res.status(201).json({ message: 'Documents uploadés avec succès' });
  } catch (err) {
    console.error('Erreur upload documents:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// Retourner la liste des documents d'une candidature
async function getApplicationDocuments(req, res) {
  const applicationId = req.params.id;
  try {
    const [rows] = await db.promise().query(
      'SELECT document_id, original_name, file_path, type, verification_status FROM Document WHERE application_id = ?',
      [applicationId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Erreur récupération documents:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// Évaluation de candidature (coordinateurs)
async function evaluateApplication(req, res) {
  const applicationId = req.params.id;
  const { note, commentaire, decision } = req.body;
  if (!note || !commentaire || !decision) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }
  try {
    const [application] = await db.promise().query(
      `SELECT a.*, u.email, u.first_name, u.last_name, p.name as program_name 
       FROM Application a 
       LEFT JOIN users u ON a.user_id = u.user_id 
       LEFT JOIN Program p ON a.program_id = p.program_id 
       WHERE a.application_id = ?`,
      [applicationId]
    );
    if (application.length === 0) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    const candidature = application[0];
    await db.promise().query(
      'UPDATE Application SET status = ? WHERE application_id = ?',
      [decision, applicationId]
    );
    const statusLabels = {
      'pending': 'en attente',
      'under_review': 'en cours d\'examen',
      'interview': 'en attente d\'entretien',
      'accepted': 'acceptée',
      'rejected': 'rejetée'
    };
    const statusLabel = statusLabels[decision] || decision;
    const notificationMessage = `Votre candidature pour ${candidature.program_name || 'le programme'} a été évaluée et ${statusLabel}. Note: ${note}/20. Commentaire: ${commentaire}`;
    const notificationTitle = `Évaluation de votre candidature`;
    await db.promise().query(
      `INSERT INTO Notification (user_id, application_id, title, message, type) 
       VALUES (?, ?, ?, ?, ?)`,
      [candidature.user_id, applicationId, notificationTitle, notificationMessage, 'evaluation']
    );
    res.json({
      message: 'Évaluation soumise avec succès',
      evaluation: { note, commentaire, decision },
      notification_sent: true,
      recipient: candidature.email
    });
  } catch (err) {
    console.error('Erreur évaluation candidature:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// Envoyer une notification au candidat
async function notifyApplicant(req, res) {
  const applicationId = req.params.id;
  const { message, type = 'info' } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Message requis' });
  }
  try {
    const [application] = await db.promise().query(
      `SELECT a.*, u.email, u.first_name, u.last_name 
       FROM Application a 
       LEFT JOIN users u ON a.user_id = u.user_id 
       WHERE a.application_id = ?`,
      [applicationId]
    );
    if (application.length === 0) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }
    const candidature = application[0];
    const [result] = await db.promise().query(
      `INSERT INTO Notification (user_id, application_id, title, message, type) 
       VALUES (?, ?, ?, ?, ?)`,
      [candidature.user_id, applicationId, 'Nouvelle notification', message, type]
    );
    res.json({
      message: 'Notification envoyée avec succès',
      recipient: candidature.email,
      content: message,
      notification_id: result.insertId
    });
  } catch (err) {
    console.error('Erreur envoi notification:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = {
  submitApplication,
  getMyApplications,
  getAllApplications,
  getApplicationDetail,
  updateApplicationStatus,
  uploadDocuments,
  getApplicationDocuments,
  evaluateApplication,
  notifyApplicant
};
