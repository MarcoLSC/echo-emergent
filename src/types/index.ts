export interface Interaction {
  id: string;
  type: 'hover' | 'click' | 'type' | 'move' | 'scroll' | 'paste' | 'keydown' | 'keyup';
  position?: { x: number; y: number };
  timestamp: number;
  data?: any;
}

// Type for text data in interactions
export interface TextInteractionData {
  text: string;
  length?: number;
}

export interface CanvasState {
  interactions: Interaction[];
  elements: any[];
  phase: 'initial' | 'evolving' | 'responsive';
  lastInteraction?: Interaction;
  currentText?: string;
  currentCategory?: string;
} 