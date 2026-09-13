const Event = require('../models/Event');
const asyncHandler = require('../middleware/asyncHandler');

const getRecentEvents = asyncHandler(async (req, res) => {
  const workerObjectId = req.query.workerId;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = {};

  if (req.query.severity) {
    filter.severity = req.query.severity;
  }

  if (req.query.eventType) {
    filter.eventType = req.query.eventType;
  }

  if (workerObjectId) {
    filter.worker = workerObjectId;
  }

  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate('worker device')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Event.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: events.length,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0,
    data: events,
  });
});

module.exports = {
  getRecentEvents,
};
