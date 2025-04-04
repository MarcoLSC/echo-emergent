import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { InterpretationResult, IntentCategory } from '../services/aiService';
import ExpandedCardOverlay from './ExpandedCardOverlay';
import { recordInteraction } from '../services/userPreferenceService';

export interface CardData {
  id: string;
  category: IntentCategory;
  confidence: number;
  text: string;
  visible: boolean;
  position: {
    x: number;
    y: number;
  };
  highlighted?: boolean;
  touchActive?: boolean;
}

interface SuggestionCardsProps {
  interpretation: InterpretationResult | null;
  inputRef: React.RefObject<HTMLElement | null>;
  isLoading?: boolean;
}

// Different colors for different categories
export const categoryColors: Record<IntentCategory, string> = {
  'code': '#6A8FFF',
  'food': '#FF9566',
  'creative writing': '#B57DFF',
  'question': '#66C7FF',
  'greeting': '#66FFB8',
  'task': '#FFDE66',
  'personal': '#FF66A3',
  'unknown': '#AAAAAA'
};

// Different icons or symbols for different categories
const getCategoryIcon = (category: IntentCategory): string => {
  switch(category) {
    case 'code': return '{ }';
    case 'food': return '🍲';
    case 'creative writing': return '✒️';
    case 'question': return '?';
    case 'greeting': return '👋';
    case 'task': return '✓';
    case 'personal': return '👤';
    default: return '•';
  }
};

// Suggestions for each category when a card is clicked
const getSuggestionText = (category: IntentCategory): string => {
  switch(category) {
    case 'code': 
      return 'This looks like code. Need help with syntax or debugging?';
    case 'food': 
      return 'Food-related content detected. Want recipes or cooking tips?';
    case 'creative writing': 
      return 'Creative writing detected. Need help with plot or character development?';
    case 'question': 
      return 'I see you\'re asking a question. How can I help you find an answer?';
    case 'greeting': 
      return 'Hello! How can I assist you today?';
    case 'task': 
      return 'Task-related content detected. Need help organizing or planning?';
    case 'personal': 
      return 'This seems personal. Would you like to discuss this further?';
    default: 
      return 'I\'m not sure what this is about. Can you tell me more?';
  }
};

// Memoized card component for performance
const Card = memo(({ 
  card, 
  handleClick, 
  handleHover, 
  handleHoverEnd, 
  handleTouchStart, 
  handleTouchEnd 
}: { 
  card: CardData, 
  handleClick: (card: CardData) => void,
  handleHover: (card: CardData) => void,
  handleHoverEnd: () => void,
  handleTouchStart: (card: CardData) => void,
  handleTouchEnd: (card: CardData) => void
}) => {
  return (
    <div
      id={card.id}
      key={card.id}
      className={`suggestion-card ${card.visible ? 'visible' : ''} ${card.highlighted ? 'highlighted' : ''} ${card.touchActive ? 'touch-active' : ''}`}
      style={{
        left: `${card.position.x}px`,
        top: `${card.position.y}px`,
        borderColor: `${categoryColors[card.category]}`,
        opacity: Math.max(0.7, card.confidence),
        transform: card.visible ? 'scale(1)' : 'scale(0.8) translateY(20px)'
      }}
      data-confidence={card.confidence > 0.7 ? 'high' : card.confidence > 0.4 ? 'medium' : 'low'}
      onClick={() => handleClick(card)}
      onMouseEnter={() => handleHover(card)}
      onMouseLeave={handleHoverEnd}
      onTouchStart={() => handleTouchStart(card)}
      onTouchEnd={() => handleTouchEnd(card)}
    >
      <div className="card-icon" style={{ backgroundColor: categoryColors[card.category] }}>
        {getCategoryIcon(card.category)}
      </div>
      <div className="card-content">
        <div className="card-category">{card.category}</div>
        <div className="card-text">{card.text}</div>
        <div className="confidence-bar-mini">
          <div 
            className="confidence-level-mini" 
            style={{ 
              width: `${card.confidence * 100}%`,
              backgroundColor: categoryColors[card.category]
            }}
          />
        </div>
      </div>
    </div>
  );
});

Card.displayName = 'Card';

