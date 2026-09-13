const Device = require('../models/Device');
const Event = require('../models/Event');
const Incident = require('../models/Incident');
const Worker = require('../models/Worker');
const { EVENT_TYPES, EVENT_SEVERITY_MAP, INCIDENT_CREATING_SEVERITIES } = require('../utils/constants');

// ─── 20 realistic workers across 5 zones ──────────────────────────────────────
// [workerId, name, role, zone, lat, lng, status]
const sampleWorkers = [
  ['W-101', 'Amina Rahman',    'Welder',            'ZONE-A', 23.780, 90.400, 'ACTIVE'],
  ['W-102', 'Rafiq Hasan',     'Operator',          'ZONE-B', 23.790, 90.410, 'ACTIVE'],
  ['W-103', 'Nadia Karim',     'Inspector',         'ZONE-C', 23.800, 90.420, 'ACTIVE'],
  ['W-104', 'Shahid Alam',     'Forklift Driver',   'ZONE-A', 23.775, 90.395, 'ACTIVE'],
  ['W-105', 'Mita Sultana',    'Technician',        'ZONE-D', 23.785, 90.405, 'ACTIVE'],
  ['W-106', 'Tanvir Islam',    'Supervisor',        'ZONE-E', 23.770, 90.390, 'ACTIVE'],
  ['W-107', 'Jannat Nahar',    'Assembler',         'ZONE-B', 23.782, 90.412, 'ACTIVE'],
  ['W-108', 'Kawsar Hossain',  'Mechanic',          'ZONE-C', 23.796, 90.418, 'ACTIVE'],
  ['W-109', 'Rubina Akter',    'Safety Officer',    'ZONE-D', 23.789, 90.407, 'INACTIVE'],
  ['W-110', 'Biplob Das',      'Operator',          'ZONE-E', 23.774, 90.392, 'ACTIVE'],
  ['W-111', 'Nusrat Jahan',    'Welder',            'ZONE-A', 23.781, 90.399, 'ACTIVE'],
  ['W-112', 'Sabbir Ahmed',    'Inspector',         'ZONE-C', 23.798, 90.416, 'ACTIVE'],
  ['W-113', 'Farhan Haque',    'Electrician',       'ZONE-B', 23.791, 90.413, 'ACTIVE'],
  ['W-114', 'Sonia Begum',     'Quality Control',   'ZONE-D', 23.787, 90.403, 'ACTIVE'],
  ['W-115', 'Imran Khan',      'Scaffolder',        'ZONE-E', 23.772, 90.394, 'INACTIVE'],
  ['W-116', 'Roksana Parvin',  'Welder',            'ZONE-A', 23.779, 90.401, 'ACTIVE'],
  ['W-117', 'Mahbub Alam',     'Crane Operator',    'ZONE-B', 23.793, 90.411, 'ACTIVE'],
  ['W-118', 'Tania Khanam',    'Technician',        'ZONE-C', 23.802, 90.421, 'ACTIVE'],
  ['W-119', 'Delwar Hossain',  'Forklift Driver',   'ZONE-D', 23.786, 90.406, 'INACTIVE'],
  ['W-120', 'Sharmin Akter',   'Safety Officer',    'ZONE-E', 23.773, 90.393, 'ACTIVE'],
].map(([workerId, name, role, zone, lat, lng, status]) => ({
  workerId,
  name,
  role,
  status,
  location: { zone, lat, lng },
}));

const randomIntegerInRange = (minimum, maximum) =>
  Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

const pickRandomItem = (items) => items[randomIntegerInRange(0, items.length - 1)];

const buildSafetyEventMessage = (eventType, workerName, zone) => {
  const eventMessageTemplates = {
    HIGH_TEMPERATURE: `${workerName} reported unsafe body temperature near ${zone}`,
    LOW_BATTERY:      `${workerName}'s wearable battery is critically low in ${zone}`,
    FALL_DETECTED:    `Possible fall detected for ${workerName} at ${zone}`,
    NO_MOVEMENT:      `${workerName} has had no movement for an extended period in ${zone}`,
    GEOFENCE_BREACH:  `${workerName} moved outside permitted geofence near ${zone}`,
    SOS:              `${workerName} triggered SOS emergency alert from ${zone}`,
  };

  return eventMessageTemplates[eventType];
};

