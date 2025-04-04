import React, { useRef, useEffect } from 'react';
import { BubbleData } from './SuggestionBubbles';
import ExpandedBubbleView from './ExpandedBubbleView';

interface ExpandedBubbleOverlayProps {
  bubble: BubbleData | null;
  onClose: () => void;
}

const ExpandedBubbleOverlay: React.FC<ExpandedBubbleOverlayProps> = ({ bubble, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Handle clicks outside the expanded view to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Handle escape key press to close
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);
  
  if (!bubble) return null;
  
  return (
    <div 
      className={`expanded-bubble-overlay ${bubble ? 'visible' : ''}`} 
      ref={overlayRef}
    >
      <div 
        className="expanded-bubble-view" 
        data-category={bubble.category}
        ref={contentRef}
      >
        <ExpandedBubbleView
          category={bubble.category}
          confidence={bubble.confidence}
          text={bubble.text}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default ExpandedBubbleOverlay; 