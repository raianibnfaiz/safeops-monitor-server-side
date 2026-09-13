const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      unique: true,
      sparse: true,
    },
    // Human-readable identifier of the assigned worker (e.g. "W-101").
    // Mirrors Device.worker for quick lookups without a populate() call.
    assignedTo: {
      type: String,
      trim: true,
      default: null,
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    temperature: {
      type: Number,
      default: 36,
    },
    geofenceStatus: {
      type: String,
      enum: ['INSIDE', 'OUTSIDE'],
      default: 'INSIDE',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
      default: 'ACTIVE',
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Device', deviceSchema);
