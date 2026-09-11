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
- Interactive Swagger/OpenAPI documentation at `/api-docs`

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

### Authentication Process

- Register with `name`, `email`, and `password` through `/api/auth/register`.
- Login with `email` and `password` through `/api/auth/login`.
- A successful registration or login returns a JWT in `data.token`.
- Store the token securely on the client and send it with every protected request:

```http
Authorization: Bearer <token>
```

- The backend verifies the token and loads the associated user before allowing access.
- Missing, invalid, or expired tokens return HTTP `401`.
- Tokens expire after 7 days; the user must log in again after expiration.
- Logout through `/api/auth/logout`, then remove the token from client storage.
- JWT logout is stateless: the client must delete the token because the backend does not maintain a token blacklist.
- Keep `JWT_SECRET` private, use a strong value, and never commit the `.env` file.

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

## Swagger / OpenAPI Documentation

SafeOps Monitor includes interactive Swagger UI documentation powered by
[swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) and
[swagger-ui-express](https://github.com/scottie1984/swagger-ui-express).

### What it is used for

- Browse every REST endpoint with descriptions, parameters, and response schemas.
- Execute live requests against the running backend directly from the browser.
- Inspect actual HTTP status codes and response JSON without Postman.
- Copy the generated cURL command for debugging or sharing reproduction steps.
- Understand the authentication flow before writing client code.

### Swagger UI URL

```
http://localhost:5000/api-docs
```

The raw OpenAPI JSON specification is also available at:

```
http://localhost:5000/api-docs.json
```

### How to start the backend

```bash
npm run dev
```

Then open `http://localhost:5000/api-docs` in your browser.

### How to use Try it out (developers and testers)

1. Open `http://localhost:5000/api-docs`.
2. Register a user by expanding **POST /api/auth/register**, clicking **Try it out**, filling in `name`, `email`, and `password`, then clicking **Execute**.
3. Copy the `token` value from the response body.
4. Click the **Authorize** button (top right of the page), paste the token, and click **Authorize**.
5. All subsequent requests will automatically include `Authorization: Bearer <token>`.
6. Expand any protected endpoint (e.g. **GET /api/workers**), click **Try it out**, and click **Execute**.
7. The UI shows:
   - The actual HTTP status code returned by the backend.
   - The full JSON response body.
   - The equivalent cURL command under **Curl**.

### How testers can verify API behaviour

- Use the status, severity, type, and workerId query parameters on **GET /api/incidents** to test filtering.
- Test the incident lifecycle: acknowledge an incident with **POST /api/incidents/{id}/acknowledge**, then resolve it with **POST /api/incidents/{id}/resolve**.
- Confirm 401 responses by executing a protected endpoint without authorizing first.
- Confirm 404 responses by using a valid-format but non-existent ObjectId (e.g. `000000000000000000000001`).
- Confirm 400 responses by submitting invalid data (e.g. an invalid email or a too-short password).

### Using the generated cURL command

After executing any request, expand the **Curl** section to copy the exact command. Example:

```bash
curl -X 'GET' \
  'http://localhost:5000/api/workers' \
  -H 'Authorization: Bearer eyJhbGci...'
```

Paste it into a terminal to reproduce the request independently of Swagger.

## Notes

- For remote/shared environments, keep `ENABLE_BOOTSTRAP=false` to avoid automatic sample data inserts.
- Use `npm run seed` when you intentionally want baseline demo data.
