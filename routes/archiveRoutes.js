// routes/archiveRoutes.js
const express = require('express');
const router = express.Router();
const { cookieJwtAuth } = require('../middleware/cookieJWTAuth');
const { uploadArchives } = require('../middleware/uploadMiddleware');
const { createArchiveItem, getArchives, deleteArchiveItem } = require('../controllers/archiveControllers');

// GET /api/v1/archives
router.get('/archives', cookieJwtAuth, getArchives);

// POST /api/v1/archives
router.post('/archives', cookieJwtAuth, uploadArchives.single('archiveFile'), createArchiveItem);

// DELETE /api/v1/archives/:id
router.delete('/archives/:id', cookieJwtAuth, deleteArchiveItem);

module.exports = router;
