import React, { useRef, useEffect } from 'react';
import { CardData } from './SuggestionCards';
import ExpandedBubbleView from './ExpandedBubbleView';

interface ExpandedCardOverlayProps {
  card: CardData | null;
  onClose: () => void;
}

const ExpandedCardOverlay: React.FC<ExpandedCardOverlayProps> = ({ card, onClose }) => {
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
  
  if (!card) return null;
  
  return (
    <div 
      className={`expanded-card-overlay ${card ? 'visible' : ''}`} 
      ref={overlayRef}
    >
      <div 
        className="expanded-card-view" 
        data-category={card.category}
        ref={contentRef}
      >
        <ExpandedBubbleView
          category={card.category}
          confidence={card.confidence}
          text={card.text}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default ExpandedCardOverlay; 