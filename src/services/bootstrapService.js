const Device = require('../models/Device');
const Event = require('../models/Event');
const Incident = require('../models/Incident');
const Worker = require('../models/Worker');
const { EVENT_TYPES, EVENT_SEVERITY_MAP, INCIDENT_CREATING_SEVERITIES } = require('../utils/constants');

const sampleWorkers = [
  ['W-101', 'Amina Rahman', 'Welder', 'ZONE-A', 23.78, 90.4],
  ['W-102', 'Rafiq Hasan', 'Operator', 'ZONE-B', 23.79, 90.41],
  ['W-103', 'Nadia Karim', 'Inspector', 'ZONE-C', 23.8, 90.42],
  ['W-104', 'Shahid Alam', 'Forklift Driver', 'ZONE-A', 23.775, 90.395],
  ['W-105', 'Mita Sultana', 'Technician', 'ZONE-D', 23.785, 90.405],
  ['W-106', 'Tanvir Islam', 'Supervisor', 'ZONE-E', 23.77, 90.39],
  ['W-107', 'Jannat Nahar', 'Assembler', 'ZONE-B', 23.782, 90.412],
  ['W-108', 'Kawsar Hossain', 'Mechanic', 'ZONE-C', 23.796, 90.418],
  ['W-109', 'Rubina Akter', 'Safety Officer', 'ZONE-D', 23.789, 90.407],
  ['W-110', 'Biplob Das', 'Operator', 'ZONE-E', 23.774, 90.392],
  ['W-111', 'Nusrat Jahan', 'Welder', 'ZONE-A', 23.781, 90.399],
  ['W-112', 'Sabbir Ahmed', 'Inspector', 'ZONE-C', 23.798, 90.416],
].map(([workerId, name, role, zone, lat, lng]) => ({
  workerId,
  name,
  role,
  location: { zone, lat, lng },
}));

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pickRandom = (arr) => arr[randomInt(0, arr.length - 1)];

const generateEventMessage = (eventType, workerName, zone) => {
  const map = {
    HIGH_TEMPERATURE: `${workerName} reported unsafe body temperature near ${zone}`,
    LOW_BATTERY: `${workerName}'s wearable battery is critically low in ${zone}`,
    FALL_DETECTED: `Possible fall detected for ${workerName} at ${zone}`,
    NO_MOVEMENT: `${workerName} has had no movement for an extended period in ${zone}`,
    GEOFENCE_BREACH: `${workerName} moved outside permitted geofence near ${zone}`,
    SOS: `${workerName} triggered SOS emergency alert from ${zone}`,
  };

  return map[eventType];
};

const ensureBaselineData = async () => {
  const workerCount = await Worker.countDocuments();
  if (workerCount > 0) {
    return;
  }

  const workers = await Worker.insertMany(sampleWorkers);

  const devices = await Device.insertMany(
    workers.map((worker, index) => ({
      deviceId: `SAFEOPS-${1000 + index}`,
      worker: worker._id,
      batteryLevel: 80 - index * 10,
      temperature: 36 + index,
      geofenceStatus: 'INSIDE',
    }))
  );

  await Promise.all(
    workers.map((worker, index) =>
      Worker.findByIdAndUpdate(worker._id, { assignedDevice: devices[index]._id })
    )
  );

  const historicalEvents = [];
  for (let i = 0; i < 60; i += 1) {
    const worker = pickRandom(workers);
    const device = devices.find((d) => String(d.worker) === String(worker._id)) || pickRandom(devices);
    const eventType = pickRandom(EVENT_TYPES);
    const severity = EVENT_SEVERITY_MAP[eventType];
    const temperature = Number((35 + Math.random() * 8).toFixed(1));
    const batteryLevel = randomInt(8, 95);
    const geofenceStatus = eventType === 'GEOFENCE_BREACH' ? 'OUTSIDE' : 'INSIDE';
    const createdAt = new Date(Date.now() - randomInt(1, 7 * 24 * 60 * 60) * 1000);

    historicalEvents.push({
      eventType,
      severity,
      message: generateEventMessage(eventType, worker.name, worker.location.zone),
      worker: worker._id,
      device: device._id,
      metadata: {
        temperature,
        batteryLevel,
        geofenceStatus,
      },
      createdAt,
      updatedAt: createdAt,
    });
  }

  const events = await Event.insertMany(historicalEvents);

  const incidentsToCreate = events
    .filter((event) => INCIDENT_CREATING_SEVERITIES.includes(event.severity))
    .slice(0, 15)
    .map((event, idx) => {
      const worker = workers.find((w) => String(w._id) === String(event.worker));
      return {
        type: event.eventType,
        title: `${event.eventType.replaceAll('_', ' ')} incident`,
        description: event.message,
        severity: event.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        status: idx % 3 === 0 ? 'RESOLVED' : idx % 2 === 0 ? 'ACKNOWLEDGED' : 'OPEN',
        worker: event.worker,
        device: event.device,
        sourceEvent: event._id,
        location: {
          zone: worker?.location?.zone || 'UNKNOWN',
          lat: worker?.location?.lat || 0,
          lng: worker?.location?.lng || 0,
        },
      };
    });

  if (incidentsToCreate.length > 0) {
    await Incident.insertMany(incidentsToCreate);
  }

  console.log('Baseline workers, devices, events, and incidents created');
};

module.exports = {
  ensureBaselineData,
};
