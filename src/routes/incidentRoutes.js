const express = require('express');
const {
  getIncidents,
  acknowledgeIncident,
  resolveIncident,
} = require('../controllers/incidentController');
const validateObjectId = require('../middleware/validateObjectId');
const validateRequest = require('../middleware/validateRequest');
const { incidentsQuerySchema, resolveIncidentSchema } = require('../utils/validators');

const router = express.Router();

router.get('/', validateRequest(incidentsQuerySchema), getIncidents);
router.post('/:id/acknowledge', validateObjectId(), acknowledgeIncident);
router.post(
  '/:id/resolve',
  validateObjectId(),
  validateRequest(resolveIncidentSchema),
  resolveIncident
);

module.exports = router;
