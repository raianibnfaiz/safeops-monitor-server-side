const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'SafeOps Monitor API',
    version: '1.0.0',
    description:
      'REST API for the SafeOps Monitor worker safety monitoring platform. ' +
      'Provides endpoints for managing workers, devices, incidents, events, and the operational dashboard. ' +
      'All operational endpoints require a JWT Bearer token obtained from /api/auth/login.',
    contact: {
      name: 'SafeOps Development Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from POST /api/auth/login. Include as: Authorization: Bearer <token>',
      },
    },
    schemas: {
      // ─── Primitives & shared fragments ────────────────────────────────────────
      ObjectId: {
        type: 'string',
        pattern: '^[a-fA-F0-9]{24}$',
        example: '6650f2a1c2e4b12345abcd01',
        description: 'MongoDB ObjectId (24-character hex string)',
      },
      Location: {
        type: 'object',
        properties: {
          zone: { type: 'string', example: 'ZONE-A' },
          lat: { type: 'number', format: 'float', example: 23.78 },
          lng: { type: 'number', format: 'float', example: 90.4 },
        },
      },

      // ─── Error ────────────────────────────────────────────────────────────────
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Resource not found' },
        },
        required: ['success', 'message'],
      },

      // ─── User / Auth ──────────────────────────────────────────────────────────
      PublicUser: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/ObjectId' },
          name: { type: 'string', example: 'Amina Rahman' },
          email: { type: 'string', format: 'email', example: 'amina@safeops.local' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/PublicUser' },
              token: {
                type: 'string',
                description: 'JWT Bearer token valid for 7 days',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
            },
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, example: 'Amina Rahman' },
          email: { type: 'string', format: 'email', example: 'amina@safeops.local' },
          password: { type: 'string', minLength: 6, example: 'secret123' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'amina@safeops.local' },
          password: { type: 'string', example: 'secret123' },
        },
      },

      // ─── Device ───────────────────────────────────────────────────────────────
      Device: {
        type: 'object',
        properties: {
          _id: { $ref: '#/components/schemas/ObjectId' },
          deviceId: { type: 'string', example: 'SAFEOPS-1000' },
          worker: { $ref: '#/components/schemas/ObjectId' },
          batteryLevel: { type: 'integer', minimum: 0, maximum: 100, example: 72 },
          temperature: { type: 'number', format: 'float', example: 37.2 },
          geofenceStatus: { type: 'string', enum: ['INSIDE', 'OUTSIDE'], example: 'INSIDE' },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
            example: 'ACTIVE',
          },
          lastSeenAt: { type: 'string', format: 'date-time', example: '2026-09-09T07:30:00.000Z' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      // ─── Worker ───────────────────────────────────────────────────────────────
      WorkerSummary: {
        type: 'object',
        description: 'Lightweight worker record returned by GET /api/workers',
        properties: {
          id: { $ref: '#/components/schemas/ObjectId' },
          workerId: { type: 'string', example: 'W-101' },
          name: { type: 'string', example: 'Amina Rahman' },
          role: { type: 'string', example: 'Welder' },
          status: { type: 'string', enum: ['ACTIVE', 'OFFLINE', 'ON_BREAK'], example: 'ACTIVE' },
          lastKnownLocation: { $ref: '#/components/schemas/Location' },
          lastActivity: { type: 'string', format: 'date-time', example: '2026-09-09T07:30:00.000Z' },
          batteryLevel: { type: 'integer', nullable: true, example: 72 },
          deviceId: { type: 'string', nullable: true, example: 'SAFEOPS-1000' },
          deviceStatus: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'UNASSIGNED'],
            example: 'ACTIVE',
          },
          assignedDevice: { $ref: '#/components/schemas/Device' },
        },
      },
      WorkerDetail: {
        type: 'object',
        description: 'Full worker record returned by GET /api/workers/:id',
        allOf: [
          {
            type: 'object',
            properties: {
              _id: { $ref: '#/components/schemas/ObjectId' },
              workerId: { type: 'string', example: 'W-101' },
              name: { type: 'string', example: 'Amina Rahman' },
              role: { type: 'string', example: 'Welder' },
              status: { type: 'string', enum: ['ACTIVE', 'OFFLINE', 'ON_BREAK'], example: 'ACTIVE' },
              location: { $ref: '#/components/schemas/Location' },
              assignedDevice: { $ref: '#/components/schemas/Device' },
              lastActivity: { type: 'string', format: 'date-time' },
              batteryLevel: { type: 'integer', nullable: true, example: 72 },
              recentEvents: {
                type: 'array',
                items: { $ref: '#/components/schemas/Event' },
              },
              incidentHistory: {
                type: 'array',
                items: { $ref: '#/components/schemas/Incident' },
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },

      // ─── Event ────────────────────────────────────────────────────────────────
      Event: {
        type: 'object',
        properties: {
          _id: { $ref: '#/components/schemas/ObjectId' },
          eventType: {
            type: 'string',
            enum: ['HIGH_TEMPERATURE', 'LOW_BATTERY', 'FALL_DETECTED', 'NO_MOVEMENT', 'GEOFENCE_BREACH', 'SOS'],
            example: 'FALL_DETECTED',
          },
          severity: {
            type: 'string',
            enum: ['WARNING', 'HIGH', 'CRITICAL'],
            example: 'CRITICAL',
          },
          message: {
            type: 'string',
            example: 'Possible fall detected for Amina Rahman at ZONE-A',
          },
          worker: { $ref: '#/components/schemas/WorkerSummary' },
          device: { $ref: '#/components/schemas/Device' },
          metadata: {
            type: 'object',
            example: {
              temperature: 37.2,
              batteryLevel: 72,
              geofenceStatus: 'INSIDE',
              movementScore: 14,
              location: { zone: 'ZONE-A', lat: 23.78, lng: 90.4 },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      // ─── Incident ─────────────────────────────────────────────────────────────
      Incident: {
        type: 'object',
        properties: {
          _id: { $ref: '#/components/schemas/ObjectId' },
          type: {
            type: 'string',
            enum: ['HIGH_TEMPERATURE', 'LOW_BATTERY', 'FALL_DETECTED', 'NO_MOVEMENT', 'GEOFENCE_BREACH', 'SOS'],
            example: 'FALL_DETECTED',
          },
          title: { type: 'string', example: 'FALL DETECTED incident' },
          description: {
            type: 'string',
            example: 'Possible fall detected for Amina Rahman at ZONE-A',
          },
          severity: { type: 'string', enum: ['HIGH', 'CRITICAL'], example: 'CRITICAL' },
          status: {
            type: 'string',
            enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'],
            example: 'OPEN',
          },
          worker: { $ref: '#/components/schemas/WorkerSummary' },
          device: { $ref: '#/components/schemas/Device' },
          sourceEvent: { $ref: '#/components/schemas/Event' },
          location: { $ref: '#/components/schemas/Location' },
          acknowledgedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: null,
          },
          resolvedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: null,
          },
          resolutionNote: {
            type: 'string',
            nullable: true,
            example: null,
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      // ─── Dashboard ────────────────────────────────────────────────────────────
      SimulatorState: {
        type: 'object',
        properties: {
          isRunning: { type: 'boolean', example: true },
          lastGeneratedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2026-09-09T07:28:00.000Z',
          },
          nextDelayMs: { type: 'integer', nullable: true, example: 17340 },
        },
      },
      DashboardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              workersTotal: { type: 'integer', example: 12 },
              activeWorkers: { type: 'integer', example: 10 },
              devicesTotal: { type: 'integer', example: 12 },
              devices: {
                type: 'object',
                properties: {
                  online: { type: 'integer', example: 11 },
                  offline: { type: 'integer', example: 1 },
                },
              },
              incidents: {
                type: 'object',
                properties: {
                  open: { type: 'integer', example: 4 },
                  acknowledged: { type: 'integer', example: 3 },
                  resolved: { type: 'integer', example: 8 },
                },
              },
              criticalEvents: { type: 'integer', example: 7 },
              visualization: {
                type: 'object',
                properties: {
                  incidentsBySeverity: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        severity: { type: 'string', example: 'CRITICAL' },
                        count: { type: 'integer', example: 5 },
                      },
                    },
                  },
                  incidentsByDay: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        day: { type: 'string', example: '2026-09-07' },
                        count: { type: 'integer', example: 3 },
                      },
                    },
                  },
                },
              },
              systemHealth: {
                type: 'object',
                properties: {
                  database: { type: 'string', example: 'CONNECTED' },
                  simulator: { $ref: '#/components/schemas/SimulatorState' },
                  clientsConnected: { type: 'integer', example: 2 },
                  uptimeSeconds: { type: 'integer', example: 3600 },
                },
              },
              recentIncidents: {
                type: 'array',
                items: { $ref: '#/components/schemas/Incident' },
              },
              recentEvents: {
                type: 'array',
                items: { $ref: '#/components/schemas/Event' },
              },
            },
          },
        },
      },
    },
  },
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    path.join(__dirname, '../routes/*.js'),
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
