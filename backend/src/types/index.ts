import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface Comic {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  status: 'generating' | 'completed' | 'failed';
  templateId: string;
  metadata: ComicMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface Panel {
  id: string;
  comicId: string;
  panelNumber: number;
  imageUrl?: string;
  dialog: string;
  position: PanelPosition;
  characters: string[];
  sceneDescription: string;
  midjourneyPrompt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PanelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ComicMetadata {
  genre: string;
  characterCount: number;
  style: string;
  layout: string;
  colorScheme: string;
}

export interface Template {
  id: string;
  name: string;
  layoutConfig: LayoutConfig;
  thumbnailUrl: string;
  panelCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LayoutConfig {
  rows: number;
  columns: number;
  panels: PanelConfig[];
}

export interface PanelConfig {
  id: string;
  position: PanelPosition;
}

export interface GenerationJob {
  id: string;
  comicId: string;
  jobType: 'script' | 'image' | 'assembly';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  aiService: 'openai' | 'midjourney' | 'runwayml';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    subscriptionTier: string;
  };
}

export interface ComicGenerationRequest {
  prompt: string;
  genre: string;
  style: string;
  panelCount: number;
  templateId: string;
  characterReferences?: Express.Multer.File[];
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpeg' | 'svg';
  resolution: 'low' | 'medium' | 'high' | 'print';
  paperSize: 'letter' | 'a4' | 'custom';
  customSize?: {
    width: number;
    height: number;
  };
}

export interface AIServiceConfig {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  midjourney: {
    apiKey: string;
    baseUrl: string;
  };
  runwayml: {
    apiKey: string;
    baseUrl: string;
  };
}

export interface QueueJobData {
  comicId: string;
  userId: string;
  jobType: string;
  prompt?: string;
  panelData?: any;
  options?: any;
}

export interface SocketUser {
  id: string;
  socketId: string;
  subscribedComics: string[];
}