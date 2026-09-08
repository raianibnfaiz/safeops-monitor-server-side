const mongoose = require('mongoose');
const { EVENT_TYPES } = require('../utils/constants');

const incidentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: EVENT_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ['HIGH', 'CRITICAL'],
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'],
      default: 'OPEN',
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
    sourceEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    acknowledgedAt: Date,
    resolvedAt: Date,
    resolutionNote: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

incidentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);
