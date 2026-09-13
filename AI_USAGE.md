# AI Usage Log – SafeOps Monitor Backend

This file documents significant AI-assisted development tasks carried out during the
SafeOps Monitor backend project. Each entry records the prompt used, what the AI
generated, what was reviewed or changed by the developer, and how the output was
validated.

---

## Task 1 – Full Backend Scaffold (Project Foundation)

### Date
September 2026

### Prompt used

> Create a production-ready Node.js and Express backend named SafeOps Monitor with
> MongoDB and Mongoose. Use a clean modular folder structure: config, models, routes,
> controllers, services, middleware, utils. Add dotenv, cors, and nodemon support.
>
> Design and implement Mongoose schemas for Worker, Device, Event, and Incident. Use
> ObjectId references and include realistic fields: workerId, deviceId, status, battery,
> location, severity, timestamps, and incident lifecycle states.
>
> Implement REST APIs under /api for auth, workers, devices, incidents, events, and
> dashboard. Include list/detail endpoints, incident acknowledge/resolve actions, and
> consistent JSON response format with success, message, data, and count.

### What AI generated

- Express application with `config/`, `models/`, `routes/`, `controllers/`, `services/`,
  `middleware/`, and `utils/` folder structure.
- Mongoose models: `Worker` (workerId, name, role, status, location, assignedDevice),
  `Device` (deviceId, batteryLevel, temperature, geofenceStatus, status, lastSeenAt),
  `Event` (eventType, severity, message, worker, device, metadata),
  `Incident` (type, title, description, severity, status, worker, device, sourceEvent,
  location, acknowledgedAt, resolvedAt, resolutionNote).
- REST controllers for workers, devices, incidents, events, and dashboard with consistent
  `{ success, count, data }` JSON envelope.
- `connectDB` using `MONGODB_URI` from environment; graceful error exit on failure.
- CORS, `express.json()`, and `express.urlencoded()` middleware.
- `nodemon` dev script and `dotenv` configuration.

### What was reviewed and changed

- Added an explicit `/api/devices` API area to match assessment coverage requirements.
- Expanded seed data realism targets (12 workers, 12 devices, 60 events, 15 incidents).
- Added dashboard health/visualization payload sections for frontend readiness.
- Decided to disable automatic bootstrap by default (`ENABLE_BOOTSTRAP=false`) for
  remote/shared database safety.

### How validation was performed

- Runtime API smoke tests for workers, incidents, dashboard, and events.
- Confirmed consistent JSON response shape across all endpoints.

---

## Task 2 – Real-Time Simulator, Socket.IO, and Incident Automation

### Date
September 2026

### Prompt used

> Build a real-time event simulator service that generates safety events every
> configurable 15–20 seconds using environment variables. Event types must include
> HIGH_TEMPERATURE, LOW_BATTERY, FALL_DETECTED, NO_MOVEMENT, GEOFENCE_BREACH, and SOS.
>
> Persist every simulated event to MongoDB and automatically create incidents when
> severity is HIGH or CRITICAL. Emit both safety:event and safety:incident to all
> connected clients using Socket.IO.
>
> Add a dashboard controller that returns summary metrics: active workers, online/offline
> devices, open and critical incidents, recent events/incidents, incidents by
> severity/day, and system health details.
>
> Create a seed/bootstrap strategy that can insert realistic demo data (10+ workers/
> devices, 50+ events, 10+ incidents) but can be turned off in remote environments
> using ENABLE_BOOTSTRAP=false.

### What AI generated

- `simulatorService.js` with a random-interval `setTimeout` loop (`SIMULATOR_MIN_MS` /
  `SIMULATOR_MAX_MS`), random worker/device/event-type selection, and automatic incident
  creation for HIGH and CRITICAL events.
- Socket.IO server wired in `server.js`; `emitSafetyEvent` and `emitIncident` helpers
  in `socketService.js`.
- Dashboard controller aggregating worker/device/incident counts, recent records,
  `incidentsBySeverity` and `incidentsByDay` chart data, and `systemHealth` block.
- `bootstrapService.js` seeding 12 workers, 12 devices, 60 historical events, and up
  to 15 incidents; controlled by `ENABLE_BOOTSTRAP` env flag.
- `getSimulatorState` and `stopEventSimulator` exports for graceful shutdown.

### What was reviewed and changed

- Confirmed `ENABLE_BOOTSTRAP=false` is the default so shared databases are not
  accidentally overwritten on restart.
- Added `ENABLE_SIMULATOR` flag to allow simulator to be disabled independently.
- Verified Socket.IO CORS allows all origins for development flexibility.

### How validation was performed

