import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Comic } from '../types';
import { comicsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const [comics, setComics] = useState<Comic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchComics();
  }, [filter]);

  const fetchComics = async () => {
    try {
      setIsLoading(true);
      const response = await comicsAPI.getUserComics();
      setComics(response.data.comics);
    } catch (error) {
      toast.error('Failed to load comics');
      console.error('Fetch comics error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComic = async (comicId: string) => {
    if (!window.confirm('Are you sure you want to delete this comic?')) {
      return;
    }

    try {
      await comicsAPI.deleteComic(comicId);
      setComics(comics.filter(comic => comic.id !== comicId));
      toast.success('Comic deleted successfully');
    } catch (error) {
      toast.error('Failed to delete comic');
      console.error('Delete comic error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredComics = comics.filter(comic => {
    if (filter === 'all') return true;
    return comic.status.toLowerCase() === filter;
  });

  if (isLoading) {
    return <LoadingSpinner text="Loading your comics..." />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Comics</h1>
          <p className="text-gray-600 mt-2">
            Manage and view all your AI-generated comic strips
          </p>
        </div>
        <Link
          to="/generate"
          className="btn btn-primary"
        >
          Create New Comic
        </Link>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        {[
          { key: 'all', label: 'All Comics' },
          { key: 'completed', label: 'Completed' },
          { key: 'generating', label: 'Generating' },
          { key: 'failed', label: 'Failed' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Comics Grid */}
      {filteredComics.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No comics yet' : `No ${filter} comics`}
          </h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? 'Start creating your first AI-generated comic strip!'
              : `You don't have any ${filter} comics yet.`
            }
          </p>
          {filter === 'all' && (
            <Link to="/generate" className="btn btn-primary">
              Create Your First Comic
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComics.map((comic) => (
            <div key={comic.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Comic Preview */}
              <div className="aspect-video bg-gray-100 relative">
                {comic.panels?.[0]?.imageUrl ? (
                  <img
                    src={comic.panels[0].imageUrl}
                    alt={comic.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(comic.status)}`}>
                    {comic.status}
                  </span>
                </div>
              </div>

              {/* Comic Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                  {comic.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {comic.prompt}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{comic.panels?.length || 0} panels</span>
                  <span>{new Date(comic.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    to={`/comics/${comic.id}`}
                    className="flex-1 btn btn-primary text-sm"
                  >
                    View
                  </Link>
                  {comic.status === 'completed' && (
                    <Link
                      to={`/comics/${comic.id}/edit`}
                      className="flex-1 btn btn-outline text-sm"
                    >
                      Edit
                    </Link>
                  )}
                  <button
                    onClick={() => handleDeleteComic(comic.id)}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;