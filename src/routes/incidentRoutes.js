const express = require('express');
const {
  getIncidents,
  acknowledgeIncident,
  resolveIncident,
} = require('../controllers/incidentController');
const validateObjectId = require('../middleware/validateObjectId');
const validateRequest = require('../middleware/validateRequest');
const { incidentsQuerySchema, resolveIncidentSchema } = require('../utils/validators');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, validateRequest(incidentsQuerySchema), getIncidents);
router.post('/:id/acknowledge', requireAuth, validateObjectId(), acknowledgeIncident);
router.post(
  '/:id/resolve',
  requireAuth,
  validateObjectId(),
  validateRequest(resolveIncidentSchema),
  resolveIncident
);

module.exports = router;
