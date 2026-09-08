const Device = require('../models/Device');
const Event = require('../models/Event');
const Incident = require('../models/Incident');
const Worker = require('../models/Worker');
const {
  EVENT_TYPES,
  EVENT_SEVERITY_MAP,
  INCIDENT_CREATING_SEVERITIES,
} = require('../utils/constants');
const { parseNumberEnv } = require('../config/env');
const { emitIncident, emitSafetyEvent } = require('./socketService');

const SIMULATOR_MIN_MS = parseNumberEnv(process.env.SIMULATOR_MIN_MS, 15000);
const SIMULATOR_MAX_MS = parseNumberEnv(process.env.SIMULATOR_MAX_MS, 20000);

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

  const worker = await Worker.findById(savedEvent.worker);
  const location = {
    zone: worker?.location?.zone || 'UNKNOWN',
    lat: worker?.location?.lat || 0,
    lng: worker?.location?.lng || 0,
  };

  const incident = await Incident.create({
    type: savedEvent.eventType,
    title: `${savedEvent.eventType.replace('_', ' ')} incident`,
    description: savedEvent.message,
    severity: savedEvent.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
    worker: savedEvent.worker,
    device: savedEvent.device,
    sourceEvent: savedEvent._id,
    location,
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
    location: {
      zone,
      lat: worker.location?.lat || 0,
      lng: worker.location?.lng || 0,
    },
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
let simulatorState = {
  isRunning: false,
  lastGeneratedAt: null,
  nextDelayMs: null,
};

const scheduleNext = () => {
  const delay = randomInt(SIMULATOR_MIN_MS, SIMULATOR_MAX_MS);
  simulatorState.nextDelayMs = delay;

  simulatorTimer = setTimeout(async () => {
    try {
      await generateSafetyEvent();
      simulatorState.lastGeneratedAt = new Date().toISOString();
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

  simulatorState.isRunning = true;
  console.log('SafeOps event simulator started');
  scheduleNext();
};

const stopEventSimulator = () => {
  if (simulatorTimer) {
    clearTimeout(simulatorTimer);
    simulatorTimer = null;
  }

  simulatorState = {
    ...simulatorState,
    isRunning: false,
    nextDelayMs: null,
  };
};

const getSimulatorState = () => ({ ...simulatorState });

module.exports = {
  startEventSimulator,
  stopEventSimulator,
  getSimulatorState,
};
