import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InterpretationResult, IntentCategory } from '../services/aiService';
import ExpandedBubbleOverlay from './ExpandedBubbleOverlay';

export interface BubbleData {
  id: string;
  category: IntentCategory;
  confidence: number;
  text: string;
  visible: boolean;
  position: {
    x: number;
    y: number;
  };
  size: number;
  highlighted?: boolean;
  touchActive?: boolean;
}

interface SuggestionBubblesProps {
  interpretation: InterpretationResult | null;
  inputRef: React.RefObject<HTMLElement | null>;
}

// Different colors for different categories
const categoryColors: Record<IntentCategory, string> = {
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

// Suggestions for each category when a bubble is clicked
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

const SuggestionBubbles: React.FC<SuggestionBubblesProps> = ({ interpretation, inputRef }) => {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);
  const [expandedBubble, setExpandedBubble] = useState<BubbleData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
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
  
  // Generate a unique ID for new bubbles
  const generateId = () => `bubble-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  
  // Handle bubble click for expanded view
  const handleBubbleClick = useCallback((bubble: BubbleData) => {
    // Show the expanded view
    setExpandedBubble(bubble);
    
    // Update the highlighted state
    setBubbles(prev => 
      prev.map(b => ({
        ...b,
        highlighted: b.id === bubble.id,
        touchActive: false
      }))
    );
  }, []);
  
  // Handle close of expanded view
  const handleCloseExpanded = useCallback(() => {
    setExpandedBubble(null);
    
    // Remove highlighting from all bubbles
    setBubbles(prev => 
      prev.map(b => ({
        ...b,
        highlighted: false,
        touchActive: false
      }))
    );
  }, []);
  
  // Handle hover to show quick suggestion
  const handleBubbleHover = useCallback((bubble: BubbleData) => {
    // Only show the suggestion text if expanded view is not open
    if (!expandedBubble && !isMobile) {
      setActiveSuggestion(getSuggestionText(bubble.category));
    }
  }, [expandedBubble, isMobile]);
  
  // Handle hover end
  const handleBubbleHoverEnd = useCallback(() => {
    setActiveSuggestion(null);
  }, []);
  
  // Handle touch start (for mobile)
  const handleTouchStart = useCallback((bubble: BubbleData) => {
    // Set touch active state for visual feedback
    setBubbles(prev => 
      prev.map(b => ({
        ...b,
        touchActive: b.id === bubble.id
      }))
    );
    
    // Show quick suggestion
    setActiveSuggestion(getSuggestionText(bubble.category));
    
    // Set timeout to open expanded view if touch is held
    const timer = setTimeout(() => {
      handleBubbleClick(bubble);
    }, 500);
    
    // Store timer ID in a data attribute
    const bubbleElement = document.getElementById(bubble.id);
    if (bubbleElement) {
      bubbleElement.dataset.timerId = timer.toString();
    }
  }, [handleBubbleClick]);
  
  // Handle touch end
  const handleTouchEnd = useCallback((bubble: BubbleData) => {
    // Clear any pending long-press timer
    const bubbleElement = document.getElementById(bubble.id);
    if (bubbleElement && bubbleElement.dataset.timerId) {
      clearTimeout(parseInt(bubbleElement.dataset.timerId));
      delete bubbleElement.dataset.timerId;
    }
    
    // Reset touch active state
    setBubbles(prev => 
      prev.map(b => ({
        ...b,
        touchActive: false
      }))
    );
    
    // Clear suggestion after a short delay
    setTimeout(() => {
      setActiveSuggestion(null);
    }, 1500);
  }, []);
  
  useEffect(() => {
    if (!interpretation || !inputRef.current || !containerRef.current) return;
    
    // Determine bubble positions based on input position
    const inputRect = inputRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Base position (relative to the container)
    const baseX = inputRect.left - containerRect.left + inputRect.width / 2;
    const baseY = inputRect.top - containerRect.top - 20; // just above the input
    
    // Create new bubble
    const newBubble: BubbleData = {
      id: generateId(),
      category: interpretation.category,
      confidence: interpretation.confidence,
      text: interpretation.details || interpretation.category,
      visible: false, // Start invisible for animation
      position: {
        // Random position near the input
        x: baseX + (Math.random() * 200 - 100),
        y: baseY + (Math.random() * 100 - 50),
      },
      size: 40 + interpretation.confidence * 30, // Size based on confidence
    };
    
    // Add new bubble to the array
    setBubbles(prev => {
      // Remove old bubbles if we have too many
      const updatedBubbles = [...prev];
      if (updatedBubbles.length >= 5) {
        updatedBubbles.shift(); // Remove the oldest bubble
      }
      
      // If we already have a bubble with the same category, update its position and confidence
      const existingIndex = updatedBubbles.findIndex(b => b.category === newBubble.category);
      if (existingIndex !== -1) {
        updatedBubbles[existingIndex] = {
          ...updatedBubbles[existingIndex],
          confidence: newBubble.confidence,
          text: newBubble.text,
          position: {
            x: baseX + (Math.random() * 200 - 100),
            y: baseY + (Math.random() * 100 - 50),
          },
          visible: true,
        };
        return updatedBubbles;
      }
      
      return [...updatedBubbles, newBubble];
    });
    
    // Animate the new bubble to become visible after a small delay
    setTimeout(() => {
      setBubbles(prev => 
        prev.map(bubble => 
          bubble.id === newBubble.id ? { ...bubble, visible: true } : bubble
        )
      );
    }, 50);
    
    // Auto-arrange bubbles to prevent overlap
    setTimeout(arrangeBubbles, 100);
    
  }, [interpretation]);
  
  // Arrange bubbles to prevent overlap
  const arrangeBubbles = () => {
    if (bubbles.length <= 1) return;
    
    setBubbles(prev => {
      const newBubbles = [...prev].map(bubble => ({...bubble}));
      
      // Simple collision resolution
      for (let i = 0; i < newBubbles.length; i++) {
        for (let j = i + 1; j < newBubbles.length; j++) {
          const b1 = newBubbles[i];
          const b2 = newBubbles[j];
          
          const dx = b2.position.x - b1.position.x;
          const dy = b2.position.y - b1.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = (b1.size + b2.size) / 2;
          
          if (distance < minDistance) {
            // Move bubbles away from each other
            const angle = Math.atan2(dy, dx);
            const pushDistance = (minDistance - distance) / 2;
            
            newBubbles[i].position.x -= Math.cos(angle) * pushDistance;
            newBubbles[i].position.y -= Math.sin(angle) * pushDistance;
            newBubbles[j].position.x += Math.cos(angle) * pushDistance;
            newBubbles[j].position.y += Math.sin(angle) * pushDistance;
          }
        }
      }
      
      return newBubbles;
    });
  };
  
  return (
    <>
      <div className="suggestion-bubbles-container" ref={containerRef}>
        {/* Render the active suggestion if any */}
        {activeSuggestion && !expandedBubble && (
          <div className="active-suggestion">
            {activeSuggestion}
          </div>
        )}
        
        {/* Render bubbles */}
        {bubbles.map(bubble => (
          <div
            id={bubble.id}
            key={bubble.id}
            className={`suggestion-bubble ${bubble.visible ? 'visible' : ''} ${bubble.highlighted ? 'highlighted' : ''} ${bubble.touchActive ? 'touch-active' : ''}`}
            style={{
              left: `${bubble.position.x}px`,
              top: `${bubble.position.y}px`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              backgroundColor: `${categoryColors[bubble.category]}`,
              opacity: bubble.confidence,
              transform: `scale(${bubble.visible ? 1 : 0}) rotate(${Math.random() * 10 - 5}deg)`,
            }}
            data-confidence={bubble.confidence > 0.7 ? 'high' : bubble.confidence > 0.4 ? 'medium' : 'low'}
            onClick={() => handleBubbleClick(bubble)}
            onMouseEnter={() => handleBubbleHover(bubble)}
            onMouseLeave={handleBubbleHoverEnd}
            onTouchStart={() => handleTouchStart(bubble)}
            onTouchEnd={() => handleTouchEnd(bubble)}
          >
            <div className="bubble-icon">
              {getCategoryIcon(bubble.category)}
            </div>
            <div className="bubble-tooltip">
              <div className="bubble-category">{bubble.category}</div>
              <div className="bubble-text">{bubble.text}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Expanded bubble overlay */}
      <ExpandedBubbleOverlay 
        bubble={expandedBubble}
        onClose={handleCloseExpanded}
      />
    </>
  );
};

export default SuggestionBubbles; 