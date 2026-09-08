const express = require('express');
const { getRecentEvents } = require('../controllers/eventController');
const validateRequest = require('../middleware/validateRequest');
const { eventsQuerySchema } = require('../utils/validators');

const router = express.Router();

router.get('/', validateRequest(eventsQuerySchema), getRecentEvents);

module.exports = router;
