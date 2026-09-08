const Incident = require('../models/Incident');
const Event = require('../models/Event');
const Worker = require('../models/Worker');
const Device = require('../models/Device');
const asyncHandler = require('../middleware/asyncHandler');
const { getSocketStats } = require('../services/socketService');
const { getSimulatorState } = require('../services/simulatorService');

const getDashboardSummary = asyncHandler(async (req, res) => {
  const [
    workersTotal,
    activeWorkers,
    devicesTotal,
    onlineDevices,
    offlineDevices,
    openIncidents,
    acknowledgedIncidents,
    resolvedIncidents,
    criticalEvents,
    recentIncidents,
    recentEvents,
    incidentsBySeverity,
    incidentsByDay,
  ] = await Promise.all([
    Worker.countDocuments(),
    Worker.countDocuments({ status: 'ACTIVE' }),
    Device.countDocuments(),
    Device.countDocuments({ status: 'ACTIVE' }),
    Device.countDocuments({ status: { $ne: 'ACTIVE' } }),
    Incident.countDocuments({ status: 'OPEN' }),
    Incident.countDocuments({ status: 'ACKNOWLEDGED' }),
    Incident.countDocuments({ status: 'RESOLVED' }),
    Event.countDocuments({ severity: 'CRITICAL' }),
    Incident.find({}).sort({ createdAt: -1 }).limit(5).populate('worker device'),
    Event.find({}).sort({ createdAt: -1 }).limit(5).populate('worker device'),
    Incident.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $project: { _id: 0, severity: '$_id', count: 1 } },
    ]),
    Incident.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, day: '$_id', count: 1 } },
    ]),
  ]);

  const socketStats = getSocketStats();
  const simulator = getSimulatorState();

  res.status(200).json({
    success: true,
    data: {
      workersTotal,
      activeWorkers,
      devicesTotal,
      devices: {
        online: onlineDevices,
        offline: offlineDevices,
      },
      incidents: {
        open: openIncidents,
        acknowledged: acknowledgedIncidents,
        resolved: resolvedIncidents,
      },
      criticalEvents,
      visualization: {
        incidentsBySeverity,
        incidentsByDay,
      },
      systemHealth: {
        database: 'CONNECTED',
        simulator,
        clientsConnected: socketStats.clientsConnected,
        uptimeSeconds: Math.floor(process.uptime()),
      },
      recentIncidents,
      recentEvents,
    },
  });
});

module.exports = {
  getDashboardSummary,
};
