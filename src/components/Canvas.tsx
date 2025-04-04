import React, { useRef, useEffect, useState } from 'react';
import { useCanvas } from '../context/CanvasContext';

interface CanvasProps {
  children: React.ReactNode;
}

export const Canvas: React.FC<CanvasProps> = ({ children }) => {
  const { state, addInteraction, getInteractionStats } = useCanvas();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [showStats, setShowStats] = useState(false);

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      addInteraction('move', { x, y });
    };

    // Throttle mouse move events
    let timeout: number | undefined;
    const throttledMouseMove = (e: MouseEvent) => {
      if (timeout) return;
      timeout = window.setTimeout(() => {
        handleMouseMove(e);
        timeout = undefined;
      }, 100);
    };

    const handleClick = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      addInteraction('click', { x, y });
    };
    
    // Handle scroll events
    const handleScroll = (e: Event) => {
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      addInteraction('scroll', { x: scrollX, y: scrollY }, { 
        deltaY: (e as WheelEvent).deltaY,
        deltaX: (e as WheelEvent).deltaX 
      });
    };
    
    // Handle keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      addInteraction('keydown', undefined, {
        key: e.key,
        code: e.code,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey
      });
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      addInteraction('keyup', undefined, {
        key: e.key,
        code: e.code,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey
      });
    };
    
    // Handle paste events
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text') || '';
      addInteraction('paste', undefined, { 
        text,
        length: text.length
      });
    };

    // Toggle stats display with a keyboard shortcut (Alt+S)
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 's') {
        setShowStats(prev => !prev);
      }
    };

    const element = canvasRef.current;
    
    if (element) {
      // Mouse events
      element.addEventListener('mousemove', throttledMouseMove);
      element.addEventListener('click', handleClick);
    }
    
    // Global events
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyboardShortcut);

    return () => {
      if (element) {
        element.removeEventListener('mousemove', throttledMouseMove);
        element.removeEventListener('click', handleClick);
      }
      
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyboardShortcut);
      
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, [addInteraction]);

  return (
    <div 
      ref={canvasRef} 
      className="canvas" 
      data-phase={state.phase}
    >
      {children}
      
      {/* Interaction visual indicator */}
      {state.lastInteraction && (
        <div 
          className="interaction-indicator"
          style={{
            top: state.lastInteraction.position?.y ?? 20,
            left: state.lastInteraction.position?.x ?? 20
          }}
        >
          {state.lastInteraction.type}
        </div>
      )}
      
      {/* Interaction stats panel (toggle with Alt+S) */}
      {showStats && (
        <div className="stats-panel">
          <h3>Interaction Stats</h3>
          <p>Total: {getInteractionStats().total}</p>
          <ul>
            {Object.entries(getInteractionStats().byType).map(([type, count]) => (
              <li key={type}>{type}: {count}</li>
            ))}
          </ul>
          <p style={{ marginTop: '5px', fontSize: '10px' }}>Press Alt+S to hide</p>
        </div>
      )}
    </div>
  );
}; 