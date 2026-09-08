const dotenv = require('dotenv');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const { parseBooleanEnv } = require('./config/env');
const { initSocket } = require('./services/socketService');
const { ensureBaselineData } = require('./services/bootstrapService');
const { startEventSimulator, stopEventSimulator } = require('./services/simulatorService');

const PORT = process.env.PORT || 5000;
const ENABLE_BOOTSTRAP = parseBooleanEnv(process.env.ENABLE_BOOTSTRAP, false);
const ENABLE_SIMULATOR = parseBooleanEnv(process.env.ENABLE_SIMULATOR, true);

const startServer = async () => {
  await connectDB();

  if (ENABLE_BOOTSTRAP) {
    await ensureBaselineData();
  }

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  initSocket(io);

  if (ENABLE_SIMULATOR) {
    startEventSimulator();
  }

  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    stopEventSimulator();

    server.close(async () => {
      io.close();
      await mongoose.disconnect();
      process.exit(0);
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  server.listen(PORT, () => {
    console.log(`SafeOps Monitor API server is running on port ${PORT}`);
  });
};

startServer();
