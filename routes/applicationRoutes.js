const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authenticateToken = require('../middlewares/authenticateToken');
const requireRole = require('../middlewares/requireRole');
const upload = require('../middlewares/upload');

// Soumettre une candidature (infos + fichiers)
router.post(
  '/',
  authenticateToken,
  upload.fields([
    { name: 'diplome_releve', maxCount: 1 },
    { name: 'bulletins', maxCount: 1 },
    { name: 'acte_naissance', maxCount: 1 },
    { name: 'certificat_nationalite', maxCount: 1 }
  ]),
  applicationController.submitApplication
);

// Récupérer ses candidatures
router.get('/my', authenticateToken, applicationController.getMyApplications);

// Toutes les candidatures (officers et coordinateurs)
router.get(
  '/',
  authenticateToken,
  (req, res, next) => {
    if (req.user.role === 'officer' || req.user.role === 'admin') next();
    else res.status(403).json({ message: 'Accès refusé' });
  },
  applicationController.getAllApplications
);

// Détail d'une candidature
router.get('/:id', authenticateToken, applicationController.getApplicationDetail);

// Mettre à jour le statut d'une candidature
router.put(
  '/:id/status',
  authenticateToken,
  (req, res, next) => {
    if (req.user.role === 'officer' || req.user.role === 'admin') next();
    else res.status(403).json({ message: 'Accès refusé' });
  },
  applicationController.updateApplicationStatus
);

// Upload de documents pour une candidature
router.post(
  '/:id/documents',
  authenticateToken,
  upload.fields([
    { name: 'diplome_releve', maxCount: 1 },
    { name: 'bulletins', maxCount: 1 },
    { name: 'acte_naissance', maxCount: 1 },
    { name: 'certificat_nationalite', maxCount: 1 }
  ]),
  applicationController.uploadDocuments
);

// Retourner la liste des documents d'une candidature
router.get('/:id/documents', authenticateToken, applicationController.getApplicationDocuments);

// Évaluation de candidature (coordinateurs)
router.post(
  '/:id/evaluate',
  authenticateToken,
  (req, res, next) => {
    if (req.user.role === 'officer' || req.user.role === 'admin') next();
    else res.status(403).json({ message: 'Accès refusé' });
  },
  applicationController.evaluateApplication
);

// Envoyer une notification au candidat
router.post(
  '/:id/notify',
  authenticateToken,
  (req, res, next) => {
    if (req.user.role === 'officer' || req.user.role === 'admin') next();
    else res.status(403).json({ message: 'Accès refusé' });
  },
  applicationController.notifyApplicant
);

module.exports = router;
