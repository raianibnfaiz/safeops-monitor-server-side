const express = require('express');
const { getWorkers, getWorkerById } = require('../controllers/workerController');
const validateObjectId = require('../middleware/validateObjectId');
const validateRequest = require('../middleware/validateRequest');
const { workersQuerySchema } = require('../utils/validators');

const router = express.Router();

router.get('/', validateRequest(workersQuerySchema), getWorkers);
router.get('/:id', validateObjectId(), getWorkerById);

module.exports = router;
