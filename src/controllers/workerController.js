const Worker = require('../models/Worker');
const Event = require('../models/Event');
const Incident = require('../models/Incident');
const AppError = require('../utils/appError');
const asyncHandler = require('../middleware/asyncHandler');

const getWorkers = asyncHandler(async (req, res) => {
  const { search, status, deviceStatus } = req.query;
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { workerId: { $regex: search, $options: 'i' } },
    ];
  }

  const workers = await Worker.find(filter).populate('assignedDevice').sort({ createdAt: -1 });

  const workersMatchingDeviceStatus = deviceStatus
    ? workers.filter((worker) => worker.assignedDevice?.status === deviceStatus)
    : workers;

  const workerSummaries = workersMatchingDeviceStatus.map((worker) => ({
    id: worker._id,
    workerId: worker.workerId,
    name: worker.name,
    role: worker.role,
    status: worker.status,
    lastKnownLocation: worker.location,
    lastActivity: worker.assignedDevice?.lastSeenAt || worker.updatedAt,
    batteryLevel: worker.assignedDevice?.batteryLevel ?? null,
    deviceId: worker.assignedDevice?.deviceId || null,
    // If the worker is inactive their device is treated as inactive regardless of its
    // stored status, preventing an active-device / inactive-worker mismatch.
    deviceStatus: !worker.assignedDevice
      ? 'UNASSIGNED'
      : worker.status === 'INACTIVE'
        ? 'INACTIVE'
        : worker.assignedDevice.status,
    assignedDevice: worker.assignedDevice,
  }));

  res.status(200).json({
    success: true,
    count: workerSummaries.length,
    data: workerSummaries,
  });
});

const getWorkerById = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id).populate('assignedDevice');

  if (!worker) {
    throw new AppError('Worker not found', 404);
  }

  const [recentEvents, incidentHistory] = await Promise.all([
    Event.find({ worker: worker._id }).sort({ createdAt: -1 }).limit(10),
    Incident.find({ worker: worker._id }).sort({ createdAt: -1 }).limit(10),
  ]);

  res.status(200).json({
    success: true,
    data: {
      ...worker.toObject(),
      lastActivity: worker.assignedDevice?.lastSeenAt || worker.updatedAt,
      batteryLevel: worker.assignedDevice?.batteryLevel ?? null,
      recentEvents,
      incidentHistory,
    },
  });
});

module.exports = {
  getWorkers,
  getWorkerById,
};