- Ran `npm run dev`, observed simulator logs at configurable intervals.
- Confirmed events and incidents appeared in MongoDB after simulator ticks.
- Verified `safety:event` and `safety:incident` Socket.IO messages using browser devtools.
- Confirmed dashboard endpoint returned all expected metric fields.

---

## Task 3 – JWT Authentication and Request Validation

### Date
September 2026

### Prompt used

> Add JWT authentication with register, login, and logout endpoints. Create auth
> middleware to protect operational routes and return proper 401 responses for missing
> or invalid tokens.
>
> Add robust request validation using Zod for params, query, and body. Validate
> incident filters, event filters, auth payloads, and ObjectId fields with clear
> 400 error messages.
>
> Add a backend test suite with Jest + Supertest + mongodb-memory-server covering
> auth success/failure, protected routes, worker/device listing, incident lifecycle,
> and dashboard payload checks.

### What AI generated

- `User` model with bcrypt pre-save hook and `comparePassword` method.
- `authController.js` with register (201 + JWT), login (200 + JWT), and logout handlers.
- `authMiddleware.js` extracting and verifying Bearer tokens; attaches `req.user`.
- `requireAuth` applied to all operational route files.
- Zod schemas for register, login, worker query, device query, incident query, event
  query, resolve-incident body, and ObjectId path params.
- `validateRequest` and `validateObjectId` middleware using Zod `safeParse`.
- Jest + Supertest test suite using `mongodb-memory-server` covering 8 test cases:
  register success, login failure, protected-route 401, worker list, device list,
  incident filter, incident acknowledge/resolve lifecycle, and dashboard payload shape.

### What was reviewed and changed

- Confirmed `password` field uses `select: false` so it is never returned in responses.
- Confirmed token expiry is 7 days and `JWT_SECRET` is validated at startup.
- Fixed Mongoose pre-save hook from callback-based `next` to modern `async` style
  (original generated code caused a `next is not a function` runtime error on register).
- Sanitised `.env.example` — original AI output contained a real MongoDB connection
  credential; replaced with a placeholder URI.

### How validation was performed

- Ran `npm test` — all 8 tests passed.
- Manually tested register, login, and protected endpoints.
- Confirmed 401 on missing token and 400 on invalid Zod payloads.

---

## Task 4 – Codebase Readability Refactor

### Date
September 2026

### Prompt used

> Across the project use reasonable variable names so that the code can be readable.

### What AI generated

- Renamed vague local variables (`payload` → `populatedIncident`, `data` →
  `workerSummaries`, `simulator` → `simulatorState`) in controllers.
- Renamed internal service helpers (`buildMessage` → `buildSafetyEventMessage`,
  `randomInt` → `randomIntegerInRange`, `pickRandom` → `pickRandomItem`,
  `simulatorTimer` → `simulationTimeoutHandle`, `scheduleNext` →
  `scheduleNextSimulatedEvent`).
- Renamed socket internals (`ioInstance` → `socketServer`, `initSocket` →
  `initializeSocket`).
- Renamed test variables (`token` → `authToken`, `loginRes` → `loginResponse`, etc.).
- Preserved all API response keys and MongoDB schema fields to avoid breaking changes.

### How validation was performed

- Ran `npm test` — all 8 tests passed.
- Confirmed no lint errors across the entire `src/` directory.

---

## Task 5 – Swagger / OpenAPI Interactive Documentation

### Date
September 2026

### Prompt used

> Implement Swagger/OpenAPI documentation and interactive API testing for the existing
> SafeOps Monitor Node.js + Express.js + MongoDB backend.
>
> Add a production-oriented Swagger/OpenAPI setup that automatically generates
> interactive web-based API documentation. The Swagger UI should allow backend
> developers, frontend developers, and QA/testers to view all available REST endpoints,
> understand request/response structures, and execute requests with Try it out.
>
> Document every existing endpoint with HTTP method, path, description, parameters,
> request body, response schemas, error codes, and examples. Define reusable OpenAPI
> component schemas for Worker, Device, Event, Incident, Auth, Dashboard, and Error.
> Mount Swagger UI at /api-docs. Update README.md and AI_USAGE.md. Validate with
> npm run dev and npm test.

### What AI generated

- Installed `swagger-jsdoc` and `swagger-ui-express`.
- `src/config/swagger.js` with OpenAPI 3.0.3 definition, `bearerAuth` security scheme,
  and 14 reusable component schemas: `ObjectId`, `Location`, `ErrorResponse`,
  `PublicUser`, `AuthResponse`, `RegisterRequest`, `LoginRequest`, `Device`,
  `WorkerSummary`, `WorkerDetail`, `Event`, `Incident`, `SimulatorState`,
  `DashboardResponse`.
- Full `@openapi` JSDoc annotations on all six route files covering every endpoint,
  query parameter, path parameter, request body, and success/error response.
