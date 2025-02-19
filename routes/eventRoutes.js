const express = require('express');
const { createEvent, getEventById, getUserEvents, deleteEvent, updateEvent } = require('../controllers/eventsControllers');
const { cookieJwtAuth } = require('../middleware/cookieJWTAuth');
const router = express.Router();

// POST methods
router.post('/events', cookieJwtAuth, createEvent);

// GET methods
router.get('/events/:id', cookieJwtAuth, getEventById);
router.get('/events', cookieJwtAuth, getUserEvents);

// DELETE methods
router.delete('/events/:id', cookieJwtAuth, deleteEvent);

// PUT methods
router.put('/events/:id', cookieJwtAuth, updateEvent);

module.exports = router;