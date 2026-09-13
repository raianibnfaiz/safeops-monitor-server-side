const { z } = require('zod');
const { EVENT_TYPES } = require('./constants');

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const incidentStatuses = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'];
const incidentSeverities = ['HIGH', 'CRITICAL'];
const eventSeverities = ['WARNING', 'HIGH', 'CRITICAL'];
const workerStatuses = ['ACTIVE', 'INACTIVE'];
const deviceStatuses = ['ACTIVE', 'INACTIVE'];

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters long'),
    email: z.string().trim().email('Email must be valid'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
  query: z.object({}),
  params: z.object({}),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Email must be valid'),
    password: z.string().min(1, 'Password is required'),
  }),
  query: z.object({}),
  params: z.object({}),
});

const workersQuerySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    search: z.string().trim().optional(),
    status: z.enum(workerStatuses).optional(),
    deviceStatus: z.enum(deviceStatuses).optional(),
  }),
});

const optionalUppercaseEnum = (allowedValues) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? value.trim().toUpperCase() : value),
    z.enum(allowedValues).optional()
  );

const incidentsQuerySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    status: optionalUppercaseEnum(incidentStatuses),
    severity: optionalUppercaseEnum(incidentSeverities),
    type: optionalUppercaseEnum(EVENT_TYPES),
    workerId: z.string().regex(objectIdRegex, 'workerId must be a valid ObjectId').optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
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
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    severity: optionalUppercaseEnum(eventSeverities),
    eventType: optionalUppercaseEnum(EVENT_TYPES),
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
  registerSchema,
  loginSchema,
  workersQuerySchema,
  incidentsQuerySchema,
  resolveIncidentSchema,
  eventsQuerySchema,
  devicesQuerySchema,
};
