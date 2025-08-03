import { Router } from 'express';
import { register, login, registerValidation, loginValidation } from './controllers/auth';
import { validate } from './middleware/validation';
import { authLimiter } from './middleware/rateLimiter';

const router = Router();

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerValidation), register);

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginValidation), login);

export default router;