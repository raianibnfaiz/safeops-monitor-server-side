# SafeOps Monitor Backend

Production-style Node.js + Express backend for worker safety monitoring with MongoDB persistence and Socket.IO real-time updates.

## Features

- JWT-based authentication (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`)
- Protected operational APIs for workers, devices, incidents, events, and dashboard
- Real-time event simulator (configurable interval) with Socket.IO broadcasts
- Incident lifecycle management (`OPEN -> ACKNOWLEDGED -> RESOLVED`)
- MongoDB models for Worker, Device, Event, Incident, User
- Centralized error handling and request validation with Zod
- Seed support for realistic baseline data (12 workers, 12 devices, 60 events, 15 incidents)
- Backend test suite using Jest, Supertest, and MongoDB Memory Server

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.IO
- Zod
- Jest + Supertest

## Project Structure

src/
- config/
- controllers/
- middleware/
- models/
- routes/
- services/
- utils/

scripts/
- seed.js

tests/
- api.test.js

## Environment Variables

Copy `.env.example` to `.env` and set values:

- `PORT` API server port
- `MONGODB_URI` MongoDB connection URI (local or remote)
- `JWT_SECRET` secret used to sign/verify JWT
- `ENABLE_BOOTSTRAP` one-time auto-seed for an empty database at startup
- `ENABLE_SIMULATOR` set `false` to disable live event simulation
- `SIMULATOR_MIN_MS` minimum simulator interval in milliseconds
- `SIMULATOR_MAX_MS` maximum simulator interval in milliseconds

## Run Locally

1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp .env.example .env
```

3. (Optional) seed data once

```bash
npm run seed
```

4. Start development server

```bash
npm run dev
```

Server base URL: `http://localhost:5000`

## API Base Path

All endpoints are prefixed with `/api`.

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Workers

- `GET /api/workers`
- `GET /api/workers/:id`

### Devices

- `GET /api/devices`
- `GET /api/devices/:id`

### Incidents

- `GET /api/incidents`
- `POST /api/incidents/:id/acknowledge`
- `POST /api/incidents/:id/resolve`

### Events

- `GET /api/events`

### Dashboard

- `GET /api/dashboard`

## Real-Time Events

Socket.IO events emitted to connected clients:

- `safety:event`
- `safety:incident`

## Testing

Run backend tests:

```bash
npm test
```

Current test suite covers:

- Register/login success/failure paths
- Protected route authorization
- Worker listing fields
- Device listing
- Incident filtering and lifecycle actions
- Dashboard health/visualization payload shape

## Notes

- For remote/shared environments, keep `ENABLE_BOOTSTRAP=false` to avoid automatic sample data inserts.
- Use `npm run seed` when you intentionally want baseline demo data.
