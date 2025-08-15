import { Job } from 'bull';
import { prisma } from '../services/database';
import { logger } from '../utils/logger';
import { QueueJobData } from './types';
import { emitToUser } from '../services/socket';

export const processComicAssembly = async (job: Job<QueueJobData>) => {
  const { comicId, userId, options } = job.data;
  let jobRecord: any = null;
  
  try {
    logger.info('Starting comic assembly', { comicId, jobId: job.id });

    // Create job record (let Prisma generate the ID)
    jobRecord = await prisma.generationJob.create({
      data: {
        comicId,
        jobType: 'ASSEMBLY',
        status: 'PROCESSING',
        aiService: 'internal',
        progress: 0,
      },
    });

    job.progress(10);
    emitToUser(userId, 'generation-progress', {
      comicId,
      job: {
        id: jobRecord.id,
        jobType: 'assembly',
        status: 'processing',
        progress: 10,
      },
    });

    // Get comic with all panels
    const comic = await prisma.comics.findUnique({
      where: { id: comicId },
      include: {
        panels: {
          orderBy: { panelNumber: 'asc' },
        },
        template: true,
      },
    });

    if (!comic) {
      throw new Error('Comic not found');
    }

    job.progress(30);

    // Verify all panels have images
    const missingImages = comic.panels.filter(panel => !panel.imageUrl);
    if (missingImages.length > 0) {
      throw new Error(`Missing images for panels: ${missingImages.map(p => p.panelNumber).join(', ')}`);
    }

    job.progress(50);

    // For now, we'll just mark the comic as completed
    // In a full implementation, this would:
    // 1. Download all panel images
    // 2. Create a composite image using Canvas or similar
    // 3. Add speech bubbles and text
    // 4. Generate thumbnails
    // 5. Upload to storage service

    // Simulate assembly time
    await new Promise(resolve => setTimeout(resolve, 2000));

    job.progress(80);

    // Update comic status
    await prisma.comics.update({
      where: { id: comicId },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date(),
      },
    });

    job.progress(95);

    // Update job status
    await prisma.generationJob.update({
      where: { id: jobRecord.id },
      data: {
        status: 'COMPLETED',
        progress: 100,
        result: {
          status: 'completed',
          panelCount: comic.panels.length,
          assemblyTime: new Date().toISOString(),
        },
      },
    });

    job.progress(100);

    // Emit completion
    emitToUser(userId, 'generation-complete', {
      comicId,
    });

    logger.info('Comic assembly completed', { comicId, jobId: job.id });

    return {
      success: true,
      comicId,
      status: 'completed',
      panelCount: comic.panels.length,
    };

  } catch (error) {
    logger.error('Comic assembly failed', { comicId, jobId: job.id, error });

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