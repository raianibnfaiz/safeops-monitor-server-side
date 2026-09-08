const express = require('express');
const { getDevices, getDeviceById } = require('../controllers/deviceController');
const validateObjectId = require('../middleware/validateObjectId');
const validateRequest = require('../middleware/validateRequest');
const { devicesQuerySchema } = require('../utils/validators');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, validateRequest(devicesQuerySchema), getDevices);
router.get('/:id', requireAuth, validateObjectId(), getDeviceById);

module.exports = router;
