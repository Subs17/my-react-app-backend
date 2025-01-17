 const express = require('express');
 const { loginUser, registerUser } = require('../controllers/userControllers');
 const router = express.Router();

 // User routes
 router.post('/login', loginUser);
 router.post('/register', registerUser);

 module.exports = router;