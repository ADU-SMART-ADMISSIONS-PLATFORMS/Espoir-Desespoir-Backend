const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Seuls les fichiers PDF, JPG, JPEG, PNG sont autorisés'));
    }
    cb(null, true);
  }
});

module.exports = upload;
