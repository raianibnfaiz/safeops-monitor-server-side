const express = require('express');
const { register, login, logout } = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const { requireAuth } = require('../middleware/authMiddleware');
const { registerSchema, loginSchema } = require('../utils/validators');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: User registration, login, and logout
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user account
 *     description: |
 *       Creates a new user with hashed password and returns a JWT token.
 *       The token is valid for 7 days and must be sent as a Bearer token
 *       in the Authorization header for all protected endpoints.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             name: Amina Rahman
 *             email: amina@safeops.local
 *             password: secret123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               message: User registered
 *               data:
 *                 user:
 *                   id: 6650f2a1c2e4b12345abcd01
 *                   name: Amina Rahman
 *                   email: amina@safeops.local
 *                 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Validation error – missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Name must be at least 2 characters long
 *       409:
 *         description: Email is already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Email already registered
 */
router.post('/register', validateRequest(registerSchema), register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     description: |
 *       Authenticates an existing user and returns a JWT token.
 *       Store the token securely and include it as `Authorization: Bearer <token>`
 *       on every subsequent protected request.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: amina@safeops.local
 *             password: secret123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               message: Login successful
 *               data:
 *                 user:
 *                   id: 6650f2a1c2e4b12345abcd01
 *                   name: Amina Rahman
 *                   email: amina@safeops.local
 *                 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Validation error – missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: email and password are required
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid credentials
 */
router.post('/login', validateRequest(loginSchema), login);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out the current user
 *     description: |
 *       Stateless logout. The backend confirms receipt and the client must
 *       delete the stored JWT token. No server-side token blacklist is maintained.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout acknowledged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logout successful. Remove token from client storage.
 *       401:
 *         description: Missing or invalid Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Authentication token is required
 */
router.post('/logout', requireAuth, logout);

module.exports = router;
