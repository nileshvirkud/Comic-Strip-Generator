import axios, { AxiosResponse } from 'axios';
import { 
  User, 
  Comic, 
  ComicGenerationRequest, 
  Template, 
  GenerationJob,
  ExportOptions 
} from '@/types';

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
    api.post('/users/register', { email, password }),
  
  login: (email: string, password: string): Promise<AxiosResponse<{ user: User; token: string }>> =>
    api.post('/users/login', { email, password }),
  
  profile: (): Promise<AxiosResponse<User>> =>
    api.get('/users/profile'),
};

// Comics API
export const comicsAPI = {
  generate: (request: ComicGenerationRequest): Promise<AxiosResponse<{ comic: Comic; jobId: string }>> =>
    api.post('/comics/generate', request, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  getComic: (id: string): Promise<AxiosResponse<Comic>> =>
    api.get(`/comics/${id}`),
  
  updateComic: (id: string, updates: Partial<Comic>): Promise<AxiosResponse<Comic>> =>
    api.put(`/comics/${id}`, updates),
  
  deleteComic: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/comics/${id}`),
  
  exportComic: (id: string, options: ExportOptions): Promise<AxiosResponse<Blob>> =>
    api.post(`/comics/${id}/export`, options, {
      responseType: 'blob',
    }),
  
  getStatus: (id: string): Promise<AxiosResponse<{ status: string; progress: number; jobs: GenerationJob[] }>> =>
    api.get(`/comics/${id}/status`),
  
  getUserComics: (): Promise<AxiosResponse<Comic[]>> =>
    api.get('/comics'),
};

// Templates API
export const templatesAPI = {
  getTemplates: (): Promise<AxiosResponse<Template[]>> =>
    api.get('/templates'),
  
  getTemplate: (id: string): Promise<AxiosResponse<Template>> =>
    api.get(`/templates/${id}`),
};

export default api;