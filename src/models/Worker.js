const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema(
  {
    workerId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    location: {
      zone: { type: String, default: 'ZONE-A' },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    assignedDevice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Worker', workerSchema);
