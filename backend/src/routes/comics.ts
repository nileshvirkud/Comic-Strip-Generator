import { Router } from 'express';
import {
  generateComic,
  getComic,
  getUserComics,
  getComicStatus,
  updateComic,
  deleteComic,
  generateComicValidation,
} from '../controllers/comics';
import { exportComic, exportComicValidation } from '../controllers/export';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { generationLimiter } from '../middleware/rateLimiter';
import { upload, handleUploadError } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/comics/generate
router.post(
  '/generate',
  generationLimiter,
  upload.array('characterReferences', 5),
  handleUploadError,
  validate(generateComicValidation),
  generateComic
);

// GET /api/comics
router.get('/', getUserComics);

// GET /api/comics/:id
router.get('/:id', getComic);

// GET /api/comics/:id/status
router.get('/:id/status', getComicStatus);

// POST /api/comics/:id/export
router.post(
  '/:id/export',
  validate(exportComicValidation),
  exportComic
);

// PUT /api/comics/:id
router.put('/:id', updateComic);

// DELETE /api/comics/:id
router.delete('/:id', deleteComic);

export default router;