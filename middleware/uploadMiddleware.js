// uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ensure subfolders exist if needed
const profileDir = 'uploads/profilepictures';
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

const storageProfile = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const uploadProfile = multer({ storage: storageProfile });

// If you also have archives:
const archivesDir = 'uploads/archives';
if (!fs.existsSync(archivesDir)) {
  fs.mkdirSync(archivesDir, { recursive: true });
}

const storageArchives = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, archivesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});
const uploadArchives = multer({ storage: storageArchives });

// Export them
module.exports = {
  uploadProfile,
  uploadArchives
};
