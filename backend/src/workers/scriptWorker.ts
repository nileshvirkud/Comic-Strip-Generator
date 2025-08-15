import { Job } from 'bull';
import { prisma } from '../services/database';
import { openaiService } from '../services/ai';
import { logger } from '../utils/logger';
import { QueueJobData } from './types';
import { addImageGenerationJob } from '../services/queue';
import { emitToUser } from '../services/socket';

export const processScriptGeneration = async (job: Job<QueueJobData>) => {
  const { comicId, userId, prompt, options } = job.data;
  let jobRecord: any = null;
  
  try {
    logger.info('Starting script generation', { comicId, jobId: job.id });

    // Create job status record (let Prisma generate the ID)
    jobRecord = await prisma.generationJob.create({
      data: {
        comicId,
        jobType: 'SCRIPT',
        status: 'PROCESSING',
        aiService: 'openai',
        progress: 0,
      },
    });

    // Update job progress
    job.progress(10);
    emitToUser(userId, 'generation-progress', {
      comicId,
      job: {
        id: jobRecord.id,
        jobType: 'script',
        status: 'processing',
        progress: 10,
      },
    });

    // Get comic details
    const comic = await prisma.comics.findUnique({
      where: { id: comicId },
      include: { template: true },
    });

    if (!comic) {
      throw new Error('Comic not found');
    }

    const metadata = comic.metadata as any;
    const { genre, style } = metadata;
    const panelCount = comic.template.panelCount;

    job.progress(30);

    // Generate script using OpenAI
    const scriptResult = await openaiService.generateScript(prompt!, genre, panelCount);

    job.progress(70);

    // Update comic with generated title
    await prisma.comics.update({
      where: { id: comicId },
      data: {
        title: scriptResult.title,
        status: 'GENERATING',
      },
    });

    // Create panels
    const panelPromises = scriptResult.panels.map(async (panelData, index) => {
      return prisma.panel.create({
        data: {
          comicId,
          panelNumber: panelData.panelNumber,
          dialog: panelData.dialog,
          sceneDescription: panelData.sceneDescription,
          characters: panelData.characters,
          midjourneyPrompt: panelData.midjourneyPrompt,
          position: comic.template.layoutConfig.panels[index]?.position || { x: 0, y: 0, width: 100, height: 100 },
        },
      });
    });

    await Promise.all(panelPromises);

    job.progress(90);

    // Update job status
    await prisma.generationJob.update({
      where: { id: jobRecord.id },
      data: {
        status: 'COMPLETED',
        progress: 100,
        result: scriptResult,
      },
    });

    job.progress(100);

    // Emit progress update
    emitToUser(userId, 'generation-progress', {
      comicId,
      job: {
        id: jobRecord.id,
        jobType: 'script',
        status: 'completed',
        progress: 100,
      },
    });

    // Start image generation for each panel
    const panels = await prisma.panel.findMany({
      where: { comicId },
      orderBy: { panelNumber: 'asc' },
    });

    for (const panel of panels) {
      await addImageGenerationJob({
        comicId,
        userId,
        jobType: 'image',
        panelData: {
          panelId: panel.id,
          midjourneyPrompt: panel.midjourneyPrompt,
          sceneDescription: panel.sceneDescription,
        },
        options: { style, ...options },
      });
    }

    logger.info('Script generation completed', { comicId, jobId: job.id });
    return { success: true, script: scriptResult };

  } catch (error) {
    logger.error('Script generation failed', { comicId, jobId: job.id, error });

    // Update job status if record was created
    if (jobRecord) {
      await prisma.generationJob.update({
        where: { id: jobRecord.id },
        data: {
          status: 'FAILED',
          error: (error as Error).message,
        },
      }).catch((updateError) => {
        logger.error('Failed to update job status', { jobId: jobRecord.id, updateError });
      });
    }

    // Update comic status
    await prisma.comics.update({
      where: { id: comicId },
      data: { status: 'FAILED' },
    });

    // Emit error
    emitToUser(userId, 'generation-error', {
      comicId,
      error: (error as Error).message,
    });

    throw error;
  }
};