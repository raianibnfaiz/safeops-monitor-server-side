const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const Worker = require('../src/models/Worker');
const Device = require('../src/models/Device');
const Event = require('../src/models/Event');
const Incident = require('../src/models/Incident');

describe('SafeOps backend API', () => {
  let mongoServer;
  let incidentId;

  const seedCoreData = async () => {
    const worker = await Worker.create({
      workerId: 'W-TEST-001',
      name: 'Test Worker',
      role: 'Operator',
      location: { zone: 'ZONE-A', lat: 23.75, lng: 90.38 },
    });

    const device = await Device.create({
      deviceId: 'SAFEOPS-TEST-001',
      worker: worker._id,
      batteryLevel: 72,
      temperature: 38.2,
      geofenceStatus: 'INSIDE',
      status: 'ACTIVE',
    });

    await Worker.findByIdAndUpdate(worker._id, { assignedDevice: device._id });

    const event = await Event.create({
      eventType: 'FALL_DETECTED',
      severity: 'CRITICAL',
      message: 'Possible fall detected for Test Worker at ZONE-A',
      worker: worker._id,
      device: device._id,
      metadata: {
        temperature: 38.2,
        batteryLevel: 72,
      },
    });

    const incident = await Incident.create({
      type: 'FALL_DETECTED',
      title: 'FALL DETECTED incident',
      description: event.message,
      severity: 'CRITICAL',
      status: 'OPEN',
      worker: worker._id,
      device: device._id,
      sourceEvent: event._id,
      location: {
        zone: 'ZONE-A',
        lat: 23.75,
        lng: 90.38,
      },
    });

    incidentId = incident._id.toString();
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Promise.all([
      Worker.deleteMany({}),
      Device.deleteMany({}),
      Event.deleteMany({}),
      Incident.deleteMany({}),
    ]);

    await seedCoreData();
  });

  test('lists workers with required summary fields', async () => {
    const res = await request(app).get('/api/workers');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].workerId).toBeDefined();
    expect(res.body.data[0].deviceId).toBeDefined();
    expect(res.body.data[0].batteryLevel).toBeDefined();
  });

  test('lists devices', async () => {
    const res = await request(app).get('/api/devices');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  test('returns filtered incidents', async () => {
    const res = await request(app).get('/api/incidents?status=OPEN');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every((item) => item.status === 'OPEN')).toBe(true);
  });

  test('acknowledges then resolves an incident', async () => {
    const ackRes = await request(app).post(`/api/incidents/${incidentId}/acknowledge`);

    expect(ackRes.statusCode).toBe(200);
    expect(ackRes.body.data.status).toBe('ACKNOWLEDGED');

    const resolveRes = await request(app)
      .post(`/api/incidents/${incidentId}/resolve`)
      .send({ resolutionNote: 'Issue handled by supervisor' });

    expect(resolveRes.statusCode).toBe(200);
    expect(resolveRes.body.data.status).toBe('RESOLVED');
  });

  test('returns dashboard health and visualization data', async () => {
    const res = await request(app).get('/api/dashboard');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.systemHealth).toBeDefined();
    expect(res.body.data.visualization).toBeDefined();
  });
});
