const mongoose = require('mongoose');
const { EVENT_TYPES } = require('../utils/constants');

const eventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: EVENT_TYPES,
      required: true,
    },
    severity: {
      type: String,
      enum: ['WARNING', 'HIGH', 'CRITICAL'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: true,
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

eventSchema.index({ createdAt: -1 });

eventSchema.index({ eventType: 1, severity: 1 });

module.exports = mongoose.model('Event', eventSchema);
