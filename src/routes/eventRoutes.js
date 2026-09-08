const express = require('express');
const { getRecentEvents } = require('../controllers/eventController');
const { requireAuth } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { eventsQuerySchema } = require('../utils/validators');

const router = express.Router();

router.get('/', requireAuth, validateRequest(eventsQuerySchema), getRecentEvents);

module.exports = router;
