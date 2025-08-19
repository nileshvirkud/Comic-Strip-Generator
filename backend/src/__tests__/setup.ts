import { PrismaClient } from '@prisma/client';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/comic_strip_generator_dev';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret';
process.env.OPENAI_API_KEY = 'test-openai-key';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Clean up database before tests
  await prisma.$connect();
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