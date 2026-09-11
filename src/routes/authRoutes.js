const express = require('express');
const { register, login, logout } = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const { requireAuth } = require('../middleware/authMiddleware');
const { registerSchema, loginSchema } = require('../utils/validators');

const router = express.Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', requireAuth, logout);

module.exports = router;
