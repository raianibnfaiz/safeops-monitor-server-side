const express = require('express');
const { getWorkers, getWorkerById } = require('../controllers/workerController');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.get('/', getWorkers);
router.get('/:id', validateObjectId(), getWorkerById);

module.exports = router;
