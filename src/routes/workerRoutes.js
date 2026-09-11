const express = require('express');
const { getWorkers, getWorkerById } = require('../controllers/workerController');
const validateObjectId = require('../middleware/validateObjectId');
const validateRequest = require('../middleware/validateRequest');
const { workersQuerySchema } = require('../utils/validators');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, validateRequest(workersQuerySchema), getWorkers);
router.get('/:id', requireAuth, validateObjectId(), getWorkerById);

module.exports = router;
