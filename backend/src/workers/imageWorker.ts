import { Job } from 'bull';
import { prisma } from '../services/database';
import { midjourneyService, openaiService } from '../services/ai';
import { logger } from '../utils/logger';
import { QueueJobData } from './types';
import { addComicAssemblyJob } from '../services/queue';
import { emitToUser } from '../services/socket';

export const processImageGeneration = async (job: Job<QueueJobData>) => {
  const { comicId, userId, panelData, options } = job.data;
  
  try {
    logger.info('Starting image generation', { 
      comicId, 
      jobId: job.id, 
      panelId: panelData?.panelId 
    });

    // Create job record
    const jobRecord = await prisma.generationJob.create({
      data: {
        id: job.id.toString(),
        comicId,
        jobType: 'IMAGE',
        status: 'PROCESSING',
        aiService: 'midjourney',
        progress: 0,
      },
    });

    job.progress(10);
    emitToUser(userId, 'generation-progress', {
      comicId,
      job: {
        id: job.id.toString(),
        jobType: 'image',
        status: 'processing',
        progress: 10,
      },
    });

    if (!panelData?.panelId) {
      throw new Error('Panel ID is required for image generation');
    }

    // Get panel details
    const panel = await prisma.panel.findUnique({
      where: { id: panelData.panelId },
    });

    if (!panel) {
      throw new Error('Panel not found');
    }

    job.progress(20);

    // Enhance Midjourney prompt with OpenAI
    let enhancedPrompt = panel.midjourneyPrompt || panel.sceneDescription;
    
    if (options?.style) {
      enhancedPrompt = await openaiService.enhanceMidjourneyPrompt(
        enhancedPrompt,
        options.style
      );
    }

    job.progress(40);

    // Generate image with Midjourney
    let midjourneyJob;
    try {
      // Try real generation first
      midjourneyJob = await midjourneyService.generateImage(enhancedPrompt, '16:9');
      logger.info('Using real Midjourney API for image generation');
    } catch (error) {
      // Fall back to mock if real API fails
      logger.warn('Real Midjourney API failed, using mock', { error: (error as Error).message });
      midjourneyJob = await midjourneyService.mockGenerateImage(enhancedPrompt);
    }

    job.progress(60);

    // Poll for completion (in production, this would be handled by webhooks)
    let imageResult = midjourneyJob;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10-second intervals

    while (imageResult.status === 'processing' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      try {
        imageResult = await midjourneyService.getJobStatus(midjourneyJob.id);
      } catch (error) {
        // Fall back to mock status if real API fails
        imageResult = await midjourneyService.mockGetJobStatus(midjourneyJob.id);
      }
      
      attempts++;
      const progressIncrement = Math.min(30, (attempts / maxAttempts) * 30);
      job.progress(60 + progressIncrement);

      emitToUser(userId, 'generation-progress', {
        comicId,
        job: {
          id: job.id.toString(),
          jobType: 'image',
          status: 'processing',
          progress: 60 + progressIncrement,
        },
      });
    }

    if (imageResult.status !== 'completed') {
      throw new Error(`Image generation failed: ${imageResult.error || 'Timeout'}`);
    }

    // Update panel with generated image
    await prisma.panel.update({
      where: { id: panelData.panelId },
      data: {
        imageUrl: imageResult.imageUrl,
      },
    });

    job.progress(95);

    // Update job status
    await prisma.generationJob.update({
      where: { id: job.id.toString() },
      data: {
        status: 'COMPLETED',
        progress: 100,
        result: { imageUrl: imageResult.imageUrl },
      },
    });

    job.progress(100);

    emitToUser(userId, 'generation-progress', {
      comicId,
      job: {
        id: job.id.toString(),
        jobType: 'image',
        status: 'completed',
        progress: 100,
      },
    });

    // Check if all panels have images generated
    const allPanels = await prisma.panel.findMany({
      where: { comicId },
    });

    const completedPanels = allPanels.filter(p => p.imageUrl);

    if (completedPanels.length === allPanels.length) {
      // All images generated, start comic assembly
      await addComicAssemblyJob({
        comicId,
        userId,
        jobType: 'assembly',
        options,
      });
    }

    logger.info('Image generation completed', { 
      comicId, 
      jobId: job.id, 
      panelId: panelData.panelId 
    });

    return { 
      success: true, 
      imageUrl: imageResult.imageUrl,
      panelId: panelData.panelId 
    };

  } catch (error) {
    logger.error('Image generation failed', { 
      comicId, 
      jobId: job.id, 
      panelId: panelData?.panelId, 
      error 
    });

    // Update job status
    await prisma.generationJob.update({
      where: { id: job.id.toString() },
      data: {
        status: 'FAILED',
        error: (error as Error).message,
      },
    });

    // Emit error
    emitToUser(userId, 'generation-error', {
      comicId,
      error: (error as Error).message,
    });

    throw error;
  }
};