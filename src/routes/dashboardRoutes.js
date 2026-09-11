const express = require('express');
const { getDashboardSummary } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, getDashboardSummary);

module.exports = router;
