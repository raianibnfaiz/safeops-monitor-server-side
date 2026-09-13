const Device = require('../models/Device');
const AppError = require('../utils/appError');
const asyncHandler = require('../middleware/asyncHandler');

// Returns the effective status of a device:
// if its assigned worker is inactive the device is also considered inactive,
// preventing an active-device / inactive-worker mismatch in the response.
const effectiveDeviceStatus = (device) => {
  if (device.worker?.status === 'INACTIVE') return 'INACTIVE';
  return device.status;
};

const getDevices = asyncHandler(async (req, res) => {
  const { status, geofenceStatus, workerId: workerObjectId, search } = req.query;
  const filter = {};

  if (geofenceStatus) filter.geofenceStatus = geofenceStatus;
  if (workerObjectId) filter.worker = workerObjectId;
  if (search) filter.deviceId = { $regex: search, $options: 'i' };

  const devices = await Device.find(filter).populate('worker').sort({ createdAt: -1 });

  // Apply the status filter after population so we can derive the effective status.
  const filtered = status
    ? devices.filter((d) => effectiveDeviceStatus(d) === status)
    : devices;

  const data = filtered.map((d) => ({
    ...d.toObject(),
    status: effectiveDeviceStatus(d),
  }));

  res.status(200).json({
    success: true,
    count: data.length,
    data,
  });
});

const getDeviceById = asyncHandler(async (req, res) => {
  const device = await Device.findById(req.params.id).populate('worker');

  if (!device) {
    throw new AppError('Device not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { ...device.toObject(), status: effectiveDeviceStatus(device) },
  });
});

module.exports = {
  getDevices,
  getDeviceById,
};
