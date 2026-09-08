const express = require('express');
const { getRecentEvents } = require('../controllers/eventController');

const router = express.Router();

router.get('/', getRecentEvents);

module.exports = router;
