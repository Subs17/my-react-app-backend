const express = require('express');
const { loginUser, registerUser, getUserDetails, updateProfilePicture } = require('../controllers/userControllers');
const { cookieJwtAuth } = require('../middleware/cookieJWTAuth');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

// User POST routes
router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/user/profile-picture', cookieJwtAuth, upload.single('profilePicture'), updateProfilePicture);

// User GET routes
router.get('/user', cookieJwtAuth, getUserDetails );

module.exports = router;
