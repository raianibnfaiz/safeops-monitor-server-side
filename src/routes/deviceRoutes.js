const express = require('express');
const { getDevices, getDeviceById } = require('../controllers/deviceController');
const validateObjectId = require('../middleware/validateObjectId');
const validateRequest = require('../middleware/validateRequest');
const { devicesQuerySchema } = require('../utils/validators');

const router = express.Router();

router.get('/', validateRequest(devicesQuerySchema), getDevices);
router.get('/:id', validateObjectId(), getDeviceById);

module.exports = router;
