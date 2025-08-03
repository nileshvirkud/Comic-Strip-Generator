import { Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { prisma } from './services/database';
import { AuthenticatedRequest, ComicGenerationRequest } from './types';
import { ValidationError, NotFoundError, AuthorizationError } from './utils/errors';
import { logger } from './utils/logger';
import { addScriptGenerationJob } from './services/queue';

export const generateComicValidation = [
  body('prompt')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Prompt must be between 10 and 1000 characters'),
  body('genre')
    .isIn(['superhero', 'adventure', 'comedy', 'horror', 'sci-fi', 'fantasy', 'slice-of-life'])
    .withMessage('Invalid genre'),
  body('style')
    .isIn(['classic', 'modern', 'manga', 'cartoon', 'realistic', 'minimalist'])
    .withMessage('Invalid style'),
  body('panelCount')
    .isInt({ min: 3, max: 8 })
    .withMessage('Panel count must be between 3 and 8'),
  body('templateId')
    .isUUID()
    .withMessage('Valid template ID is required'),
];

export const generateComic = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { prompt, genre, style, panelCount, templateId }: ComicGenerationRequest = req.body;

    logger.info('Starting comic generation', { userId, prompt: prompt.substring(0, 50) });

    // Verify template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new ValidationError('Template not found');
    }

    if (template.panelCount !== panelCount) {
      throw new ValidationError('Panel count does not match template');
    }

    // Create comic record
    const comic = await prisma.comics.create({
      data: {
        userId,
        title: 'Generating...', // Will be updated by script generation
        prompt,
        status: 'GENERATING',
        templateId,
        metadata: {
          genre,
          style,
          characterCount: 0, // Will be updated after script generation
          layout: template.name,
          colorScheme: 'default',
        },
      },
      include: {
        template: true,
      },
    });

    // Add script generation job to queue
    const job = await addScriptGenerationJob({
      comicId: comic.id,
      userId,
      prompt,
      jobType: 'script',
      options: { genre, style, panelCount },
    });

    logger.info('Comic generation job queued', { 
      comicId: comic.id, 
      jobId: job.id,
      userId 
    });

    res.status(201).json({
      success: true,
      message: 'Comic generation started',
      data: {
        comic: {
          id: comic.id,
          title: comic.title,
          status: comic.status,
          createdAt: comic.createdAt,
          template: comic.template,
        },
        jobId: job.id.toString(),
      },
    });

  } catch (error) {
    next(error);
  }
};

export const getComic = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const comic = await prisma.comics.findUnique({
      where: { id },
      include: {
        panels: {
          orderBy: { panelNumber: 'asc' },
        },
        template: true,
      },
    });

    if (!comic) {
      throw new NotFoundError('Comic not found');
    }

    if (comic.userId !== userId) {
      throw new AuthorizationError('Access denied');
    }

    res.json({
      success: true,
      data: comic,
    });

  } catch (error) {
    next(error);
  }
};

export const getUserComics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const where: any = { userId };
    if (status) {
      where.status = status.toUpperCase();
    }

    const [comics, total] = await Promise.all([
      prisma.comics.findMany({
        where,
        include: {
          template: true,
          _count: {
            select: { panels: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comics.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        comics,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error) {
    next(error);
  }
};

export const getComicStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const comic = await prisma.comics.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!comic) {
      throw new NotFoundError('Comic not found');
    }

    if (comic.userId !== userId) {
      throw new AuthorizationError('Access denied');
    }

    // Get all jobs for this comic
    const jobs = await prisma.generationJob.findMany({
      where: { comicId: id },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate overall progress
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(job => job.status === 'COMPLETED').length;
    const failedJobs = jobs.filter(job => job.status === 'FAILED').length;

    let overallProgress = 0;
    if (totalJobs > 0) {
      const jobProgress = jobs.reduce((sum, job) => sum + job.progress, 0);
      overallProgress = Math.round(jobProgress / totalJobs);
    }

    const status = failedJobs > 0 ? 'failed' : 
                  completedJobs === totalJobs && totalJobs > 0 ? 'completed' : 
                  'generating';

    res.json({
      success: true,
      data: {
        status,
        progress: overallProgress,
        jobs: jobs.map(job => ({
          id: job.id,
          jobType: job.jobType.toLowerCase(),
          status: job.status.toLowerCase(),
          aiService: job.aiService,
          progress: job.progress,
          error: job.error,
          createdAt: job.createdAt,
        })),
      },
    });

  } catch (error) {
    next(error);
  }
};

export const updateComic = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updates = req.body;

    // Verify ownership
    const comic = await prisma.comics.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!comic) {
      throw new NotFoundError('Comic not found');
    }

    if (comic.userId !== userId) {
      throw new AuthorizationError('Access denied');
    }

    // Filter allowed updates
    const allowedUpdates = ['title', 'metadata'];
    const filteredUpdates: any = {};
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const updatedComic = await prisma.comics.update({
      where: { id },
      data: {
        ...filteredUpdates,
        updatedAt: new Date(),
      },
      include: {
        panels: {
          orderBy: { panelNumber: 'asc' },
        },
        template: true,
      },
    });

    res.json({
      success: true,
      data: updatedComic,
    });

  } catch (error) {
    next(error);
  }
};

export const deleteComic = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify ownership
    const comic = await prisma.comics.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!comic) {
      throw new NotFoundError('Comic not found');
    }

    if (comic.userId !== userId) {
      throw new AuthorizationError('Access denied');
    }

    // Delete comic (cascade will handle panels and jobs)
    await prisma.comics.delete({
      where: { id },
    });

    logger.info('Comic deleted', { comicId: id, userId });

    res.json({
      success: true,
      message: 'Comic deleted successfully',
    });

  } catch (error) {
    next(error);
  }
};