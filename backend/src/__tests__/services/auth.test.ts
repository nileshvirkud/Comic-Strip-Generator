import { AuthService } from '@/services/auth';
import jwt from 'jsonwebtoken';

describe('AuthService', () => {
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    passwordHash: '',
    subscriptionTier: 'free' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await AuthService.hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await AuthService.hashPassword(password);
      const isValid = await AuthService.comparePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await AuthService.hashPassword(password);
      const isValid = await AuthService.comparePassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const token = AuthService.generateToken(testUser);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      // Verify token structure
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should include user data in token payload', () => {
      const token = AuthService.generateToken(testUser);
      const decoded = jwt.decode(token) as any;

      expect(decoded).toBeTruthy();
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.subscriptionTier).toBe(testUser.subscriptionTier);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = AuthService.generateToken(testUser);
      const decoded = AuthService.verifyToken(token);

      expect(decoded).toBeTruthy();
      expect((decoded as any).id).toBe(testUser.id);
      expect((decoded as any).email).toBe(testUser.email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        AuthService.verifyToken(invalidToken);
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      // Create token with very short expiry
      const shortLivedToken = jwt.sign(
        {
          id: testUser.id,
          email: testUser.email,
          subscriptionTier: testUser.subscriptionTier,
        },
        process.env.JWT_SECRET!,
        { expiresIn: '1ms' }
      );

      // Wait for token to expire
      setTimeout(() => {
        expect(() => {
          AuthService.verifyToken(shortLivedToken);
        }).toThrow();
      }, 10);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token', () => {
      const refreshToken = AuthService.generateRefreshToken(testUser.id);

      expect(refreshToken).toBeTruthy();
      expect(typeof refreshToken).toBe('string');

      const decoded = jwt.decode(refreshToken) as any;
      expect(decoded.userId).toBe(testUser.id);
    });
  });
});