const Worker = require('../models/Worker');
const AppError = require('../utils/appError');
const asyncHandler = require('../middleware/asyncHandler');

const getWorkers = asyncHandler(async (req, res) => {
  const workers = await Worker.find({}).populate('assignedDevice').sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: workers.length,
    data: workers,
  });
});

const getWorkerById = asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id).populate('assignedDevice');

  if (!worker) {
    throw new AppError('Worker not found', 404);
  }

  res.status(200).json({
    success: true,
    data: worker,
  });
});

module.exports = {
  getWorkers,
  getWorkerById,
};
