import { createContext, useContext, useState, ReactNode } from 'react';
import { CanvasState, Interaction, TextInteractionData } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Default state for the canvas
const defaultCanvasState: CanvasState = {
  interactions: [],
  elements: [],
  phase: 'initial',
  currentCategory: undefined
};

// Create the context
const CanvasContext = createContext<{
  state: CanvasState;
  addInteraction: (type: Interaction['type'], position?: { x: number; y: number }, data?: any) => void;
  evolveCanvas: () => void;
  getInteractionStats: () => { total: number, byType: Record<string, number> };
  getCurrentText: () => string;
  updateCategory: (category: string) => void;
} | undefined>(undefined);

// Context provider component
export function CanvasProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CanvasState>(defaultCanvasState);

  // Add a new interaction to the state
  const addInteraction = (
    type: Interaction['type'],
    position?: { x: number; y: number },
    data?: any
  ) => {
    const newInteraction: Interaction = {
      id: uuidv4(),
      type,
      position,
      timestamp: Date.now(),
      data
    };

    // Log interaction to console for debugging
    console.log(`Interaction detected: ${type}`, { position, data });

    // Track current text for typing and paste actions
    let currentText = state.currentText;
    if (type === 'type' && data && 'text' in data) {
      currentText = data.text;
    } else if (type === 'paste' && data && 'text' in data) {
      // If we're pasting, append to existing text if there is any
      currentText = (state.currentText || '') + data.text;
    }

    // Update category if provided in the data
    let currentCategory = state.currentCategory;
    if (data && 'category' in data) {
      currentCategory = data.category;
    }

    setState(prev => ({
      ...prev,
      interactions: [...prev.interactions, newInteraction],
      lastInteraction: newInteraction,
      currentText,
      currentCategory
    }));

    // If we have enough interactions, evolve the canvas
    if (state.interactions.length >= 5 && state.phase === 'initial') {
      evolveCanvas();
    }
  };

  // Get the current text from typing/pasting
  const getCurrentText = (): string => {
    return state.currentText || '';
  };

  // Get statistics about the interactions
  const getInteractionStats = () => {
    const byType: Record<string, number> = {};
    
    state.interactions.forEach(interaction => {
      if (!byType[interaction.type]) {
        byType[interaction.type] = 0;
      }
      byType[interaction.type]++;
    });
    
    return {
      total: state.interactions.length,
      byType
    };
  };

  // Update the current content category
  const updateCategory = (category: string) => {
    setState(prev => ({
      ...prev,
      currentCategory: category
    }));
  };

  // Evolve the canvas to the next phase
  const evolveCanvas = () => {
    setState(prev => ({
      ...prev,
      phase: prev.phase === 'initial' ? 'evolving' : 'responsive'
    }));
  };

  return (
    <CanvasContext.Provider value={{ 
      state, 
      addInteraction, 
      evolveCanvas, 
      getInteractionStats, 
      getCurrentText,
      updateCategory 
    }}>
      {children}
    </CanvasContext.Provider>
  );
}

// Custom hook to use the canvas context
export function useCanvas() {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
} 