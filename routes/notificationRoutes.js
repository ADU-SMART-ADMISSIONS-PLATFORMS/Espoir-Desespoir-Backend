const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticateToken = require('../middlewares/authenticateToken');

// Récupérer les notifications d'un utilisateur
router.get('/', authenticateToken, notificationController.getNotifications);

// Marquer une notification comme lue
router.put('/:id/read', authenticateToken, notificationController.markNotificationAsRead);

// Marquer toutes les notifications comme lues
router.put('/read-all', authenticateToken, notificationController.markAllNotificationsAsRead);

// Compter les notifications non lues
router.get('/unread-count', authenticateToken, notificationController.getUnreadNotificationsCount);

// Créer une notification (officer/applicant)
router.post(
  '/',
  authenticateToken,
  (req, res, next) => {
    if (req.user.role === 'officer' || req.user.role === 'admin') next();
    else res.status(403).json({ message: 'Accès refusé' });
  },
  notificationController.createNotification
);

module.exports = router;
