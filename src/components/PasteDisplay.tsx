import React, { useEffect, useState, useRef } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { Interaction } from '../types';
import { interpretTextWithDebounce, InterpretationResult } from '../services/aiService';
import SuggestionCards from './SuggestionCards';

interface PasteDisplayProps {
  onInterpretation?: (result: InterpretationResult) => void;
}

const PasteDisplay: React.FC<PasteDisplayProps> = ({ onInterpretation }) => {
  const { state } = useCanvas();
  const [recentPaste, setRecentPaste] = useState<Interaction | null>(null);
  const [visible, setVisible] = useState(false);
  const [localInterpretation, setLocalInterpretation] = useState<InterpretationResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if the last interaction was a paste event
    if (state.lastInteraction && state.lastInteraction.type === 'paste') {
      setRecentPaste(state.lastInteraction);
      setVisible(true);
      
      // Send to AI for interpretation if there's text
      if (state.lastInteraction.data && 'text' in state.lastInteraction.data) {
        const pasteText = state.lastInteraction.data.text as string;
        if (pasteText.trim()) {
          interpretTextWithDebounce(pasteText, (result) => {
            // Save locally for cards
            setLocalInterpretation(result);
            
            // Also pass up to parent if handler exists
            if (onInterpretation) {
              onInterpretation(result);
            }
          });
        }
      }
      
      // Hide after 3 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [state.lastInteraction, onInterpretation]);

  if (!visible || !recentPaste) return null;

  const pasteData = recentPaste.data as { text: string; length: number };
  
  // Truncate long text
  const displayText = 
    pasteData.text.length > 50 
      ? pasteData.text.substring(0, 50) + '...' 
      : pasteData.text;

  return (
    <div className="paste-display" ref={containerRef}>
      <h4>Pasted Text</h4>
      <div className="paste-content">
        <p className="paste-text">{displayText}</p>
        <p className="paste-meta">Length: {pasteData.length} characters</p>
      </div>
      
      {/* Show cards around pasted text too */}
      {localInterpretation && containerRef.current && (
        <SuggestionCards 
          interpretation={localInterpretation}
          inputRef={containerRef as React.RefObject<HTMLElement>}
        />
      )}
    </div>
  );
};

export default PasteDisplay; 