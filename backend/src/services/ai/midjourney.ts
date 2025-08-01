import axios, { AxiosInstance } from 'axios';
import { config } from '@/utils/config';
import { AIServiceError } from '@/utils/errors';
import { logger } from '@/utils/logger';

interface MidjourneyJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  imageUrl?: string;
  progress: number;
  error?: string;
}

export class MidjourneyService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.ai.midjourney.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.ai.midjourney.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async generateImage(prompt: string, aspectRatio: string = '16:9'): Promise<MidjourneyJob> {
    try {
      const enhancedPrompt = `${prompt} --ar ${aspectRatio} --style raw --v 6`;
      
      const response = await this.client.post('/imagine', {
        prompt: enhancedPrompt,
        webhook_url: `${process.env.API_BASE_URL}/webhooks/midjourney`,
      });

      const job: MidjourneyJob = {
        id: response.data.id,
        status: 'pending',
        prompt: enhancedPrompt,
        progress: 0,
      };

      logger.info('Midjourney image generation started', { jobId: job.id, prompt });
      return job;
    } catch (error) {
      logger.error('Midjourney image generation failed', error);
      if (axios.isAxiosError(error)) {
        throw new AIServiceError(
          `Midjourney API error: ${error.response?.data?.message || error.message}`,
          'Midjourney'
        );
      }
      throw new AIServiceError(`Image generation failed: ${(error as Error).message}`, 'Midjourney');
    }
  }

  async getJobStatus(jobId: string): Promise<MidjourneyJob> {
    try {
      const response = await this.client.get(`/jobs/${jobId}`);
      const data = response.data;

      const job: MidjourneyJob = {
        id: data.id,
        status: this.mapStatus(data.status),
        prompt: data.prompt,
        progress: data.progress || 0,
        imageUrl: data.image_url,
        error: data.error,
      };

      return job;
    } catch (error) {
      logger.error('Failed to get Midjourney job status', { jobId, error });
      if (axios.isAxiosError(error)) {
        throw new AIServiceError(
          `Midjourney status check failed: ${error.response?.data?.message || error.message}`,
          'Midjourney'
        );
      }
      throw new AIServiceError(`Status check failed: ${(error as Error).message}`, 'Midjourney');
    }
  }

  async upscaleImage(jobId: string, index: number = 1): Promise<MidjourneyJob> {
    try {
      const response = await this.client.post(`/jobs/${jobId}/upscale`, {
        index,
      });

      const job: MidjourneyJob = {
        id: response.data.id,
        status: 'pending',
        prompt: response.data.prompt,
        progress: 0,
      };

      logger.info('Midjourney image upscale started', { originalJobId: jobId, newJobId: job.id });
      return job;
    } catch (error) {
      logger.error('Midjourney image upscale failed', { jobId, error });
      throw new AIServiceError(`Image upscale failed: ${(error as Error).message}`, 'Midjourney');
    }
  }

  async generateVariations(jobId: string, index: number = 1): Promise<MidjourneyJob> {
    try {
      const response = await this.client.post(`/jobs/${jobId}/variation`, {
        index,
      });

      const job: MidjourneyJob = {
        id: response.data.id,
        status: 'pending',
        prompt: response.data.prompt,
        progress: 0,
      };

      logger.info('Midjourney image variation started', { originalJobId: jobId, newJobId: job.id });
      return job;
    } catch (error) {
      logger.error('Midjourney image variation failed', { jobId, error });
      throw new AIServiceError(`Image variation failed: ${(error as Error).message}`, 'Midjourney');
    }
  }

  private mapStatus(midjourneyStatus: string): MidjourneyJob['status'] {
    switch (midjourneyStatus.toLowerCase()) {
      case 'pending':
      case 'queued':
        return 'pending';
      case 'processing':
      case 'running':
        return 'processing';
      case 'completed':
      case 'success':
        return 'completed';
      case 'failed':
      case 'error':
        return 'failed';
      default:
        return 'pending';
    }
  }

  // Mock implementation for development/testing when API key is not available
  async mockGenerateImage(prompt: string): Promise<MidjourneyJob> {
    const jobId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('Mock Midjourney image generation', { jobId, prompt });
    
    // Simulate processing time
    setTimeout(async () => {
      // In a real implementation, this would be handled by webhooks
      logger.info('Mock Midjourney job completed', { jobId });
    }, 5000);

    return {
      id: jobId,
      status: 'processing',
      prompt,
      progress: 0,
      imageUrl: 'https://via.placeholder.com/512x288?text=Mock+Comic+Panel',
    };
  }

  async mockGetJobStatus(jobId: string): Promise<MidjourneyJob> {
    // Simulate completed job
    return {
      id: jobId,
      status: 'completed',
      prompt: 'Mock prompt',
      progress: 100,
      imageUrl: 'https://via.placeholder.com/512x288?text=Mock+Comic+Panel',
    };
  }
}