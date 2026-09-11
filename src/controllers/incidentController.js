const Incident = require('../models/Incident');
const AppError = require('../utils/appError');
const asyncHandler = require('../middleware/asyncHandler');
const { emitIncident } = require('../services/socketService');

const getIncidents = asyncHandler(async (req, res) => {
  const { status, severity, type, workerId: workerObjectId } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (type) filter.type = type;
  if (workerObjectId) filter.worker = workerObjectId;

  const incidents = await Incident.find(filter)
    .populate('worker device sourceEvent')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: incidents.length,
    data: incidents,
  });
});

const acknowledgeIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    throw new AppError('Incident not found', 404);
  }

  if (incident.status === 'RESOLVED') {
    throw new AppError('Resolved incidents cannot be acknowledged', 400);
  }

  if (incident.status === 'ACKNOWLEDGED') {
    throw new AppError('Incident is already acknowledged', 400);
  }

  incident.status = 'ACKNOWLEDGED';
  incident.acknowledgedAt = new Date();

  await incident.save();

  const populatedIncident = await incident.populate('worker device sourceEvent');
  emitIncident(populatedIncident);

  res.status(200).json({
    success: true,
    message: 'Incident acknowledged',
    data: populatedIncident,
  });
});

const resolveIncident = asyncHandler(async (req, res) => {
  const { resolutionNote } = req.body;
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    throw new AppError('Incident not found', 404);
  }

  if (incident.status === 'RESOLVED') {
    throw new AppError('Incident is already resolved', 400);
  }

  incident.status = 'RESOLVED';
  incident.resolvedAt = new Date();
  incident.resolutionNote = resolutionNote || 'Resolved by operations team';

  await incident.save();

  const populatedIncident = await incident.populate('worker device sourceEvent');
  emitIncident(populatedIncident);

  res.status(200).json({
    success: true,
    message: 'Incident resolved',
    data: populatedIncident,
  });
});

module.exports = {
  getIncidents,
  acknowledgeIncident,
  resolveIncident,
};