const ensureBaselineData = async () => {
  const workerCount = await Worker.countDocuments();
  if (workerCount > 0) {
    return;
  }

  // ── 1. Insert 20 workers ───────────────────────────────────────────────────
  const workers = await Worker.insertMany(sampleWorkers);

  // ── 2. Insert 20 devices – each linked to exactly one worker (1:1) ─────────
  // Device.worker has a unique+sparse index so MongoDB will reject duplicates.
  const devices = await Device.insertMany(
    workers.map((worker, index) => ({
      deviceId:       `SAFEOPS-${1000 + index}`,
      worker:         worker._id,           // ← ObjectId ref (Device → Worker)
      assignedTo:     worker.workerId,      // ← human-readable worker ID e.g. "W-101"
      batteryLevel:   randomIntegerInRange(40, 100),
      temperature:    Number((36 + Math.random() * 3).toFixed(1)),
      geofenceStatus: 'INSIDE',
      // A device mirrors its worker's active/inactive state so there is no mismatch.
      status:         worker.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    }))
  );

  // Back-link: Worker.assignedDevice → Device (completes the 1:1 on both sides)
  await Promise.all(
    workers.map((worker, index) =>
      Worker.findByIdAndUpdate(worker._id, { assignedDevice: devices[index]._id })
    )
  );

  // ── 3. Build a device lookup keyed by worker._id string ───────────────────
  const deviceByWorkerId = Object.fromEntries(
    devices.map((device) => [String(device.worker), device])
  );

  // ── 4. Insert 80 historical events spread over the last 7 days ────────────
  const historicalEvents = [];

  for (let eventIndex = 0; eventIndex < 80; eventIndex += 1) {
    const worker        = pickRandomItem(workers);
    const assignedDevice = deviceByWorkerId[String(worker._id)];
    const eventType     = pickRandomItem(EVENT_TYPES);
    const severity      = EVENT_SEVERITY_MAP[eventType];
    const temperature   = Number((35 + Math.random() * 8).toFixed(1));
    const batteryLevel  = randomIntegerInRange(8, 95);
    const geofenceStatus = eventType === 'GEOFENCE_BREACH' ? 'OUTSIDE' : 'INSIDE';
    const createdAt     = new Date(
      Date.now() - randomIntegerInRange(1, 7 * 24 * 60 * 60) * 1000
    );

    historicalEvents.push({
      eventType,
      severity,
      message:  buildSafetyEventMessage(eventType, worker.name, worker.location.zone),
      worker:   worker._id,
      device:   assignedDevice._id,
      metadata: { temperature, batteryLevel, geofenceStatus },
      createdAt,
      updatedAt: createdAt,
    });
  }

  const events = await Event.insertMany(historicalEvents);

  // ── 5. Derive incidents from HIGH/CRITICAL events (up to 20) ──────────────
  // Mix statuses so the dashboard shows variety.
  const incidentStatusCycle = ['OPEN', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'];

  const seedIncidents = events
    .filter((event) => INCIDENT_CREATING_SEVERITIES.includes(event.severity))
    .slice(0, 20)
    .map((event, eventIndex) => {
      const worker = workers.find(
        (candidateWorker) => String(candidateWorker._id) === String(event.worker)
      );

      return {
        type:        event.eventType,
        title:       `${event.eventType.replaceAll('_', ' ')} incident`,
        description: event.message,
        severity:    event.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        status:      incidentStatusCycle[eventIndex % incidentStatusCycle.length],
        worker:      event.worker,
        device:      event.device,
        sourceEvent: event._id,
        location: {
          zone: worker?.location?.zone || 'UNKNOWN',
          lat:  worker?.location?.lat  || 0,
          lng:  worker?.location?.lng  || 0,
        },
      };
    });

  if (seedIncidents.length > 0) {
    await Incident.insertMany(seedIncidents);
  }

  console.log(
    `Baseline data created: ${workers.length} workers, ${devices.length} devices, ` +
    `${events.length} events, ${seedIncidents.length} incidents`
  );
};

module.exports = {
  ensureBaselineData,
};
