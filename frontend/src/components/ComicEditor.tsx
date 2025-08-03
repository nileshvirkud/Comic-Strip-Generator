import React, { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Comic, Panel } from '../types';
import ComicPanel from './ComicPanel';
import { comicsAPI } from '../services/api';
import toast from 'react-hot-toast';

interface ComicEditorProps {
  comic: Comic;
  onComicUpdate: (updatedComic: Comic) => void;
}

const ComicEditor: React.FC<ComicEditorProps> = ({ comic, onComicUpdate }) => {
  const [panels, setPanels] = useState<Panel[]>(comic.panels || []);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdatePanel = useCallback(async (panelId: string, updates: Partial<Panel>) => {
    try {
      const updatedPanels = panels.map(panel =>
        panel.id === panelId ? { ...panel, ...updates } : panel
      );
      setPanels(updatedPanels);

      // Save to backend
      const updatedComic = await comicsAPI.updateComic(comic.id, {
        panels: updatedPanels,
      });
      
      onComicUpdate(updatedComic.data);
      toast.success('Panel updated successfully');
    } catch (error) {
      toast.error('Failed to update panel');
      console.error('Panel update error:', error);
    }
  }, [panels, comic.id, onComicUpdate]);

  const handleMovePanel = useCallback((dragIndex: number, hoverIndex: number) => {
    setPanels(prevPanels => {
      const newPanels = [...prevPanels];
      const dragPanel = newPanels[dragIndex];
      newPanels.splice(dragIndex, 1);
      newPanels.splice(hoverIndex, 0, dragPanel);
      
      // Update panel numbers
      return newPanels.map((panel, index) => ({
        ...panel,
        panelNumber: index + 1,
      }));
    });
  }, []);

  const handleSaveLayout = async () => {
    setIsSaving(true);
    try {
      const updatedComic = await comicsAPI.updateComic(comic.id, {
        panels: panels,
      });
      
      onComicUpdate(updatedComic.data);
      toast.success('Layout saved successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to save layout');
      console.error('Layout save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setPanels(comic.panels || []);
    setIsEditing(false);
  };

  return (
    <div className="w-full">
      {/* Editor Controls */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">Comic Editor</h2>
          <span className="text-sm text-gray-500">
            {panels.length} panels
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="btn btn-secondary"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLayout}
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Layout'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-primary"
            >
              Edit Layout
            </button>
          )}
        </div>
      </div>

      {/* Comic Canvas */}
      <DndProvider backend={HTML5Backend}>
        <div className="relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
          {/* Canvas Container */}
          <div 
            className="relative bg-white"
            style={{
              width: '100%',
              paddingBottom: '70%', // 10:7 aspect ratio
              minHeight: '500px',
            }}
          >
            {/* Panel Container */}
            <div className="absolute inset-0 p-4">
              {panels.map((panel, index) => (
                <ComicPanel
                  key={panel.id}
                  panel={panel}
                  index={index}
                  isEditing={isEditing}
                  onUpdatePanel={handleUpdatePanel}
                  onMovePanel={handleMovePanel}
                />
              ))}
            </div>
          </div>
        </div>
      </DndProvider>

      {/* Panel List (for small screens) */}
      <div className="mt-6 md:hidden">
        <h3 className="text-lg font-semibold mb-4">Panels</h3>
        <div className="space-y-4">
          {panels.map((panel, index) => (
            <div key={panel.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Panel {panel.panelNumber}</span>
                <span className="text-sm text-gray-500">
                  {panel.imageUrl ? 'Generated' : 'Generating...'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{panel.sceneDescription}</p>
              {panel.dialog && (
                <div className="bg-white p-2 rounded border text-sm">
                  <strong>Dialog:</strong> {panel.dialog}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComicEditor;