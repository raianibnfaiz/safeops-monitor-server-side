# AI Usage Report

## Tools Used

- GitHub Copilot Chat (GPT-5.3-Codex)
- Terminal tooling for runtime/testing verification

## High-Quality Prompts That Produced This Output

1. Create a production-ready Node.js and Express backend named SafeOps Monitor with MongoDB and Mongoose. Use a clean modular folder structure: config, models, routes, controllers, services, middleware, utils. Add dotenv, cors, and nodemon support.
2. Design and implement Mongoose schemas for Worker, Device, Event, and Incident. Use ObjectId references and include realistic fields: workerId, deviceId, status, battery, location, severity, timestamps, and incident lifecycle states.
3. Implement REST APIs under /api for auth, workers, devices, incidents, events, and dashboard. Include list/detail endpoints, incident acknowledge/resolve actions, and consistent JSON response format with success, message, data, and count.
4. Add JWT authentication with register, login, and logout endpoints. Create auth middleware to protect operational routes and return proper 401 responses for missing or invalid tokens.
5. Add robust request validation using Zod for params, query, and body. Validate incident filters, event filters, auth payloads, and ObjectId fields with clear 400 error messages.
6. Build a real-time event simulator service that generates safety events every configurable 15-20 seconds using environment variables. Event types must include HIGH_TEMPERATURE, LOW_BATTERY, FALL_DETECTED, NO_MOVEMENT, GEOFENCE_BREACH, and SOS.
7. Persist every simulated event to MongoDB and automatically create incidents when severity is HIGH or CRITICAL. Emit both safety:event and safety:incident to all connected clients using Socket.IO.
8. Add a dashboard controller that returns summary metrics: active workers, online/offline devices, open and critical incidents, recent events/incidents, incidents by severity/day, and system health details.
9. Create a seed/bootstrap strategy that can insert realistic demo data (10+ workers/devices, 50+ events, 10+ incidents) but can be turned off in remote environments using ENABLE_BOOTSTRAP=false.
10. Add a backend test suite with Jest + Supertest + mongodb-memory-server covering auth success/failure, protected routes, worker/device listing, incident lifecycle, and dashboard payload checks.
11. Generate a practical README with setup instructions, environment variables, API reference, real-time event info, and test commands.
12. Review generated code for security and correctness. Remove hardcoded secrets, sanitize .env.example, fix runtime issues, and verify behavior with tests and API smoke checks.

## What AI Generated vs Human Decisions

### AI-generated foundation

- Initial route/controller/model scaffolding
- Socket.IO integration and simulator loop structure
- Error handling and middleware layering
- First-pass tests and README scaffolding

### Human-directed decisions and corrections

- Decided to disable automatic bootstrap by default for remote/shared DB safety
- Chose to add an explicit `/api/devices` API area to match assessment coverage
- Expanded seed realism targets to satisfy challenge data expectations
- Added stronger input validation with Zod for key routes
- Added dashboard health/visualization payload sections for frontend readiness

## Example of Incorrect/Unsafe AI Output and Fix

Issue detected:

- `.env.example` contained a real MongoDB connection credential, which is unsafe for version control.

How it was detected:

- Manual inspection of `.env.example` during backend gap review.

Fix applied:

- Replaced with sanitized placeholder URI format and added secure environment variable guidance.

Additional correction example:

- Mongoose hook style initially used callback-based `next` in an async pre-save hook, causing runtime error (`next is not a function`) on register.
- Updated hook to modern async style without `next` callback and re-validated register/login behavior.

## Validation Approach

- Runtime verification with local API smoke tests for auth, workers, incidents, dashboard, and events.
- Confirmed incident acknowledge/resolve transitions and protected-route access behavior.
- Added Jest + Supertest test suite using MongoDB Memory Server to validate representative happy and failure paths.
- Reviewed diagnostics and fixed issues before finalizing changes.
