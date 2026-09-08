const Device = require('../models/Device');
const AppError = require('../utils/appError');
const asyncHandler = require('../middleware/asyncHandler');

const getDevices = asyncHandler(async (req, res) => {
  const { status, geofenceStatus, workerId, search } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (geofenceStatus) filter.geofenceStatus = geofenceStatus;
  if (workerId) filter.worker = workerId;
  if (search) filter.deviceId = { $regex: search, $options: 'i' };

  const devices = await Device.find(filter).populate('worker').sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: devices.length,
    data: devices,
  });
});

const getDeviceById = asyncHandler(async (req, res) => {
  const device = await Device.findById(req.params.id).populate('worker');

  if (!device) {
    throw new AppError('Device not found', 404);
  }

  res.status(200).json({
    success: true,
    data: device,
  });
});

module.exports = {
  getDevices,
  getDeviceById,
};
