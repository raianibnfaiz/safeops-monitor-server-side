const express = require('express');
const {
  getIncidents,
  acknowledgeIncident,
  resolveIncident,
} = require('../controllers/incidentController');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.get('/', getIncidents);
router.post('/:id/acknowledge', validateObjectId(), acknowledgeIncident);
router.post('/:id/resolve', validateObjectId(), resolveIncident);

module.exports = router;
