import dotenv from 'dotenv';
import path from 'path';
import { AIServiceConfig } from '../types';

// Load .env from project root - try multiple paths for development and production
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'REDIS_URL'
];

// Optional in development, required in production
const optionalInDevEnvVars = [
  'OPENAI_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
const missingOptionalVars = optionalInDevEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

if (missingOptionalVars.length > 0 && process.env.NODE_ENV !== 'development') {
  console.error(`Missing required environment variables for production: ${missingOptionalVars.join(', ')}`);
  process.exit(1);
}

if (missingOptionalVars.length > 0) {
  console.warn(`Warning: Missing optional environment variables (will use mock/fallback): ${missingOptionalVars.join(', ')}`);
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL!,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  redis: {
    url: process.env.REDIS_URL!,
  },
  
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3BucketName: process.env.S3_BUCKET_NAME,
  },
  
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || 'mock-key-for-development',
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10),
    },
    midjourney: {
      apiKey: process.env.MIDJOURNEY_API_KEY || '',
      baseUrl: process.env.MIDJOURNEY_BASE_URL || 'https://api.midjourney.com',
    },
    runwayml: {
      apiKey: process.env.RUNWAYML_API_KEY || '',
      baseUrl: process.env.RUNWAYML_BASE_URL || 'https://api.runwayml.com',
    },
  } as AIServiceConfig,
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ],
  },
  
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    credentials: true,
  },
};