import { Router } from 'express';
import { getTemplates, getTemplate } from '../controllers/templates';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Templates can be viewed without authentication, but auth is optional for personalization
router.use(optionalAuth);

// GET /api/templates
router.get('/', getTemplates);

// GET /api/templates/:id
router.get('/:id', getTemplate);

export default router;