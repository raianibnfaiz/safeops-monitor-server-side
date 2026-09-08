const Incident = require('../models/Incident');
const Event = require('../models/Event');
const Worker = require('../models/Worker');
const Device = require('../models/Device');
const asyncHandler = require('../middleware/asyncHandler');

const getDashboardSummary = asyncHandler(async (req, res) => {
  const [
    workersTotal,
    devicesTotal,
    openIncidents,
    acknowledgedIncidents,
    resolvedIncidents,
    criticalEvents,
    recentIncidents,
    recentEvents,
  ] = await Promise.all([
    Worker.countDocuments(),
    Device.countDocuments(),
    Incident.countDocuments({ status: 'OPEN' }),
    Incident.countDocuments({ status: 'ACKNOWLEDGED' }),
    Incident.countDocuments({ status: 'RESOLVED' }),
    Event.countDocuments({ severity: 'CRITICAL' }),
    Incident.find({}).sort({ createdAt: -1 }).limit(5).populate('worker device'),
    Event.find({}).sort({ createdAt: -1 }).limit(5).populate('worker device'),
  ]);

  res.status(200).json({
    success: true,
    data: {
      workersTotal,
      devicesTotal,
      incidents: {
        open: openIncidents,
        acknowledged: acknowledgedIncidents,
        resolved: resolvedIncidents,
      },
      criticalEvents,
      recentIncidents,
      recentEvents,
    },
  });
});

module.exports = {
  getDashboardSummary,
};
