import { useState, useEffect, useCallback } from 'react';
import { Comic, ComicGenerationRequest, GenerationJob } from '../types';
import { comicsAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

interface UseComicGenerationReturn {
  comic: Comic | null;
  isGenerating: boolean;
  progress: number;
  jobs: GenerationJob[];
  error: string | null;
  generateComic: (request: ComicGenerationRequest) => Promise<void>;
  getComicStatus: (comicId: string) => Promise<void>;
}

export const useComicGeneration = (): UseComicGenerationReturn => {
  const [comic, setComic] = useState<Comic | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerationProgress = useCallback((data: { comicId: string; job: GenerationJob }) => {
    setJobs(prevJobs => {
      const existingJobIndex = prevJobs.findIndex(j => j.id === data.job.id);
      if (existingJobIndex >= 0) {
        const updatedJobs = [...prevJobs];
        updatedJobs[existingJobIndex] = data.job;
        return updatedJobs;
      }
      return [...prevJobs, data.job];
    });

    // Calculate overall progress
    const totalProgress = jobs.reduce((sum, job) => sum + job.progress, 0);
    const avgProgress = jobs.length > 0 ? totalProgress / jobs.length : 0;
    setProgress(avgProgress);

    toast.success(`${data.job.jobType} ${data.job.progress}% complete`);
  }, [jobs]);

  const handleGenerationComplete = useCallback(async (data: { comicId: string }) => {
    try {
      const response = await comicsAPI.getComic(data.comicId);
      setComic(response.data);
      setIsGenerating(false);
      setProgress(100);
      toast.success('Comic generation completed!');
    } catch (err) {
      setError('Failed to fetch completed comic');
      toast.error('Failed to fetch completed comic');
    }
  }, []);

  const handleGenerationError = useCallback((data: { comicId: string; error: string }) => {
    setError(data.error);
    setIsGenerating(false);
    toast.error(`Generation failed: ${data.error}`);
  }, []);

  useEffect(() => {
    socketService.on('generation-progress', handleGenerationProgress);
    socketService.on('generation-complete', handleGenerationComplete);
    socketService.on('generation-error', handleGenerationError);

    return () => {
      socketService.off('generation-progress', handleGenerationProgress);
      socketService.off('generation-complete', handleGenerationComplete);
      socketService.off('generation-error', handleGenerationError);
    };
  }, [handleGenerationProgress, handleGenerationComplete, handleGenerationError]);

  const generateComic = async (request: ComicGenerationRequest) => {
    try {
      setIsGenerating(true);
      setError(null);
      setProgress(0);
      setJobs([]);

      const response = await comicsAPI.generate(request);
      setComic(response.data.comic);
      
      // Subscribe to real-time updates
      socketService.subscribeToComic(response.data.comic.id);
      
      toast.success('Comic generation started!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start comic generation');
      setIsGenerating(false);
      toast.error('Failed to start comic generation');
    }
  };

  const getComicStatus = async (comicId: string) => {
    try {
      const response = await comicsAPI.getStatus(comicId);
      setProgress(response.data.progress);
      setJobs(response.data.jobs);
      
      if (response.data.status === 'completed') {
        setIsGenerating(false);
        const comicResponse = await comicsAPI.getComic(comicId);
        setComic(comicResponse.data);
      } else if (response.data.status === 'generating') {
        setIsGenerating(true);
        socketService.subscribeToComic(comicId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get comic status');
    }
  };

  return {
    comic,
    isGenerating,
    progress,
    jobs,
    error,
    generateComic,
    getComicStatus,
  };
};