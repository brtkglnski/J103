/**
 * Multer middleware for handling avatar uploads
 *
 * - Stores uploaded files in 'public/uploads'
 * - File names are prefixed with the user's session ID and a timestamp to avoid collisions
 * - Only allows image files (based on MIME type)
 * - Limits file size to 5 MB
 *
 * Usage in routes:
 *   router.post('/profile/:slug/edit', uploadAvatar.single('profileImage'), controller.updateProfile);
 */

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${req.session.userId}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images allowed'), false);
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});