- Swagger UI mounted in `app.js` at `/api-docs` with `persistAuthorization`,
  `displayRequestDuration`, and `tryItOutEnabled` enabled.
- Raw OpenAPI JSON served at `/api-docs.json` for Postman import and code generation.
- README updated with a complete Swagger usage guide for developers and testers.

### What was reviewed and changed

- Verified all response schema field names match the actual controller return values
  (no invented fields).
- Confirmed `security: bearerAuth` is applied only to protected routes and omitted
  from public auth endpoints (register, login).
- Confirmed `tryItOutEnabled: true` so Try it out is active without extra clicks.

### How validation was performed

1. Ran `npm run dev` — MongoDB connected, server started on port 5000.
2. Opened `http://localhost:5000/api-docs` — all six tag groups appeared with correct
   endpoints, parameters, and schemas.
3. Used Try it out: register → copy token → Authorize → GET /api/workers, GET
   /api/dashboard, POST /api/incidents/{id}/acknowledge — all returned correct status
   codes and response JSON.
4. Confirmed Swagger Curl section generates the correct command for each request.
5. Tested failure scenarios: no token → 401, invalid ObjectId → 400, duplicate email → 409.
6. Ran `npm test` — all 8 tests passed with no regressions.

---

## Task 6 – Realistic Seed Data (20 Workers / 20 Devices) and Device assignedTo Property

### Date
September 2026

### Prompt used

> Use realistic seeded data, for example 10-20 workers, 10-20 devices, 50+ historical
> events, and 10+ incidents. The candidate should explain the schema and why the
> relationships were chosen. As the requirements say 10-20 workers and 10-20 devices,
> in my project these amounts of devices and workers data needed to be added in the
> database and also should be implemented this way that one worker is assigned to only
> one specific device. So implement this way and send the update data to mongodb database.
>
> Update the device list to include an assignedTo property that stores the unique ID
> of the worker assigned to each device. This will allow us to clearly identify which
> device is assigned to which worker directly from the device list.

### What AI generated

- Expanded `sampleWorkers` in `bootstrapService.js` from 12 to **20 named workers**
  across five zones (ZONE-A through ZONE-E) with realistic roles (Welder, Operator,
  Inspector, Forklift Driver, Technician, Supervisor, Assembler, Mechanic, Safety
  Officer, Electrician, Quality Control, Scaffolder, Crane Operator).
- Added `unique: true` and `sparse: true` to `Device.worker` in the Mongoose schema
  so the database itself enforces the one-worker-per-device rule.
- Added `assignedTo: String` field to the `Device` schema to store the human-readable
  worker ID (e.g. `"W-101"`) alongside the ObjectId reference in `Device.worker`.
- Seeder populates `assignedTo` with `worker.workerId` at device creation time so
  clients can identify the assigned worker from the device list without a `populate()`
  call.
- Increased historical events from 60 to **80** and incidents cap from 15 to **20**.
- Updated `scripts/seed.js` to `deleteMany` all four collections before re-seeding,
  making `npm run seed` safely re-runnable at any time.

### What was reviewed and changed

- Chose `String` (not ObjectId) for `assignedTo` so the value is human-readable in
  API responses and MongoDB Atlas UI without a join.
- Chose `sparse: true` on the unique index so devices not yet assigned to a worker
  do not conflict with each other.
- Verified the seeder builds a `deviceByWorkerId` lookup map so each event/incident
  always uses the correct device for its worker — no random device mis-assignment.
- Kept `Worker.assignedDevice` (ObjectId back-link) intact for reverse lookups.

**Developer fix (not AI-generated):** The AI did not align the device status with the worker
status. This was corrected manually:
- Worker status enum was narrowed to only `ACTIVE` and `INACTIVE`.
- The seeder was updated to set `device.status = 'INACTIVE'` whenever the assigned
  worker's status is `INACTIVE`, removing the active-device / inactive-worker mismatch.
- Both `deviceController.js` and `workerController.js` were updated to derive the
  effective device status at response time: if the worker is `INACTIVE` the device
  is reported as `INACTIVE` regardless of its stored value, as a safety net for any
  future data inconsistencies.
- All enum references in `validators.js`, `swagger.js`, and JSDoc annotations in
  `workerRoutes.js` were updated to reflect the two-value status model.

### How validation was performed

1. Ran `npm run seed` — output: `20 workers, 20 devices, 80 events, 20 incidents`.
2. Queried Atlas: `duplicateWorkerAssignments: 0` confirming the 1:1 constraint holds.
3. Printed all 20 devices — every `assignedTo` value matched the correct `workerId`
   (SAFEOPS-1000 → W-101, …, SAFEOPS-1019 → W-120).
4. Ran `npm run dev` — server started, existing endpoints unaffected.
