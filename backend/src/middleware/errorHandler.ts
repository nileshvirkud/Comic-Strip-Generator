import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let appError = error;

  // Convert non-AppError errors to AppError
  if (!(error instanceof AppError)) {
    const statusCode = 500;
    const message = config.nodeEnv === 'production' 
      ? 'Internal server error' 
      : error.message;
    appError = new AppError(message, statusCode, false);
  }

  const { statusCode, message, isOperational } = appError as AppError;

  // Log error
  if (!isOperational || statusCode >= 500) {
    logger.error('Unhandled error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      statusCode,
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(config.nodeEnv === 'development' && {
      stack: error.stack,
    }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};