export interface User {
  id: string;
  email: string;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  createdAt: string;
}

export interface Comic {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  status: 'generating' | 'completed' | 'failed';
  panels: Panel[];
  templateId: string;
  metadata: ComicMetadata;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ComicGenerationRequest {
  prompt: string;
  genre: string;
  style: string;
  panelCount: number;
  templateId: string;
  characterReferences?: File[];
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