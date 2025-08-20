import multer from 'multer';
import path from 'path';
import { config } from '../utils/config';
import { FileUploadError } from '../utils/errors';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new FileUploadError(`File type ${file.mimetype} not allowed`));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 5, // Max 5 files per request
  },
});

// Middleware for handling upload errors
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new FileUploadError('File too large'));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new FileUploadError('Too many files'));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new FileUploadError('Unexpected file field'));
    }
  }
  next(error);
};