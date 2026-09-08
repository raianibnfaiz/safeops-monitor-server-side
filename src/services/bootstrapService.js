const Device = require('../models/Device');
const Worker = require('../models/Worker');

const sampleWorkers = [
  { name: 'Amina Rahman', role: 'Welder', location: { zone: 'ZONE-A', lat: 23.78, lng: 90.4 } },
  { name: 'Rafiq Hasan', role: 'Operator', location: { zone: 'ZONE-B', lat: 23.79, lng: 90.41 } },
  { name: 'Nadia Karim', role: 'Inspector', location: { zone: 'ZONE-C', lat: 23.8, lng: 90.42 } },
];

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

  console.log('Baseline workers and devices created');
};

module.exports = {
  ensureBaselineData,
};
