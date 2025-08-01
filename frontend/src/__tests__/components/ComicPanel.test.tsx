import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ComicPanel from '@/components/ComicPanel';
import { Panel } from '@/types';

const mockPanel: Panel = {
  id: 'panel-1',
  comicId: 'comic-1',
  panelNumber: 1,
  imageUrl: 'https://example.com/image.jpg',
  dialog: 'Hello, world!',
  position: { x: 0, y: 0, width: 100, height: 100 },
  characters: ['Character1'],
  sceneDescription: 'A character says hello',
  midjourneyPrompt: 'Character saying hello, comic style',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DndProvider backend={HTML5Backend}>
    {children}
  </DndProvider>
);

describe('ComicPanel', () => {
  const mockOnUpdatePanel = jest.fn();
  const mockOnMovePanel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders panel with image and dialog', () => {
    render(
      <TestWrapper>
        <ComicPanel
          panel={mockPanel}
          index={0}
          onUpdatePanel={mockOnUpdatePanel}
          onMovePanel={mockOnMovePanel}
        />
      </TestWrapper>
    );

    // Check panel number
    expect(screen.getByText('1')).toBeInTheDocument();

    // Check image
    const image = screen.getByAltText('Panel 1');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockPanel.imageUrl);

    // Check dialog
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });

  it('renders placeholder when no image', () => {
    const panelWithoutImage = { ...mockPanel, imageUrl: undefined };

    render(
      <TestWrapper>
        <ComicPanel
          panel={panelWithoutImage}
          index={0}
          onUpdatePanel={mockOnUpdatePanel}
          onMovePanel={mockOnMovePanel}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  it('enters edit mode when dialog is clicked in editing mode', () => {
    render(
      <TestWrapper>
        <ComicPanel
          panel={mockPanel}
          index={0}
          isEditing={true}
          onUpdatePanel={mockOnUpdatePanel}
          onMovePanel={mockOnMovePanel}
        />
      </TestWrapper>
    );

    const dialog = screen.getByText('Hello, world!');
    fireEvent.click(dialog);

    // Should show textarea for editing
    const textarea = screen.getByDisplayValue('Hello, world!');
    expect(textarea).toBeInTheDocument();
  });

  it('saves dialog changes when save button is clicked', () => {
    render(
      <TestWrapper>
        <ComicPanel
          panel={mockPanel}
          index={0}
          isEditing={true}
          onUpdatePanel={mockOnUpdatePanel}
          onMovePanel={mockOnMovePanel}
        />
      </TestWrapper>
    );

    // Enter edit mode
    const dialog = screen.getByText('Hello, world!');
    fireEvent.click(dialog);

    // Change dialog text
    const textarea = screen.getByDisplayValue('Hello, world!');
    fireEvent.change(textarea, { target: { value: 'New dialog text' } });

    // Save changes
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnUpdatePanel).toHaveBeenCalledWith('panel-1', {
      dialog: 'New dialog text',
    });
  });

  it('cancels dialog editing when cancel button is clicked', () => {
    render(
      <TestWrapper>
        <ComicPanel
          panel={mockPanel}
          index={0}
          isEditing={true}
          onUpdatePanel={mockOnUpdatePanel}
          onMovePanel={mockOnMovePanel}
        />
      </TestWrapper>
    );

    // Enter edit mode
    const dialog = screen.getByText('Hello, world!');
    fireEvent.click(dialog);

    // Change dialog text
    const textarea = screen.getByDisplayValue('Hello, world!');
    fireEvent.change(textarea, { target: { value: 'New dialog text' } });

    // Cancel changes
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Should not call update function
    expect(mockOnUpdatePanel).not.toHaveBeenCalled();

    // Should show original dialog
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });

  it('shows edit overlay on hover when in editing mode', () => {
    render(
      <TestWrapper>
        <ComicPanel
          panel={mockPanel}
          index={0}
          isEditing={true}
          onUpdatePanel={mockOnUpdatePanel}
          onMovePanel={mockOnMovePanel}
        />
      </TestWrapper>
    );

    // The edit overlay should be present but initially hidden
    expect(screen.getByText('Edit Dialog')).toBeInTheDocument();
  });

  it('shows scene description when in editing mode', () => {
    render(
      <TestWrapper>
        <ComicPanel
          panel={mockPanel}
          index={0}
          isEditing={true}
          onUpdatePanel={mockOnUpdatePanel}
          onMovePanel={mockOnMovePanel}
        />
      </TestWrapper>
    );

    // Should show truncated scene description
    expect(screen.getByText('A character says hello...')).toBeInTheDocument();
  });

  it('does not show edit functionality when not in editing mode', () => {
    render(
      <TestWrapper>
        <ComicPanel
          panel={mockPanel}
          index={0}
          isEditing={false}
          onUpdatePanel={mockOnUpdatePanel}
          onMovePanel={mockOnMovePanel}
        />
      </TestWrapper>
    );

    const dialog = screen.getByText('Hello, world!');
    fireEvent.click(dialog);

    // Should not show textarea for editing
    expect(screen.queryByDisplayValue('Hello, world!')).not.toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });
});