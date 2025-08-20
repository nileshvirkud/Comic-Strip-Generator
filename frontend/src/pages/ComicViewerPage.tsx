import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Comic } from '../types';
import { comicsAPI } from '../services/api';
import { useComicGeneration } from '../hooks/useComicGeneration';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ComicViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [comic, setComic] = useState<Comic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { getComicStatus, progress, jobs, isGenerating } = useComicGeneration();

  useEffect(() => {
    if (id) {
      fetchComic(id);
    }
  }, [id]);

  useEffect(() => {
    if (comic && comic.status && comic.status.toLowerCase() === 'generating' && id) {
      // Poll for status updates
      const interval = setInterval(() => {
        getComicStatus(id);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [comic, id, getComicStatus]);

  const fetchComic = async (comicId: string) => {
    try {
      const response = await comicsAPI.getComic(comicId);
      const comic = response.data.data; // Extract from nested structure
      setComic(comic);
      
      // If still generating, get status
      if (comic.status && comic.status.toLowerCase() === 'generating') {
        await getComicStatus(comicId);
      }
    } catch (error: any) {
      console.error('Comic fetch error:', error);
      toast.error('Failed to load comic');
      if (error.response?.status === 404) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'png') => {
    if (!comic) return;
    
    try {
      const response = await comicsAPI.exportComic(comic.id, {
        format,
        resolution: 'high',
        paperSize: 'letter',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${comic.title}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Comic exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export comic');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading comic..." />;
  }

  if (!comic) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Comic not found</h2>
        <p className="text-gray-600 mb-4">The comic you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-primary"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{comic.title}</h1>
          <p className="text-gray-600 mt-2">
            Created on {new Date(comic.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
          >
            Back to Dashboard
          </button>
          {comic.status && comic.status.toLowerCase() === 'completed' && (
            <>
              <button
                onClick={() => handleExport('png')}
                className="btn btn-outline"
              >
                Export PNG
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="btn btn-outline"
              >
                Export PDF
              </button>
              <Link
                to={`/comics/${comic.id}/edit`}
                className="btn btn-primary"
              >
                Edit Comic
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {comic.status && comic.status.toLowerCase() !== 'completed' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                {comic.status && comic.status.toLowerCase() === 'generating' ? 'Generating Comic' : comic.status && comic.status.toLowerCase() === 'failed' ? 'Generation Failed' : 'Processing'}
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Your comic is being created by our AI systems. This usually takes 2-5 minutes.</p>
                {progress > 0 && (
                  <div className="mt-2">
                    <div className="bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="mt-1 text-xs">{progress}% complete</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job Status */}
          {jobs.length > 0 && (
            <div className="mt-4 space-y-2">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center text-sm">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    job.status === 'completed' ? 'bg-green-500' :
                    job.status === 'processing' ? 'bg-blue-500' :
                    job.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                  }`}></div>
                  <span className="capitalize text-blue-700">
                    {job.jobType} {job.status} ({job.progress}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comic Display */}
      {comic.status && comic.status.toLowerCase() === 'completed' && comic.panels ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div 
            className="relative bg-white"
            style={{
              width: '100%',
              paddingBottom: '70%', // 10:7 aspect ratio
              minHeight: '500px',
            }}
          >
            <div className="absolute inset-0 p-4">
              {comic.panels.map((panel) => (
                <div
                  key={panel.id}
                  className="comic-panel absolute"
                  style={{
                    left: `${panel.position.x}%`,
                    top: `${panel.position.y}%`,
                    width: `${panel.position.width}%`,
                    height: `${panel.position.height}%`,
                  }}
                >
                  {/* Panel Number */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">
                    {panel.panelNumber}
                  </div>

                  {/* Panel Image */}
                  <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden relative">
                    {panel.imageUrl ? (
                      <img
                        src={panel.imageUrl}
                        alt={`Panel ${panel.panelNumber}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center text-gray-500 ${panel.imageUrl ? 'hidden' : ''}`}>
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">{panel.imageUrl ? 'Image failed to load' : 'No image'}</span>
                      </div>
                    </div>

                    {/* Speech Bubble */}
                    {panel.dialog && (
                      <div className="absolute top-2 left-2 speech-bubble max-w-xs p-2 text-sm">
                        {panel.dialog}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : comic.status && comic.status.toLowerCase() === 'failed' ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generation Failed</h3>
          <p className="text-gray-600 mb-4">
            Something went wrong while creating your comic. Please try again.
          </p>
          <Link to="/generate" className="btn btn-primary">
            Create New Comic
          </Link>
        </div>
      ) : (
        <div className="text-center py-12">
          <LoadingSpinner text="AI is creating your comic..." />
        </div>
      )}

      {/* Comic Info */}
      {comic.status && comic.status.toLowerCase() === 'completed' && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Comic Details</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Story Prompt</h4>
              <p className="text-gray-600">{comic.prompt}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Settings</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Genre:</strong> {(comic.metadata as any)?.genre}</p>
                <p><strong>Style:</strong> {(comic.metadata as any)?.style}</p>
                <p><strong>Panels:</strong> {comic.panels?.length || 0}</p>
                <p><strong>Layout:</strong> {(comic.metadata as any)?.layout}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComicViewerPage;