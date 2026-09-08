const Device = require('../models/Device');
const Event = require('../models/Event');
const Incident = require('../models/Incident');
const Worker = require('../models/Worker');
const {
  EVENT_TYPES,
  EVENT_SEVERITY_MAP,
  INCIDENT_CREATING_SEVERITIES,
} = require('../utils/constants');
const { emitIncident, emitSafetyEvent } = require('./socketService');

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pickRandom = (arr) => arr[randomInt(0, arr.length - 1)];

const buildMessage = (eventType, workerName, zone) => {
  const messageMap = {
    HIGH_TEMPERATURE: `${workerName} reported unsafe body temperature near ${zone}`,
    LOW_BATTERY: `${workerName}'s wearable battery is critically low in ${zone}`,
    FALL_DETECTED: `Possible fall detected for ${workerName} at ${zone}`,
    NO_MOVEMENT: `${workerName} has had no movement for an extended period in ${zone}`,
    GEOFENCE_BREACH: `${workerName} moved outside permitted geofence near ${zone}`,
    SOS: `${workerName} triggered SOS emergency alert from ${zone}`,
  };

  return messageMap[eventType];
};

const createIncidentFromEvent = async (savedEvent) => {
  if (!INCIDENT_CREATING_SEVERITIES.includes(savedEvent.severity)) {
    return null;
  }

  const incident = await Incident.create({
    type: savedEvent.eventType,
    title: `${savedEvent.eventType.replace('_', ' ')} incident`,
    description: savedEvent.message,
    severity: savedEvent.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
    worker: savedEvent.worker,
    device: savedEvent.device,
    sourceEvent: savedEvent._id,
  });

  const populatedIncident = await incident.populate('worker device sourceEvent');
  emitIncident(populatedIncident);

  return populatedIncident;
};

const generateSafetyEvent = async () => {
  const workers = await Worker.find({}).populate('assignedDevice');

  if (!workers.length) {
    return;
  }

  const worker = pickRandom(workers);
  const device = worker.assignedDevice;

  if (!device) {
    return;
  }

  const eventType = pickRandom(EVENT_TYPES);
  const severity = EVENT_SEVERITY_MAP[eventType];
  const zone = worker.location?.zone || 'Unknown Zone';

  const metadata = {
    batteryLevel: Math.max(5, device.batteryLevel - randomInt(0, 5)),
    temperature: Number((36 + Math.random() * 8).toFixed(1)),
    geofenceStatus: eventType === 'GEOFENCE_BREACH' ? 'OUTSIDE' : 'INSIDE',
    movementScore: randomInt(0, 100),
  };

  const event = await Event.create({
    eventType,
    severity,
    message: buildMessage(eventType, worker.name, zone),
    worker: worker._id,
    device: device._id,
    metadata,
  });

  await Device.findByIdAndUpdate(device._id, {
    batteryLevel: metadata.batteryLevel,
    temperature: metadata.temperature,
    geofenceStatus: metadata.geofenceStatus,
    lastSeenAt: new Date(),
  });

  const populatedEvent = await event.populate('worker device');
  emitSafetyEvent(populatedEvent);

  await createIncidentFromEvent(event);
};

let simulatorTimer;

const scheduleNext = () => {
  const delay = randomInt(15000, 20000);

  simulatorTimer = setTimeout(async () => {
    try {
      await generateSafetyEvent();
    } catch (error) {
      console.error('Event simulator error:', error.message);
    } finally {
      scheduleNext();
    }
  }, delay);
};

const startEventSimulator = () => {
  if (simulatorTimer) {
    return;
  }

  console.log('SafeOps event simulator started');
  scheduleNext();
};

const stopEventSimulator = () => {
  if (simulatorTimer) {
    clearTimeout(simulatorTimer);
    simulatorTimer = null;
  }
};

module.exports = {
  startEventSimulator,
  stopEventSimulator,
};
