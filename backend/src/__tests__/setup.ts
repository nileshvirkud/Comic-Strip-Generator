import { PrismaClient } from '@prisma/client';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/comic_strip_generator_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock Prisma Client to avoid database connection issues in CI
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      user: {
        create: jest.fn().mockImplementation((data) => 
          Promise.resolve({
            id: 'test-user-id',
            email: data.data.email,
            passwordHash: data.data.passwordHash,
            subscriptionTier: data.data.subscriptionTier || 'free',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        ),
        findUnique: jest.fn().mockResolvedValue(null), // Default to null to allow registration
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({}),
      },
      comics: {
        create: jest.fn().mockImplementation((data) => 
          Promise.resolve({
            id: 'test-comic-id',
            ...data.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        ),
        createMany: jest.fn().mockImplementation((data) => 
          Promise.resolve({
            count: data.data.length
          })
        ),
        findUnique: jest.fn().mockImplementation((query) => {
          if (query.where.id === 'non-existent-id' || deletedItems.has(query.where.id)) {
            return Promise.resolve(null);
          }
          // Simulate different ownership scenarios
          const userId = query.where.id === 'other-user-comic' ? 'other-user-id' : 'test-user-id';
          return Promise.resolve({
            id: query.where.id || 'test-comic-id',
            userId: userId,
            title: 'Test Comic',
            prompt: 'Test prompt',
            status: 'COMPLETED',
            templateId: 'test-template-id',
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        delete: jest.fn().mockImplementation((query) => {
          deletedItems.add(query.where.id);
          return Promise.resolve({
            id: query.where.id,
            userId: 'test-user-id',
            title: 'Test Comic',
            prompt: 'Test prompt',
            status: 'COMPLETED',
            templateId: 'test-template-id',
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }),
        deleteMany: jest.fn().mockResolvedValue({}),
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
            id: 'test-template-id',
            name: data.data.name,
            layoutConfig: data.data.layoutConfig,
            thumbnailUrl: data.data.thumbnailUrl,
            panelCount: data.data.panelCount,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        ),
        findUnique: jest.fn().mockResolvedValue({
          id: 'test-template-id',
          name: 'Test Template',
          layoutConfig: { rows: 2, columns: 2 },
          thumbnailUrl: 'https://example.com/thumb.jpg',
          panelCount: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
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

// Track deleted items for mocking
const deletedItems = new Set();

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(() => {
  // Clear deleted items before each test
  deletedItems.clear();
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