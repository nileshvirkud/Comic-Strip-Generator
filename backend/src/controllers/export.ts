import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../services/database';
import { ExportService } from '../services/export';
import { AuthenticatedRequest, ExportOptions } from './types';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { logger } from '../utils/logger';

export const exportComicValidation = [
  body('format')
    .isIn(['pdf', 'png', 'jpeg', 'svg'])
    .withMessage('Invalid export format'),
  body('resolution')
    .isIn(['low', 'medium', 'high', 'print'])
    .withMessage('Invalid resolution'),
  body('paperSize')
    .isIn(['letter', 'a4', 'custom'])
    .withMessage('Invalid paper size'),
];

export const exportComic = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const options: ExportOptions = req.body;

    logger.info('Starting comic export', { 
      comicId: id, 
      userId, 
      format: options.format,
      resolution: options.resolution 
    });

    // Get comic with all panels
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

    if (comic.status !== 'COMPLETED') {
      throw new Error('Comic is not ready for export');
    }

    // Validate that all panels have images
    const missingImages = comic.panels.filter(panel => !panel.imageUrl);
    if (missingImages.length > 0) {
      throw new Error(`Missing images for panels: ${missingImages.map(p => p.panelNumber).join(', ')}`);
    }

    // Export comic
    const exportService = new ExportService();
    const exportBuffer = await exportService.exportComic(comic as any, options);

    // Set response headers
    const filename = `${comic.title.replace(/[^a-zA-Z0-9]/g, '_')}.${options.format}`;
    const mimeTypes = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpeg: 'image/jpeg',
      svg: 'image/svg+xml',
    };

    res.setHeader('Content-Type', mimeTypes[options.format]);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', exportBuffer.length);

    logger.info('Comic export completed', { 
      comicId: id, 
      userId,
      format: options.format,
      size: exportBuffer.length 
    });

    res.send(exportBuffer);

  } catch (error) {
    logger.error('Comic export failed', { 
      comicId: req.params.id, 
      userId: req.user?.id, 
      error: (error as Error).message 
    });
    next(error);
  }
};