import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import { User } from '../types';

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
    };

    return jwt.sign(payload, config.jwt.secret as string, {
      expiresIn: '7d',
    });
  }

  static verifyToken(token: string): any {
    return jwt.verify(token, config.jwt.secret as string);
  }

  static generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, config.jwt.secret as string, {
      expiresIn: '30d',
    });
  }
}