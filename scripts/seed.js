const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { ensureBaselineData } = require('../src/services/bootstrapService');

// Models must be imported so Mongoose registers them before we drop collections.
require('../src/models/Worker');
require('../src/models/Device');
require('../src/models/Event');
require('../src/models/Incident');

dotenv.config();

const clearCollections = async () => {
  const Worker   = mongoose.model('Worker');
  const Device   = mongoose.model('Device');
  const Event    = mongoose.model('Event');
  const Incident = mongoose.model('Incident');

  await Promise.all([
    Worker.deleteMany({}),
    Device.deleteMany({}),
    Event.deleteMany({}),
    Incident.deleteMany({}),
  ]);

  console.log('Existing workers, devices, events, and incidents removed');
};

const seed = async () => {
  try {
    await connectDB();
    await clearCollections();
    await ensureBaselineData();
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seed();
