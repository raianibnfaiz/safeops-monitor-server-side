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

const randomIntegerInRange = (minimum, maximum) =>
  Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

const pickRandomItem = (items) => items[randomIntegerInRange(0, items.length - 1)];

const buildSafetyEventMessage = (eventType, workerName, zone) => {
  const eventMessageTemplates = {
    HIGH_TEMPERATURE: `${workerName} reported unsafe body temperature near ${zone}`,
    LOW_BATTERY: `${workerName}'s wearable battery is critically low in ${zone}`,
    FALL_DETECTED: `Possible fall detected for ${workerName} at ${zone}`,
    NO_MOVEMENT: `${workerName} has had no movement for an extended period in ${zone}`,
    GEOFENCE_BREACH: `${workerName} moved outside permitted geofence near ${zone}`,
    SOS: `${workerName} triggered SOS emergency alert from ${zone}`,
  };

  return eventMessageTemplates[eventType];
};

const createIncidentFromEvent = async (createdEvent) => {
  if (!INCIDENT_CREATING_SEVERITIES.includes(createdEvent.severity)) {
    return null;
  }

  const worker = await Worker.findById(createdEvent.worker);
  const location = {
    zone: worker?.location?.zone || 'UNKNOWN',
    lat: worker?.location?.lat || 0,
    lng: worker?.location?.lng || 0,
  };

  const incident = await Incident.create({
    type: createdEvent.eventType,
    title: `${createdEvent.eventType.replace('_', ' ')} incident`,
    description: createdEvent.message,
    severity: createdEvent.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
    worker: createdEvent.worker,
    device: createdEvent.device,
    sourceEvent: createdEvent._id,
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

  const worker = pickRandomItem(workers);
  const device = worker.assignedDevice;

  if (!device) {
    return;
  }

  const eventType = pickRandomItem(EVENT_TYPES);
  const severity = EVENT_SEVERITY_MAP[eventType];
  const zone = worker.location?.zone || 'Unknown Zone';

  const metadata = {
    batteryLevel: Math.max(5, device.batteryLevel - randomIntegerInRange(0, 5)),
    temperature: Number((36 + Math.random() * 8).toFixed(1)),
    geofenceStatus: eventType === 'GEOFENCE_BREACH' ? 'OUTSIDE' : 'INSIDE',
    movementScore: randomIntegerInRange(0, 100),
    location: {
      zone,
      lat: worker.location?.lat || 0,
      lng: worker.location?.lng || 0,
    },
  };

  const event = await Event.create({
    eventType,
    severity,
    message: buildSafetyEventMessage(eventType, worker.name, zone),
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

let simulationTimeoutHandle;
let simulatorState = {
  isRunning: false,
  lastGeneratedAt: null,
  nextDelayMs: null,
};

const scheduleNextSimulatedEvent = () => {
  const nextEventDelayMs = randomIntegerInRange(SIMULATOR_MIN_MS, SIMULATOR_MAX_MS);
  simulatorState.nextDelayMs = nextEventDelayMs;

  simulationTimeoutHandle = setTimeout(async () => {
    try {
      await generateSafetyEvent();
      simulatorState.lastGeneratedAt = new Date().toISOString();
    } catch (error) {
      console.error('Event simulator error:', error.message);
    } finally {
      scheduleNextSimulatedEvent();
    }
  }, nextEventDelayMs);
};

const startEventSimulator = () => {
  if (simulationTimeoutHandle) {
    return;
  }

  simulatorState.isRunning = true;
  console.log('SafeOps event simulator started');
  scheduleNextSimulatedEvent();
};

const stopEventSimulator = () => {
  if (simulationTimeoutHandle) {
    clearTimeout(simulationTimeoutHandle);
    simulationTimeoutHandle = null;
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
