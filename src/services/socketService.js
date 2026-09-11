let socketServer;

const initializeSocket = (socketIoServer) => {
  socketServer = socketIoServer;

  socketIoServer.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

const getSocketServer = () => socketServer;

const emitSafetyEvent = (eventPayload) => {
  if (socketServer) {
    socketServer.emit('safety:event', eventPayload);
  }
};

const emitIncident = (incidentPayload) => {
  if (socketServer) {
    socketServer.emit('safety:incident', incidentPayload);
  }
};

const getSocketStats = () => ({
  clientsConnected: socketServer ? socketServer.engine.clientsCount : 0,
});

module.exports = {
  initializeSocket,
  getSocketServer,
  emitSafetyEvent,
  emitIncident,
  getSocketStats,
};
