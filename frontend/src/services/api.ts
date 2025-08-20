import axios, { AxiosResponse } from 'axios';
import { 
  User, 
  Comic, 
  ComicGenerationRequest, 
  Template, 
  GenerationJob,
  ExportOptions 
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (email: string, password: string): Promise<AxiosResponse<{ user: User; token: string }>> =>
    api.post('/auth/register', { email, password }),
  
  login: (email: string, password: string): Promise<AxiosResponse<{ user: User; token: string }>> =>
    api.post('/auth/login', { email, password }),
  
  profile: (): Promise<AxiosResponse<User>> =>
    api.get('/users/profile'),
};

// Comics API
export const comicsAPI = {
  generate: (request: ComicGenerationRequest): Promise<AxiosResponse<{ success: boolean; data: { comic: Comic; jobId: string } }>> => {
    const formData = new FormData();
    formData.append('prompt', request.prompt);
    formData.append('genre', request.genre);
    formData.append('style', request.style);
    formData.append('panelCount', request.panelCount.toString());
    formData.append('templateId', request.templateId);
    
    // Add character references if provided
    if (request.characterReferences) {
      request.characterReferences.forEach((file, index) => {
        formData.append('characterReferences', file);
      });
    }
    
    return api.post('/comics/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getComic: (id: string): Promise<AxiosResponse<{ success: boolean; data: Comic }>> =>
    api.get(`/comics/${id}`),
  
  updateComic: (id: string, updates: Partial<Comic>): Promise<AxiosResponse<{ success: boolean; data: Comic }>> =>
    api.put(`/comics/${id}`, updates),
  
  deleteComic: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/comics/${id}`),
  
  exportComic: (id: string, options: ExportOptions): Promise<AxiosResponse<Blob>> =>
    api.post(`/comics/${id}/export`, options, {
      responseType: 'blob',
    }),
  
  getStatus: (id: string): Promise<AxiosResponse<{ success: boolean; data: { status: string; progress: number; jobs: GenerationJob[] } }>> =>
    api.get(`/comics/${id}/status`),
  
  getUserComics: (): Promise<AxiosResponse<{ success: boolean; data: { comics: Comic[]; pagination: any } }>> =>
    api.get('/comics'),
};

// Templates API
export const templatesAPI = {
  getTemplates: (): Promise<AxiosResponse<{ success: boolean; data: Template[] }>> =>
    api.get('/templates'),
  
  getTemplate: (id: string): Promise<AxiosResponse<{ success: boolean; data: Template }>> =>
    api.get(`/templates/${id}`),
};

export default api;