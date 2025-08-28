const db = require('../models/db');

exports.listPrograms = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM Program ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.addProgram = async (req, res) => {
  const { name, capacity, description, requirements, level, duration_years, tuition_fee } = req.body;
  if (req.user.role !== 'admin' && req.user.role !== 'officer') {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  if (!name) {
    return res.status(400).json({ message: 'Nom requis' });
  }
  try {
    const [result] = await db.promise().query(
      'INSERT INTO Program (name, description, requirements, level, duration_years, tuition_fee) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || null, requirements || null, level || null, duration_years || null, tuition_fee || null]
    );
    res.status(201).json({ 
      message: 'Programme ajouté', 
      id: result.insertId 
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour un programme
exports.updateProgram = async (req, res) => {
  const programId = req.params.id;
  const { name, description, requirements, level, duration_years, tuition_fee } = req.body;

  if (req.user.role !== 'admin' && req.user.role !== 'officer') {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Nom requis' });
  }

  try {
    const [result] = await db.promise().query(
      `UPDATE Program 
       SET name = ?, description = ?, requirements = ?, level = ?, duration_years = ?, tuition_fee = ?
       WHERE program_id = ?`,
      [name.trim(), description || null, requirements || null, level || null, duration_years || null, tuition_fee || null, programId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Programme non trouvé' });
    }
    res.json({ message: 'Programme mis à jour' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.deleteProgram = async (req, res) => {
  const programId = req.params.id;
  try {
    const [result] = await db.promise().query('DELETE FROM Program WHERE program_id = ?', [programId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Programme non trouvé' });
    }
    res.json({ message: 'Programme supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
