import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database';
import { NotFoundError } from '../utils/errors';

export const getTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { panelCount: 'asc' },
    });

    res.json({
      success: true,
      data: templates,
    });

  } catch (error) {
    next(error);
  }
};

export const getTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    res.json({
      success: true,
      data: template,
    });

  } catch (error) {
    next(error);
  }
};