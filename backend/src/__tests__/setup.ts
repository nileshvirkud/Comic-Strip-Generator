import { PrismaClient } from '@prisma/client';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/comic_strip_generator_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Track created users and comics for proper test simulation
const createdUsers = new Map();
const createdComics = [];
const deletedItems = new Set();

// Mock Prisma Client to avoid database connection issues in CI
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      user: {
        create: jest.fn().mockImplementation((data) => {
          const userId = `test-user-${Date.now()}-${Math.random()}`;
          const user = {
            id: userId,
            email: data.data.email,
            passwordHash: data.data.passwordHash,
            subscriptionTier: data.data.subscriptionTier || 'free',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          createdUsers.set(data.data.email, user);
          createdUsers.set(userId, user);
          return Promise.resolve(user);
        }),
        findUnique: jest.fn().mockImplementation((query) => {
          if (query.where.email) {
            return Promise.resolve(createdUsers.get(query.where.email) || null);
          }
          if (query.where.id) {
            return Promise.resolve(createdUsers.get(query.where.id) || null);
          }
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({}),
      },
      comics: {
        create: jest.fn().mockImplementation((data) => {
          const comicId = `test-comic-${Date.now()}-${Math.random()}`;
          const comic = {
            id: comicId,
            ...data.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          createdComics.push(comic);
          return Promise.resolve(comic);
        }),
        createMany: jest.fn().mockImplementation((data) => {
          data.data.forEach((comicData, index) => {
            const comicId = `test-comic-${Date.now()}-${index}`;
            createdComics.push({
              id: comicId,
              ...comicData,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          });
          return Promise.resolve({
            count: data.data.length
          });
        }),
        findUnique: jest.fn().mockImplementation((query) => {
          if (query.where.id === 'non-existent-id' || deletedItems.has(query.where.id)) {
            return Promise.resolve(null);
          }
          const comic = createdComics.find(c => c.id === query.where.id);
          if (comic) {
            return Promise.resolve(comic);
          }
          // Fallback for test scenarios - simulate ownership checks
          if (query.where.id && query.where.id.includes('other-user')) {
            return Promise.resolve({
              id: query.where.id,
              userId: 'different-user-id',
              title: 'Test Comic',
              prompt: 'Test prompt',
              status: 'COMPLETED',
              templateId: 'ctest123456789012345678',
              metadata: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockImplementation((query) => {
          let comics = [...createdComics];
          
          // Filter by userId if specified
          if (query.where?.userId) {
            comics = comics.filter(comic => comic.userId === query.where.userId);
          }
          
          // Apply status filter if provided
          if (query.where?.status) {
            comics = comics.filter(comic => comic.status === query.where.status);
          }
          
          // Apply pagination
          const skip = query.skip || 0;
          const take = query.take || comics.length;
          const paginatedComics = comics.slice(skip, skip + take);
          
          // Add template and _count if included
          const result = paginatedComics.map(comic => ({
            ...comic,
            ...(query.include?.template && {
              template: {
                id: 'ctest123456789012345678',
                name: 'Test Template',
                layoutConfig: { rows: 2, columns: 2, panels: [] },
                thumbnailUrl: 'https://example.com/thumb.jpg',
                panelCount: 4,
                createdAt: new Date(),
                updatedAt: new Date(),
              }
            }),
            ...(query.include?._count && {
              _count: { panels: 0 }
            })
          }));
          
          return Promise.resolve(result);
        }),
        findFirst: jest.fn().mockImplementation((query) => {
          let comics = [...createdComics];
          
          // Filter by userId if specified
          if (query.where?.userId) {
            comics = comics.filter(comic => comic.userId === query.where.userId);
          }
          
          // Apply status filter if provided
          if (query.where?.status) {
            comics = comics.filter(comic => comic.status === query.where.status);
          }
          
          return Promise.resolve(comics[0] || null);
        }),
        update: jest.fn(),
        delete: jest.fn().mockImplementation((query) => {
          deletedItems.add(query.where.id);
          const comic = createdComics.find(c => c.id === query.where.id);
          return Promise.resolve(comic || {
            id: query.where.id,
            userId: 'test-user-id',
            title: 'Test Comic',
            prompt: 'Test prompt',
            status: 'COMPLETED',
            templateId: 'ctest123456789012345678',
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }),
        deleteMany: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockImplementation((query) => {
          let comics = [...createdComics];
          
          // Filter by userId if specified
          if (query.where?.userId) {
            comics = comics.filter(comic => comic.userId === query.where.userId);
          }
          
          // Apply status filter if provided
          if (query.where?.status) {
            comics = comics.filter(comic => comic.status === query.where.status);
          }
          
          return Promise.resolve(comics.length);
        }),
      },
      panel: {
        create: jest.fn().mockResolvedValue({
          id: 'test-panel-id',
          comicId: 'test-comic-id',
          panelNumber: 1,
          imageUrl: null,
          dialog: '',
          position: {},
          characters: [],
          sceneDescription: 'Test scene',
          midjourneyPrompt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({}),
      },
      template: {
        create: jest.fn().mockImplementation((data) => 
          Promise.resolve({
            id: 'ctest123456789012345678',
            name: data.data.name,
            layoutConfig: data.data.layoutConfig,
            thumbnailUrl: data.data.thumbnailUrl,
            panelCount: data.data.panelCount,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        ),
        findUnique: jest.fn().mockImplementation((query) => {
          // Return null for invalid template IDs
          if (query.where.id === 'invalid-template-id') {
            return Promise.resolve(null);
          }
          return Promise.resolve({
            id: query.where.id || 'ctest123456789012345678',
            name: 'Test Template',
            layoutConfig: { rows: 2, columns: 2, panels: [] },
            thumbnailUrl: 'https://example.com/thumb.jpg',
            panelCount: 4,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({}),
      },
      generationJob: {
        create: jest.fn().mockResolvedValue({
          id: 'test-job-id',
          comicId: 'test-comic-id',
          jobType: 'SCRIPT',
          status: 'PENDING',
          aiService: 'openai',
          progress: 0,
          result: null,
          error: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({}),
      },
    })),
  };
});

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(() => {
  // Clear test data before each test
  deletedItems.clear();
  createdUsers.clear();
  createdComics.length = 0;
});

beforeEach(async () => {
  // Clean up data before each test in correct order (foreign key constraints)
  await prisma.generationJob.deleteMany();
  await prisma.panel.deleteMany();
  await prisma.comics.deleteMany();
  await prisma.user.deleteMany();
  await prisma.template.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Mock external services
jest.mock('@/services/ai/openai', () => ({
  OpenAIService: jest.fn().mockImplementation(() => ({
    generateScript: jest.fn().mockResolvedValue({
      title: 'Test Comic',
      panels: [
        {
          panelNumber: 1,
          sceneDescription: 'Test scene',
          dialog: 'Test dialog',
          characters: ['Character1'],
          midjourneyPrompt: 'Test prompt',
        },
      ],
    }),
    enhanceMidjourneyPrompt: jest.fn().mockResolvedValue('Enhanced prompt'),
  })),
}));

jest.mock('@/services/ai/midjourney', () => ({
  MidjourneyService: jest.fn().mockImplementation(() => ({
    generateImage: jest.fn().mockResolvedValue({
      id: 'test-job-id',
      status: 'completed',
      imageUrl: 'https://example.com/image.jpg',
      progress: 100,
    }),
    getJobStatus: jest.fn().mockResolvedValue({
      id: 'test-job-id',
      status: 'completed',
      imageUrl: 'https://example.com/image.jpg',
      progress: 100,
    }),
  })),
}));

jest.mock('@/services/redis', () => ({
  redisClient: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
  },
  initializeRedis: jest.fn(),
}));

jest.mock('@/services/queue', () => ({
  addScriptGenerationJob: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
  addImageGenerationJob: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
  addComicAssemblyJob: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
}));

export { prisma };