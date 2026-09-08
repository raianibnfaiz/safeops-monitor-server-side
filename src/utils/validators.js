const { z } = require('zod');
const { EVENT_TYPES } = require('./constants');

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const incidentStatuses = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'];
const incidentSeverities = ['HIGH', 'CRITICAL'];
const eventSeverities = ['WARNING', 'HIGH', 'CRITICAL'];
const workerStatuses = ['ACTIVE', 'OFFLINE', 'ON_BREAK'];
const deviceStatuses = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];

const workersQuerySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    search: z.string().trim().optional(),
    status: z.enum(workerStatuses).optional(),
    deviceStatus: z.enum(deviceStatuses).optional(),
  }),
});

const incidentsQuerySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    status: z.enum(incidentStatuses).optional(),
    severity: z.enum(incidentSeverities).optional(),
    type: z.enum(EVENT_TYPES).optional(),
    workerId: z.string().regex(objectIdRegex, 'workerId must be a valid ObjectId').optional(),
  }),
});

const resolveIncidentSchema = z.object({
  query: z.object({}),
  params: z.object({
    id: z.string().regex(objectIdRegex, 'id must be a valid ObjectId'),
  }),
  body: z.object({
    resolutionNote: z
      .string()
      .trim()
      .max(500, 'resolutionNote must be at most 500 characters')
      .optional(),
  }),
});

const eventsQuerySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    severity: z.enum(eventSeverities).optional(),
    eventType: z.enum(EVENT_TYPES).optional(),
    workerId: z.string().regex(objectIdRegex, 'workerId must be a valid ObjectId').optional(),
  }),
});

const devicesQuerySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    status: z.enum(deviceStatuses).optional(),
    geofenceStatus: z.enum(['INSIDE', 'OUTSIDE']).optional(),
    workerId: z.string().regex(objectIdRegex, 'workerId must be a valid ObjectId').optional(),
    search: z.string().trim().optional(),
  }),
});

module.exports = {
  incidentStatuses,
  incidentSeverities,
  eventSeverities,
  workerStatuses,
  deviceStatuses,
  workersQuerySchema,
  incidentsQuerySchema,
  resolveIncidentSchema,
  eventsQuerySchema,
  devicesQuerySchema,
};
