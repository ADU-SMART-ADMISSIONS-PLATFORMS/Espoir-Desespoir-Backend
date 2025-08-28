const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');
const authenticateToken = require('../middlewares/authenticateToken');
const requireRole = require('../middlewares/requireRole');

router.get('/', programController.listPrograms);
router.post('/', authenticateToken, programController.addProgram);
router.put('/:id', authenticateToken, programController.updateProgram);
router.delete('/:id', authenticateToken, requireRole('officer'), programController.deleteProgram);

module.exports = router;
