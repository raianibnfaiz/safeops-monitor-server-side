const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { ensureBaselineData } = require('../src/services/bootstrapService');

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
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
