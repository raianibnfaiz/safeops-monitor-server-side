let ioInstance;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

const getIO = () => ioInstance;

const emitSafetyEvent = (eventPayload) => {
  if (ioInstance) {
    ioInstance.emit('safety:event', eventPayload);
  }
};

const emitIncident = (incidentPayload) => {
  if (ioInstance) {
    ioInstance.emit('safety:incident', incidentPayload);
  }
};

const getSocketStats = () => ({
  clientsConnected: ioInstance ? ioInstance.engine.clientsCount : 0,
});

module.exports = {
  initSocket,
  getIO,
  emitSafetyEvent,
  emitIncident,
  getSocketStats,
};
