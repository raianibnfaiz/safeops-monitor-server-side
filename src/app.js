const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { buildSwaggerSpec } = require('./config/swagger');
const workerRoutes = require('./routes/workerRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const eventRoutes = require('./routes/eventRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const authRoutes = require('./routes/authRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve OpenAPI JSON first so Swagger UI on Vercel loads the live server list.
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(buildSwaggerSpec(req));
});

// ─── Swagger UI ───────────────────────────────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(null, {
    customSiteTitle: 'SafeOps Monitor API Docs',
    swaggerOptions: {
      url: '/api-docs.json',
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      tryItOutEnabled: true,
    },
  })
);

const apiIndex = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SafeOps Monitor API is running',
    docs: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      workers: '/api/workers',
      devices: '/api/devices',
      incidents: '/api/incidents',
      events: '/api/events',
      dashboard: '/api/dashboard',
    },
  });
};

app.get('/', apiIndex);
app.get('/api', apiIndex);

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/events', eventRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
