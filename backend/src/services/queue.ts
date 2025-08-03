import Bull, { Queue, Job } from 'bull';
import { redisClient } from './services/redis';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { QueueJobData } from './types';

// Queue definitions
export let scriptGenerationQueue: Queue<QueueJobData>;
export let imageGenerationQueue: Queue<QueueJobData>;
export let comicAssemblyQueue: Queue<QueueJobData>;

export const initializeQueues = async () => {
  try {
    // Initialize queues
    scriptGenerationQueue = new Bull('script-generation', config.redis.url, {
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    imageGenerationQueue = new Bull('image-generation', config.redis.url, {
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });

    comicAssemblyQueue = new Bull('comic-assembly', config.redis.url, {
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 50,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    });

    // Set up queue processors
    await setupQueueProcessors();

    // Set up queue event listeners
    setupQueueEventListeners();

    logger.info('Queues initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize queues', error);
    throw error;
  }
};

const setupQueueProcessors = async () => {
  const { processScriptGeneration } = await import('../workers/scriptWorker');
  const { processImageGeneration } = await import('../workers/imageWorker');
  const { processComicAssembly } = await import('../workers/assemblyWorker');

  // Process script generation jobs
  scriptGenerationQueue.process('generate-script', 5, processScriptGeneration);

  // Process image generation jobs
  imageGenerationQueue.process('generate-image', 3, processImageGeneration);

  // Process comic assembly jobs
  comicAssemblyQueue.process('assemble-comic', 2, processComicAssembly);
};

const setupQueueEventListeners = () => {
  // Script generation queue events
  scriptGenerationQueue.on('completed', (job: Job, result: any) => {
    logger.info('Script generation completed', { jobId: job.id, comicId: job.data.comicId });
  });

  scriptGenerationQueue.on('failed', (job: Job, err: Error) => {
    logger.error('Script generation failed', { 
      jobId: job.id, 
      comicId: job.data.comicId, 
      error: err.message 
    });
  });

  // Image generation queue events
  imageGenerationQueue.on('completed', (job: Job, result: any) => {
    logger.info('Image generation completed', { jobId: job.id, comicId: job.data.comicId });
  });

  imageGenerationQueue.on('failed', (job: Job, err: Error) => {
    logger.error('Image generation failed', { 
      jobId: job.id, 
      comicId: job.data.comicId, 
      error: err.message 
    });
  });

  // Comic assembly queue events
  comicAssemblyQueue.on('completed', (job: Job, result: any) => {
    logger.info('Comic assembly completed', { jobId: job.id, comicId: job.data.comicId });
  });

  comicAssemblyQueue.on('failed', (job: Job, err: Error) => {
    logger.error('Comic assembly failed', { 
      jobId: job.id, 
      comicId: job.data.comicId, 
      error: err.message 
    });
  });
};

export const addScriptGenerationJob = async (data: QueueJobData): Promise<Job<QueueJobData>> => {
  return scriptGenerationQueue.add('generate-script', data, {
    priority: 10,
    delay: 0,
  });
};

export const addImageGenerationJob = async (data: QueueJobData): Promise<Job<QueueJobData>> => {
  return imageGenerationQueue.add('generate-image', data, {
    priority: 5,
    delay: 1000, // Small delay to ensure script is processed first
  });
};

export const addComicAssemblyJob = async (data: QueueJobData): Promise<Job<QueueJobData>> => {
  return comicAssemblyQueue.add('assemble-comic', data, {
    priority: 1,
    delay: 2000, // Delay to ensure images are generated first
  });
};

export const getQueueStats = async () => {
  const [
    scriptStats,
    imageStats,
    assemblyStats,
  ] = await Promise.all([
    scriptGenerationQueue.getJobCounts(),
    imageGenerationQueue.getJobCounts(),
    comicAssemblyQueue.getJobCounts(),
  ]);

  return {
    scriptGeneration: scriptStats,
    imageGeneration: imageStats,
    comicAssembly: assemblyStats,
  };
};