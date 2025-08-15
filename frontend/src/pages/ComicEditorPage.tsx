import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Comic } from '../types';
import { comicsAPI } from '../services/api';
import ComicEditor from '../components/ComicEditor';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ComicEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [comic, setComic] = useState<Comic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchComic(id);
    }
  }, [id]);

  const fetchComic = async (comicId: string) => {
    try {
      const response = await comicsAPI.getComic(comicId);
      setComic(response.data.data); // Extract from nested structure
    } catch (error: any) {
      toast.error('Failed to load comic');
      if (error.response?.status === 404) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleComicUpdate = (updatedComic: Comic) => {
    setComic(updatedComic);
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading comic editor..." />;
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

  if (comic.status && comic.status.toLowerCase() !== 'completed') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Comic not ready for editing</h2>
        <p className="text-gray-600 mb-4">
          This comic is still {comic.status}. Please wait for generation to complete.
        </p>
        <button
          onClick={() => navigate(`/comics/${comic.id}`)}
          className="btn btn-primary"
        >
          View Comic Status
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
            Edit your comic layout, dialog, and styling
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate(`/comics/${comic.id}`)}
            className="btn btn-outline"
          >
            View Comic
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Comic Editor */}
      <ComicEditor comic={comic} onComicUpdate={handleComicUpdate} />
    </div>
  );
};

export default ComicEditorPage;