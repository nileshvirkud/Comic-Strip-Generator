import request from 'supertest';
import { app } from '@/index';
import { prisma } from '@/__tests__/setup';
import { AuthService } from '@/services/auth';

describe('Comics Controller', () => {
  let token: string;
  let userId: string;
  let templateId: string;

  beforeEach(async () => {
    // Create a test user
    const hashedPassword = await AuthService.hashPassword('TestPassword123!');
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: hashedPassword,
        subscriptionTier: 'free',
      },
    });
    userId = user.id;
    token = AuthService.generateToken(user as any);

    // Create a test template
    const template = await prisma.template.create({
      data: {
        name: 'Test Template',
        layoutConfig: {
          rows: 2,
          columns: 2,
          panels: [
            { id: '1', position: { x: 0, y: 0, width: 50, height: 50 } },
            { id: '2', position: { x: 50, y: 0, width: 50, height: 50 } },
            { id: '3', position: { x: 0, y: 50, width: 50, height: 50 } },
            { id: '4', position: { x: 50, y: 50, width: 50, height: 50 } },
          ],
        },
        thumbnailUrl: '/test-thumbnail.png',
        panelCount: 4,
      },
    });
    templateId = template.id;
  });

  describe('POST /api/comics/generate', () => {
    const validComicData = {
      prompt: 'A superhero cat saves the day',
      genre: 'superhero',
      style: 'modern',
      panelCount: 4,
    };

    it('should start comic generation successfully', async () => {
      const response = await request(app)
        .post('/api/comics/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validComicData, templateId })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('comic');
      expect(response.body.data).toHaveProperty('jobId');

      // Verify comic was created in database
      const comic = await prisma.comics.findFirst({
        where: { userId },
      });
      expect(comic).toBeTruthy();
      expect(comic?.prompt).toBe(validComicData.prompt);
    });

    it('should reject generation without authentication', async () => {
      const response = await request(app)
        .post('/api/comics/generate')
        .send({ ...validComicData, templateId })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject generation with invalid template', async () => {
      const response = await request(app)
        .post('/api/comics/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validComicData, templateId: 'invalid-template-id' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject generation with short prompt', async () => {
      const response = await request(app)
        .post('/api/comics/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validComicData, prompt: 'short', templateId })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject generation with invalid genre', async () => {
      const response = await request(app)
        .post('/api/comics/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validComicData, genre: 'invalid-genre', templateId })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/comics/:id', () => {
    let comicId: string;

    beforeEach(async () => {
      const comic = await prisma.comics.create({
        data: {
          userId,
          title: 'Test Comic',
          prompt: 'Test prompt',
          status: 'COMPLETED',
          templateId,
          metadata: {
            genre: 'superhero',
            style: 'modern',
            characterCount: 1,
            layout: 'Test Template',
            colorScheme: 'default',
          },
        },
      });
      comicId = comic.id;
    });

    it('should return comic details for owner', async () => {
      const response = await request(app)
        .get(`/api/comics/${comicId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(comicId);
      expect(response.body.data.title).toBe('Test Comic');
    });

    it('should reject access without authentication', async () => {
      const response = await request(app)
        .get(`/api/comics/${comicId}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject access for non-owner', async () => {
      // Create another user
      const hashedPassword = await AuthService.hashPassword('TestPassword123!');
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: hashedPassword,
          subscriptionTier: 'free',
        },
      });
      const otherToken = AuthService.generateToken(otherUser as any);

      const response = await request(app)
        .get(`/api/comics/${comicId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 404 for non-existent comic', async () => {
      const response = await request(app)
        .get('/api/comics/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/comics', () => {
    beforeEach(async () => {
      // Create multiple test comics
      await prisma.comics.createMany({
        data: [
          {
            userId,
            title: 'Comic 1',
            prompt: 'Test prompt 1',
            status: 'COMPLETED',
            templateId,
            metadata: {
              genre: 'superhero',
              style: 'modern',
              characterCount: 1,
              layout: 'Test Template',
              colorScheme: 'default',
            },
          },
          {
            userId,
            title: 'Comic 2',
            prompt: 'Test prompt 2',
            status: 'GENERATING',
            templateId,
            metadata: {
              genre: 'comedy',
              style: 'cartoon',
              characterCount: 2,
              layout: 'Test Template',
              colorScheme: 'default',
            },
          },
        ],
      });
    });

    it('should return user comics', async () => {
      const response = await request(app)
        .get('/api/comics')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('comics');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.comics).toHaveLength(2);
    });

    it('should filter comics by status', async () => {
      const response = await request(app)
        .get('/api/comics?status=completed')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.comics).toHaveLength(1);
      expect(response.body.data.comics[0].status).toBe('COMPLETED');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/comics?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.comics).toHaveLength(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.total).toBe(2);
    });
  });

  describe('DELETE /api/comics/:id', () => {
    let comicId: string;

    beforeEach(async () => {
      const comic = await prisma.comics.create({
        data: {
          userId,
          title: 'Test Comic',
          prompt: 'Test prompt',
          status: 'COMPLETED',
          templateId,
          metadata: {
            genre: 'superhero',
            style: 'modern',
            characterCount: 1,
            layout: 'Test Template',
            colorScheme: 'default',
          },
        },
      });
      comicId = comic.id;
    });

    it('should delete comic successfully', async () => {
      const response = await request(app)
        .delete(`/api/comics/${comicId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify comic was deleted
      const comic = await prisma.comics.findUnique({
        where: { id: comicId },
      });
      expect(comic).toBeNull();
    });

    it('should reject deletion without authentication', async () => {
      const response = await request(app)
        .delete(`/api/comics/${comicId}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject deletion by non-owner', async () => {
      // Create another user
      const hashedPassword = await AuthService.hashPassword('TestPassword123!');
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: hashedPassword,
          subscriptionTier: 'free',
        },
      });
      const otherToken = AuthService.generateToken(otherUser as any);

      const response = await request(app)
        .delete(`/api/comics/${comicId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});