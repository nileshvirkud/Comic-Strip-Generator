import { createClient } from 'redis';
import { config } from '@/utils/config';
import { logger } from '@/utils/logger';

export const redisClient = createClient({
  url: config.redis.url,
});

redisClient.on('error', (error) => {
  logger.error('Redis error', error);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

redisClient.on('disconnect', () => {
  logger.info('Disconnected from Redis');
});

export const initializeRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis', error);
    throw error;
  }
};

export const disconnectRedis = async () => {
  try {
    await redisClient.disconnect();
  } catch (error) {
    logger.error('Failed to disconnect from Redis', error);
  }
};