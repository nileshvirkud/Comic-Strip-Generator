import { Router } from 'express';
import { getProfile } from '@/controllers/auth';
import { authenticate } from '@/middleware/auth';

const router = Router();

// GET /api/users/profile
router.get('/profile', authenticate, getProfile);

export default router;