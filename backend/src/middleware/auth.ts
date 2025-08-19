import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import { AuthenticationError } from '../utils/errors';
import { AuthenticatedRequest } from '../types';

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      subscriptionTier: decoded.subscriptionTier,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        subscriptionTier: decoded.subscriptionTier,
      };
    }

    next();
  } catch (error) {
    // Silently ignore auth errors for optional auth
    next();
  }
};