const express = require('express');
const { getRecentEvents } = require('../controllers/eventController');
const validateRequest = require('../middleware/validateRequest');
const { eventsQuerySchema } = require('../utils/validators');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, validateRequest(eventsQuerySchema), getRecentEvents);

module.exports = router;
