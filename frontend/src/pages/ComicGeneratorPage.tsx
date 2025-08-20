import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Template, ComicGenerationRequest } from '../types';
import { templatesAPI } from '../services/api';
import { useComicGeneration } from '../hooks/useComicGeneration';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

interface GeneratorForm {
  prompt: string;
  genre: string;
  style: string;
  templateId: string;
}

const ComicGeneratorPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  const { generateComic, isGenerating, comic, progress, error } = useComicGeneration();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GeneratorForm>();

  const templateId = watch('templateId');

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (templateId && Array.isArray(templates)) {
      const template = templates.find(t => t.id === templateId);
      setSelectedTemplate(template || null);
    }
  }, [templateId, templates]);

  useEffect(() => {
    if (comic && comic.status === 'completed') {
      navigate(`/comics/${comic.id}`);
    }
  }, [comic, navigate]);

  const fetchTemplates = async () => {
    try {
      const response = await templatesAPI.getTemplates();
      setTemplates(response.data.data || []); // Extract from nested structure with fallback
    } catch (error) {
      toast.error('Failed to load templates');
      console.error('Fetch templates error:', error);
      setTemplates([]); // Set empty array on error to prevent map error
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const onSubmit = async (data: GeneratorForm) => {
    try {
      if (!selectedTemplate) {
        toast.error('Please select a template');
        return;
      }
      
      const request: ComicGenerationRequest = {
        prompt: data.prompt,
        genre: data.genre,
        style: data.style,
        panelCount: selectedTemplate.panelCount,
        templateId: data.templateId,
      };

      await generateComic(request);
      toast.success('Comic generation started!');
    } catch (error) {
      toast.error('Failed to start comic generation');
    }
  };

  if (isLoadingTemplates) {
    return <LoadingSpinner text="Loading templates..." />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Create Your Comic Strip
        </h1>
        <p className="text-lg text-gray-600">
          Describe your story and let AI bring it to life
        </p>
      </div>

      {isGenerating ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Generating Your Comic
            </h3>
            <p className="text-gray-600 mb-4">
              AI is creating your story, characters, and artwork...
            </p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{progress}% complete</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Story Prompt */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Tell Your Story</h2>
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Story Prompt
              </label>
              <textarea
                {...register('prompt', {
                  required: 'Story prompt is required',
                  minLength: {
                    value: 10,
                    message: 'Prompt must be at least 10 characters',
                  },
                  maxLength: {
                    value: 1000,
                    message: 'Prompt must be less than 1000 characters',
                  },
                })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your comic story... For example: 'A superhero cat saves the city from an army of evil robots while learning the importance of teamwork.'"
              />
              {errors.prompt && (
                <p className="mt-1 text-sm text-red-600">{errors.prompt.message}</p>
              )}
            </div>
          </div>

          {/* Genre and Style */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Choose Style</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
                  Genre
                </label>
                <select
                  {...register('genre', { required: 'Genre is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a genre</option>
                  <option value="superhero">Superhero</option>
                  <option value="adventure">Adventure</option>
                  <option value="comedy">Comedy</option>
                  <option value="horror">Horror</option>
                  <option value="sci-fi">Sci-Fi</option>
                  <option value="fantasy">Fantasy</option>
                  <option value="slice-of-life">Slice of Life</option>
                </select>
                {errors.genre && (
                  <p className="mt-1 text-sm text-red-600">{errors.genre.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
                  Art Style
                </label>
                <select
                  {...register('style', { required: 'Art style is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select an art style</option>
                  <option value="classic">Classic Comic</option>
                  <option value="modern">Modern</option>
                  <option value="manga">Manga</option>
                  <option value="cartoon">Cartoon</option>
                  <option value="realistic">Realistic</option>
                  <option value="minimalist">Minimalist</option>
                </select>
                {errors.style && (
                  <p className="mt-1 text-sm text-red-600">{errors.style.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Choose Layout</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(templates) && templates.length > 0 ? (
                templates.map((template) => (
                  <label key={template.id} className="cursor-pointer group">
                    <input
                      {...register('templateId', { required: 'Template is required' })}
                      type="radio"
                      value={template.id}
                      className="sr-only"
                    />
                    <div className={`border-2 rounded-lg p-4 transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 group-hover:border-gray-300'
                    }`}>
                      <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">Preview</span>
                      </div>
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.panelCount} panels</p>
                    </div>
                  </label>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">No templates available</p>
                    <button
                      type="button"
                      onClick={fetchTemplates}
                      className="mt-2 text-primary-600 hover:text-primary-500 text-sm font-medium"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}
            </div>
            {errors.templateId && (
              <p className="mt-2 text-sm text-red-600">{errors.templateId.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isGenerating}
              className="btn btn-primary text-lg px-8 py-3"
            >
              Generate Comic Strip
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ComicGeneratorPage;