const Event = require('../models/Event');
const asyncHandler = require('../middleware/asyncHandler');

const getRecentEvents = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const filter = {};

  if (req.query.severity) {
    filter.severity = req.query.severity;
  }

  if (req.query.eventType) {
    filter.eventType = req.query.eventType;
  }

  const events = await Event.find(filter)
    .populate('worker device')
    .sort({ createdAt: -1 })
    .limit(limit);

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  });
});

module.exports = {
  getRecentEvents,
};
