import React, { useEffect, useState } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { Interaction } from '../types';

const KeyboardDisplay: React.FC = () => {
  const { state } = useCanvas();
  const [recentKeys, setRecentKeys] = useState<Interaction[]>([]);

  useEffect(() => {
    // Check if the last interaction was a keyboard event
    if (state.lastInteraction && 
       (state.lastInteraction.type === 'keydown' || 
        state.lastInteraction.type === 'keyup')) {
      
      // Add to recent keys
      setRecentKeys(prev => {
        // Create new array with the last interaction at the beginning
        const updated = [state.lastInteraction!, ...prev];
        
        // Only keep the last 5 keys
        return updated.slice(0, 5);
      });
    }
  }, [state.lastInteraction]);

  // Don't render anything if no keyboard events have occurred
  if (recentKeys.length === 0) return null;

  return (
    <div className="keyboard-display">
      <h4>Recent Keyboard Activity</h4>
      <div className="key-list">
        {recentKeys.map((keyEvent, index) => {
          // Get key info from interaction data
          const keyInfo = keyEvent.data as { key: string; code: string; altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean };
          
          // Determine if it's a special key
          const isSpecialKey = 
            keyInfo.key.length > 1 || 
            keyInfo.altKey || 
            keyInfo.ctrlKey || 
            keyInfo.metaKey || 
            keyInfo.shiftKey;
          
          // Create a display representation
          let keyDisplay = keyInfo.key;
          if (keyInfo.key === ' ') keyDisplay = 'Space';
          
          // Create a list of modifiers
          const modifiers = [];
          if (keyInfo.altKey) modifiers.push('Alt');
          if (keyInfo.ctrlKey) modifiers.push('Ctrl');
          if (keyInfo.metaKey) modifiers.push('Meta');
          if (keyInfo.shiftKey) modifiers.push('Shift');
          
          const modifierText = modifiers.length > 0 ? `${modifiers.join('+')}+` : '';
          
          return (
            <div 
              key={keyEvent.id} 
              className={`key-item ${keyEvent.type === 'keydown' ? 'key-down' : 'key-up'} ${isSpecialKey ? 'special-key' : ''}`}
            >
              <span className="key-label">{modifierText}{keyDisplay}</span>
              <span className="key-type">{keyEvent.type === 'keydown' ? '▼' : '▲'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KeyboardDisplay; 