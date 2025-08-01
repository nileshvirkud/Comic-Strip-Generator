import React, { useState, useRef, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Panel } from '@/types';

interface ComicPanelProps {
  panel: Panel;
  onUpdatePanel: (panelId: string, updates: Partial<Panel>) => void;
  onMovePanel: (dragIndex: number, hoverIndex: number) => void;
  index: number;
  isEditing?: boolean;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const ComicPanel: React.FC<ComicPanelProps> = ({
  panel,
  onUpdatePanel,
  onMovePanel,
  index,
  isEditing = false,
}) => {
  const [isEditingDialog, setIsEditingDialog] = useState(false);
  const [dialogText, setDialogText] = useState(panel.dialog);
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'panel',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset?.y || 0) - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onMovePanel(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'panel',
    item: () => {
      return { id: panel.id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  const handleDialogSave = () => {
    onUpdatePanel(panel.id, { dialog: dialogText });
    setIsEditingDialog(false);
  };

  const handleDialogCancel = () => {
    setDialogText(panel.dialog);
    setIsEditingDialog(false);
  };

  useEffect(() => {
    setDialogText(panel.dialog);
  }, [panel.dialog]);

  return (
    <div
      ref={ref}
      style={{ 
        opacity,
        ...panel.position,
      }}
      className={`comic-panel relative group ${isEditing ? 'cursor-move' : ''}`}
      data-handler-id={handlerId}
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
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm">Generating...</p>
            </div>
          </div>
        )}

        {/* Speech Bubble */}
        {panel.dialog && !isEditingDialog && (
          <div 
            className="absolute top-2 left-2 speech-bubble max-w-xs p-2 text-sm cursor-pointer"
            onClick={() => isEditing && setIsEditingDialog(true)}
          >
            {panel.dialog}
          </div>
        )}

        {/* Dialog Editor */}
        {isEditingDialog && (
          <div className="absolute top-2 left-2 bg-white border-2 border-primary-500 rounded-lg p-2 max-w-xs z-20">
            <textarea
              value={dialogText}
              onChange={(e) => setDialogText(e.target.value)}
              className="w-full p-1 text-sm border rounded resize-none"
              rows={3}
              placeholder="Enter dialog..."
              autoFocus
            />
            <div className="flex justify-end space-x-1 mt-2">
              <button
                onClick={handleDialogCancel}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDialogSave}
                className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Edit Overlay */}
        {isEditing && (
          <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white rounded-lg p-2 shadow-lg">
              <button
                onClick={() => setIsEditingDialog(true)}
                className="text-xs text-gray-700 hover:text-primary-600"
              >
                Edit Dialog
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Panel Info */}
      {isEditing && (
        <div className="absolute -bottom-6 left-0 right-0 text-xs text-gray-500 text-center">
          {panel.sceneDescription.substring(0, 30)}...
        </div>
      )}
    </div>
  );
};

export default ComicPanel;