const SuggestionCards: React.FC<SuggestionCardsProps> = ({ interpretation, inputRef, isLoading = false }) => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<CardData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const requestRef = useRef<number | null>(null);
  const arrangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
      if (arrangeTimeoutRef.current !== null) {
        clearTimeout(arrangeTimeoutRef.current);
      }
    };
  }, []);
  
  // Generate a unique ID for new cards
  const generateId = useCallback(() => 
    `card-${Date.now()}-${Math.round(Math.random() * 1000)}`, []);
  
  // Handle card click for expanded view
  const handleCardClick = useCallback((card: CardData) => {
    // Record this interaction with isAccepted=true since user clicked on it
    recordInteraction(card.category, card.text, true);
    
    // Show the expanded view
    setExpandedCard(card);
    
    // Update the highlighted state
    setCards(prev => 
      prev.map(c => ({
        ...c,
        highlighted: c.id === card.id,
        touchActive: false
      }))
    );
  }, []);
  
  // Handle close of expanded view
  const handleCloseExpanded = useCallback(() => {
    setExpandedCard(null);
    
    // Remove highlighting from all cards
    setCards(prev => 
      prev.map(c => ({
        ...c,
        highlighted: false,
        touchActive: false
      }))
    );
  }, []);
  
  // Handle hover to show quick suggestion
  const handleCardHover = useCallback((card: CardData) => {
    // Only show the suggestion text if expanded view is not open
    if (!expandedCard && !isMobile) {
      setActiveSuggestion(getSuggestionText(card.category));
    }
  }, [expandedCard, isMobile]);
  
  // Handle hover end
  const handleCardHoverEnd = useCallback(() => {
    setActiveSuggestion(null);
  }, []);
  
  // Handle touch start (for mobile)
  const handleTouchStart = useCallback((card: CardData) => {
    // Set touch active state for visual feedback
    setCards(prev => 
      prev.map(c => ({
        ...c,
        touchActive: c.id === card.id
      }))
    );
    
    // Show quick suggestion
    setActiveSuggestion(getSuggestionText(card.category));
    
    // Set timeout to open expanded view if touch is held
    const timer = setTimeout(() => {
      handleCardClick(card);
    }, 500);
    
    // Store timer ID in a data attribute
    const cardElement = document.getElementById(card.id);
    if (cardElement) {
      cardElement.dataset.timerId = timer.toString();
    }
  }, [handleCardClick]);
  
  // Handle touch end
  const handleTouchEnd = useCallback((card: CardData) => {
    // Clear any pending long-press timer
    const cardElement = document.getElementById(card.id);
    if (cardElement && cardElement.dataset.timerId) {
      clearTimeout(parseInt(cardElement.dataset.timerId));
      delete cardElement.dataset.timerId;
    }
    
    // Reset touch active state
    setCards(prev => 
      prev.map(c => ({
        ...c,
        touchActive: false
      }))
    );
    
    // Clear suggestion after a short delay
    setTimeout(() => {
      setActiveSuggestion(null);
    }, 1500);
  }, []);

  // Calculate card position with smoother animation using requestAnimationFrame
  const calculateCardPosition = useCallback((
    containerRect: DOMRect, 
    inputRect: DOMRect, 
    cardCount: number, 
    cardIndex: number
  ): { x: number, y: number } => {
    // Base position (relative to the container)
    const baseX = inputRect.left - containerRect.left + inputRect.width / 2;
    const baseY = inputRect.top - containerRect.top - 20; // just above the input
    
    const radius = 160; // radius of the semi-circle
    
    if (cardCount < 5) {
      // Position in a semi-circle above the input
      const angle = Math.PI * (0.2 + 0.6 * (cardIndex / 4)); // Distribute between 0.2π and 0.8π
      return {
        x: baseX + radius * Math.cos(angle),
        y: baseY - radius * Math.sin(angle) // Negative to go up from the input
      };
    } else {
      // For more than 5 cards, create a wider arc
      const angle = Math.PI * (0.1 + 0.8 * (cardIndex / (cardCount - 1))); 
      return {
        x: baseX + radius * 1.2 * Math.cos(angle),
        y: baseY - radius * Math.sin(angle)
      };
    }
  }, []);
  
  // Smoothly arrange cards to prevent overlap with minimal movement using RAF
  const arrangeCards = useCallback(() => {
    if (cards.length <= 1) return;
    
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
    }
    
    requestRef.current = requestAnimationFrame(() => {
      setCards(prev => {
        const newCards = [...prev].map(card => ({...card}));
        
        // Simple collision resolution - push cards slightly apart if they overlap
        for (let i = 0; i < newCards.length; i++) {
          for (let j = i + 1; j < newCards.length; j++) {
            const c1 = newCards[i];
            const c2 = newCards[j];
            
            // Card dimensions (approximate)
            const cardWidth = 180;
            const cardHeight = 90;
            
            // Check if cards overlap
            const overlapX = Math.abs(c1.position.x - c2.position.x) < cardWidth;
            const overlapY = Math.abs(c1.position.y - c2.position.y) < cardHeight;
            
            if (overlapX && overlapY) {
              // Push cards away from each other
              const dx = c2.position.x - c1.position.x;
              const dy = c2.position.y - c1.position.y;
              
              // Push horizontally if closer in that direction
              if (Math.abs(dx) <= Math.abs(dy)) {
                const pushX = (cardWidth - Math.abs(dx)) / 2;
                newCards[i].position.x -= Math.sign(dx) * pushX;
                newCards[j].position.x += Math.sign(dx) * pushX;
              } 
              // Otherwise push vertically
              else {
                const pushY = (cardHeight - Math.abs(dy)) / 2;
                newCards[i].position.y -= Math.sign(dy) * pushY;
                newCards[j].position.y += Math.sign(dy) * pushY;
              }
            }
          }
        }
        
        return newCards;
      });
    });
  }, [cards.length]);
  
  useEffect(() => {
    if (!interpretation || !inputRef.current || !containerRef.current) return;
    
    // Record the interpretation in user history (with isAccepted=false)
    recordInteraction(interpretation.category, interpretation.details);
    
    // Determine card positions based on input position
    const inputRect = inputRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Create new card
    const newCard: CardData = {
      id: generateId(),
      category: interpretation.category,
      confidence: interpretation.confidence,
      text: interpretation.details || interpretation.category,
      visible: false, // Start invisible for animation
      position: { x: 0, y: 0 } // Position will be calculated next
    };
    
    // Add new card to the array with proper positioning
    setCards(prev => {
      // Remove old cards if we have too many
      const updatedCards = [...prev];
      if (updatedCards.length >= 5) {
        updatedCards.shift(); // Remove the oldest card
      }
      
      // If we already have a card with the same category, update it
      const existingIndex = updatedCards.findIndex(c => c.category === newCard.category);
      if (existingIndex !== -1) {
        const existingPosition = updatedCards[existingIndex].position;
        updatedCards[existingIndex] = {
          ...updatedCards[existingIndex],
          confidence: newCard.confidence,
          text: newCard.text,
          visible: true
        };
        return updatedCards;
      }
      
      // Calculate position for new card
      const newCardIndex = updatedCards.length;
      const position = calculateCardPosition(
        containerRect, 
        inputRect, 
        updatedCards.length + 1, 
        newCardIndex
      );
      
      return [...updatedCards, { ...newCard, position }];
    });
    
    // Animate the new card to become visible after a small delay
    setTimeout(() => {
      setCards(prev => 
        prev.map(card => 
          card.id === newCard.id ? { ...card, visible: true } : card
        )
      );
    }, 50);
    
    // Auto-arrange cards to prevent overlap after position calculation
    if (arrangeTimeoutRef.current !== null) {
      clearTimeout(arrangeTimeoutRef.current);
    }
    arrangeTimeoutRef.current = setTimeout(arrangeCards, 200);
    
  }, [interpretation, arrangeCards, calculateCardPosition, generateId]);
  
  return (
    <>
      <div className={`suggestion-cards-container ${isLoading ? 'is-loading' : ''}`} ref={containerRef}>
        {/* Render the active suggestion if any */}
        {activeSuggestion && !expandedCard && (
          <div className="active-suggestion">
            {activeSuggestion}
          </div>
        )}
        
        {/* Loading pulse when AI is working */}
        {isLoading && (
          <div className="suggestion-loading-pulse"></div>
        )}
        
        {/* Render cards */}
        {cards.map(card => (
          <Card
            key={card.id}
            card={card}
            handleClick={handleCardClick}
            handleHover={handleCardHover}
            handleHoverEnd={handleCardHoverEnd}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
          />
        ))}
      </div>
      
      {/* Expanded card overlay */}
      <ExpandedCardOverlay 
        card={expandedCard}
        onClose={handleCloseExpanded}
      />
    </>
  );
};

export default React.memo(SuggestionCards); 