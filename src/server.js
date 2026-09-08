const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const { parseBooleanEnv } = require('./config/env');
const { initSocket } = require('./services/socketService');
const { ensureBaselineData } = require('./services/bootstrapService');
const { startEventSimulator } = require('./services/simulatorService');

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

  server.listen(PORT, () => {
    console.log(`SafeOps Monitor API server is running on port ${PORT}`);
  });
};

startServer();
