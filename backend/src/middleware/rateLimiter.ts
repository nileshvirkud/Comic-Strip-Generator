import rateLimit from 'express-rate-limit';
import { config } from '@/utils/config';
import { RateLimitError } from '@/utils/errors';

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: config.rateLimiting.windowMs,
  max: config.rateLimiting.maxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new RateLimitError('Too many requests from this IP, please try again later'));
  },
});

// Auth rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res, next) => {
    next(new RateLimitError('Too many authentication attempts, please try again later'));
  },
});

// Comic generation rate limiter
export const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 generations per hour for free users
  message: 'Generation limit exceeded, please upgrade your plan or try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return (req as any).user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for premium/enterprise users
    const user = (req as any).user;
    return user && ['premium', 'enterprise'].includes(user.subscriptionTier);
  },
  handler: (req, res, next) => {
    next(new RateLimitError('Generation limit exceeded, please upgrade your plan or try again later'));
  },
});