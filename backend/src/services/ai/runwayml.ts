import axios, { AxiosInstance } from 'axios';
import { config } from '@/utils/config';
import { AIServiceError } from '@/utils/errors';
import { logger } from '@/utils/logger';

interface RunwayMLJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  type: 'style_transfer' | 'inpaint' | 'pose_variation';
  inputImage: string;
  outputImage?: string;
  progress: number;
  error?: string;
}

export class RunwayMLService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.ai.runwayml.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.ai.runwayml.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
  }

  async styleTransfer(inputImageUrl: string, styleReference: string): Promise<RunwayMLJob> {
    try {
      const response = await this.client.post('/inference/stable-diffusion', {
        prompt: `Apply comic book art style: ${styleReference}`,
        init_image: inputImageUrl,
        strength: 0.7,
        guidance_scale: 7.5,
        num_inference_steps: 50,
        width: 512,
        height: 512,
      });

      const job: RunwayMLJob = {
        id: response.data.id,
        status: 'pending',
        type: 'style_transfer',
        inputImage: inputImageUrl,
        progress: 0,
      };

      logger.info('RunwayML style transfer started', { 
        jobId: job.id, 
        inputImage: inputImageUrl,
        style: styleReference 
      });
      
      return job;
    } catch (error) {
      logger.error('RunwayML style transfer failed', error);
      if (axios.isAxiosError(error)) {
        throw new AIServiceError(
          `RunwayML API error: ${error.response?.data?.message || error.message}`,
          'RunwayML'
        );
      }
      throw new AIServiceError(`Style transfer failed: ${(error as Error).message}`, 'RunwayML');
    }
  }

  async inpaintImage(
    inputImageUrl: string, 
    maskImageUrl: string, 
    prompt: string
  ): Promise<RunwayMLJob> {
    try {
      const response = await this.client.post('/inference/inpainting', {
        image: inputImageUrl,
        mask: maskImageUrl,
        prompt,
        num_inference_steps: 50,
        guidance_scale: 7.5,
        width: 512,
        height: 512,
      });

      const job: RunwayMLJob = {
        id: response.data.id,
        status: 'pending',
        type: 'inpaint',
        inputImage: inputImageUrl,
        progress: 0,
      };

      logger.info('RunwayML inpainting started', { 
        jobId: job.id, 
        inputImage: inputImageUrl,
        mask: maskImageUrl,
        prompt 
      });
      
      return job;
    } catch (error) {
      logger.error('RunwayML inpainting failed', error);
      throw new AIServiceError(`Image inpainting failed: ${(error as Error).message}`, 'RunwayML');
    }
  }

  async generatePoseVariation(
    inputImageUrl: string, 
    targetPose: string
  ): Promise<RunwayMLJob> {
    try {
      const response = await this.client.post('/inference/controlnet', {
        image: inputImageUrl,
        prompt: `Character in ${targetPose} pose, comic book art style`,
        controlnet_type: 'openpose',
        num_inference_steps: 50,
        guidance_scale: 7.5,
        width: 512,
        height: 512,
      });

      const job: RunwayMLJob = {
        id: response.data.id,
        status: 'pending',
        type: 'pose_variation',
        inputImage: inputImageUrl,
        progress: 0,
      };

      logger.info('RunwayML pose variation started', { 
        jobId: job.id, 
        inputImage: inputImageUrl,
        targetPose 
      });
      
      return job;
    } catch (error) {
      logger.error('RunwayML pose variation failed', error);
      throw new AIServiceError(`Pose variation failed: ${(error as Error).message}`, 'RunwayML');
    }
  }

  async getJobStatus(jobId: string): Promise<RunwayMLJob> {
    try {
      const response = await this.client.get(`/tasks/${jobId}`);
      const data = response.data;

      const job: RunwayMLJob = {
        id: data.id,
        status: this.mapStatus(data.status),
        type: data.type || 'style_transfer',
        inputImage: data.input_image || '',
        progress: data.progress || 0,
        outputImage: data.output?.[0]?.url,
        error: data.error,
      };

      return job;
    } catch (error) {
      logger.error('Failed to get RunwayML job status', { jobId, error });
      throw new AIServiceError(`Status check failed: ${(error as Error).message}`, 'RunwayML');
    }
  }

  private mapStatus(runwayStatus: string): RunwayMLJob['status'] {
    switch (runwayStatus.toLowerCase()) {
      case 'pending':
      case 'queued':
        return 'pending';
      case 'processing':
      case 'running':
        return 'processing';
      case 'succeeded':
      case 'completed':
        return 'completed';
      case 'failed':
      case 'error':
        return 'failed';
      default:
        return 'pending';
    }
  }

  // Mock implementations for development/testing
  async mockStyleTransfer(inputImageUrl: string, styleReference: string): Promise<RunwayMLJob> {
    const jobId = `mock_runway_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('Mock RunwayML style transfer', { jobId, inputImageUrl, styleReference });
    
    return {
      id: jobId,
      status: 'processing',
      type: 'style_transfer',
      inputImage: inputImageUrl,
      progress: 0,
      outputImage: 'https://via.placeholder.com/512x512?text=Mock+Style+Transfer',
    };
  }

  async mockGetJobStatus(jobId: string): Promise<RunwayMLJob> {
    return {
      id: jobId,
      status: 'completed',
      type: 'style_transfer',
      inputImage: 'mock_input.jpg',
      progress: 100,
      outputImage: 'https://via.placeholder.com/512x512?text=Mock+Style+Transfer',
    };
  }
}