import React, { useState, useEffect, useRef } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { interpretTextWithDebounce, InterpretationResult } from '../services/aiService';
import SuggestionCards from './SuggestionCards';

interface TextInputProps {
  onInterpretation: (result: InterpretationResult) => void;
}

const TextInput: React.FC<TextInputProps> = ({ onInterpretation }) => {
  const [text, setText] = useState('');
  const [localInterpretation, setLocalInterpretation] = useState<InterpretationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProcessedText, setLastProcessedText] = useState('');
  const { addInteraction } = useCanvas();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Handle text input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    
    // Log the typing interaction
    addInteraction('type', undefined, { text: newText });
    
    // Reset error state when user types
    if (error) setError(null);
  };
  
  // Process text for AI interpretation when it changes
  useEffect(() => {
    if (text.trim()) {
      // Don't process if text is too short or hasn't changed significantly
      if (text.length < 3 || (lastProcessedText && text.startsWith(lastProcessedText) && text.length < lastProcessedText.length + 3)) {
        return;
      }
      
      setIsLoading(true);
      
      // Store the text being processed to avoid redundant calls
      setLastProcessedText(text);
      
      // First parameter: text to interpret
      // Second parameter: success callback
      // Third parameter: error callback
      // Fourth parameter: debounce time in ms
      interpretTextWithDebounce(
        text, 
        (result) => {
          // Store interpretation locally for cards
          setLocalInterpretation(result);
          // Also pass it up to parent
          onInterpretation(result);
          setIsLoading(false);
        },
        (errorMsg: string) => {
          console.error('Interpretation error:', errorMsg);
          setError(errorMsg || 'Failed to interpret text');
          setIsLoading(false);
          
          // Use cached result if available
          if (localInterpretation) {
            onInterpretation({
              ...localInterpretation,
              confidence: Math.max(0.3, localInterpretation.confidence * 0.7), // Reduce confidence for cached results
              details: 'Based on previous analysis (cache)'
            });
          }
        },
        600 // Slightly longer debounce for better UX
      );
    } else {
      setLocalInterpretation(null);
    }
  }, [text, onInterpretation]);
  
  // Focus the textarea on component mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
  return (
    <div className="input-area-wrapper">
      <div className={`input-area ${isLoading ? 'is-loading' : ''} ${error ? 'has-error' : ''}`}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          placeholder="Type something here to see AI interpretation..."
          spellCheck="false"
        />
        
        {isLoading && (
          <div className="input-loading-indicator">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="input-error-message">
            {error}
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
      </div>
      
      {/* Suggestion Cards component */}
      <SuggestionCards 
        interpretation={localInterpretation} 
        inputRef={textareaRef as React.RefObject<HTMLElement | null>}
        isLoading={isLoading}
      />
    </div>
  );
};

export default TextInput; 