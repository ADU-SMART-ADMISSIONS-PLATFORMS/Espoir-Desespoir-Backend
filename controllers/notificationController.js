const db = require('../models/db');

// ====================== FONCTIONS NOTIFICATIONS ======================

// Récupérer les notifications d'un utilisateur
async function getNotifications(req, res) {
  try {
    const [rows] = await db.promise().query(
      `SELECT n.*, a.program_id, p.name as program_name 
       FROM Notification n 
       LEFT JOIN Application a ON n.application_id = a.application_id 
       LEFT JOIN Program p ON a.program_id = p.program_id 
       WHERE n.user_id = ? 
       ORDER BY n.created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// Marquer une notification comme lue
async function markNotificationAsRead(req, res) {
  const notificationId = req.params.id;
  try {
    await db.promise().query(
      'UPDATE Notification SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
      [notificationId, req.user.id]
    );
    res.json({ message: 'Notification marquée comme lue' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// Marquer toutes les notifications comme lues
async function markAllNotificationsAsRead(req, res) {
  try {
    await db.promise().query(
      'UPDATE Notification SET is_read = TRUE WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// Compter les notifications non lues
async function getUnreadNotificationsCount(req, res) {
  try {
    const [rows] = await db.promise().query(
      'SELECT COUNT(*) as count FROM Notification WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// Créer une notification (utilisé par les officers/coordinateurs)
async function createNotification(req, res) {
  const { user_id, application_id, title, message, type = 'info' } = req.body;
  if (!user_id || !title || !message) {
    return res.status(400).json({ message: 'user_id, title et message requis' });
  }
  try {
    const [result] = await db.promise().query(
      `INSERT INTO Notification (user_id, application_id, title, message, type) 
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, application_id, title, message, type]
    );
    res.status(201).json({ 
      message: 'Notification créée avec succès',
      notification_id: result.insertId
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
  createNotification
};
