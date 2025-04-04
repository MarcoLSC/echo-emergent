import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useCanvas } from '../context/CanvasContext';

interface AdaptiveBackgroundProps {
  children: React.ReactNode;
}

// Color palettes for different states - memoized
const colorPalettes = {
  idle: ['#1a1a2e', '#16213e', '#0f3460'],
  active: ['#16213e', '#1a1e3b', '#252d5a'],
  creative: ['#1a1a2e', '#321e54', '#4d3677'],
  coding: ['#1a232e', '#162c3e', '#0f344c'],
  focused: ['#1a1a2e', '#1a2e3d', '#0f3460'],
};

// Background patterns - memoized
const backgroundVariations = {
  dots: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
  grid: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
  waves: 'url("data:image/svg+xml,%3Csvg width=\'100%25\' height=\'100%25\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'waves\' patternUnits=\'userSpaceOnUse\' width=\'100\' height=\'20\' patternTransform=\'scale(1) rotate(0)\'%3E%3Cpath d=\'M0 5 Q 25 0, 50 5 T 100 5\' stroke=\'rgba(255,255,255,0.03)\' fill=\'none\'/%3E%3Cpath d=\'M0 15 Q 25 10, 50 15 T 100 15\' stroke=\'rgba(255,255,255,0.03)\' fill=\'none\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'url(%23waves)\'/%3E%3C/svg%3E")',
};

const AdaptiveBackground: React.FC<AdaptiveBackgroundProps> = ({ children }) => {
  const { state } = useCanvas();
  const [backgroundState, setBackgroundState] = useState('idle');
  const [activityLevel, setActivityLevel] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [idleTime, setIdleTime] = useState(0);
  const [cardCount, setCardCount] = useState(0);
  const [backgroundPattern, setBackgroundPattern] = useState<string>(backgroundVariations.dots);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const lastInteractionTimeRef = useRef<number>(Date.now());
  const typingTimestampsRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const updateTimeRef = useRef<number>(0);
  const frameRateRef = useRef<number>(1000); // ms between updates
  
  // Calculate typing speed based on recent keystrokes - memoized function
  const calculateTypingSpeed = useCallback(() => {
    const now = Date.now();
    const recentTimestamps = typingTimestampsRef.current.filter(
      time => now - time < 3000
    );
    
    if (recentTimestamps.length < 2) {
      return 0; // Not enough data to calculate speed
    }
    
    // Calculate characters per minute
    const timeSpan = (recentTimestamps[recentTimestamps.length - 1] - recentTimestamps[0]) / 1000 / 60;
    if (timeSpan === 0) return 0;
    
    const cpm = recentTimestamps.length / timeSpan;
    return Math.min(1, cpm / 300); // Normalize to 0-1 range, assuming 300 CPM is very fast
  }, []);
  
  // Track user interactions - optimized with useCallback
  useEffect(() => {
    if (!state.lastInteraction) return;
    
    // Update last interaction time
    lastInteractionTimeRef.current = Date.now();
    
    // Track typing timestamps for speed calculation
    if (state.lastInteraction.type === 'type' || state.lastInteraction.type === 'keydown') {
      typingTimestampsRef.current.push(Date.now());
      // Keep only the last 30 timestamps
      if (typingTimestampsRef.current.length > 30) {
        typingTimestampsRef.current.shift();
      }
    }
    
    // Reset idle timer
    setIdleTime(0);
    
  }, [state.lastInteraction]);
  
  // Count active cards
  useEffect(() => {
    // Count suggestions by tracking interactions
    const categories = new Set();
    state.interactions.slice(-20).forEach(interaction => {
      if (interaction.type === 'type' && interaction.data?.text) {
        // For simplicity, we're just getting a rough count of different inputs
        categories.add(interaction.data.text.slice(0, 10));
      }
    });
    
    setCardCount(Math.min(categories.size, 5));
  }, [state.interactions]);
  
  // Main background update loop - optimized with throttling and RAF
  useEffect(() => {
    // Update function using requestAnimationFrame
    const updateBackground = (timestamp: number) => {
      // Skip frame if it's too soon (throttle updates)
      if (timestamp - updateTimeRef.current < frameRateRef.current) {
        rafRef.current = requestAnimationFrame(updateBackground);
        return;
      }
      
      // Update time tracker
      updateTimeRef.current = timestamp;
      
      // Main update logic
      const now = Date.now();
      
      // Calculate idle time
      const newIdleTime = (now - lastInteractionTimeRef.current) / 1000; // seconds
      
      // Use lower frame rate when idle to save CPU
      if (newIdleTime > 5) {
        frameRateRef.current = 2000; // 0.5 FPS when idle
      } else {
        frameRateRef.current = 1000; // 1 FPS when active
      }
      
      setIdleTime(newIdleTime);
      
      // Calculate typing speed
      const newTypingSpeed = calculateTypingSpeed();
      setTypingSpeed(newTypingSpeed);
      
      // Determine activity level (0-1 range)
      const newActivityLevel = Math.max(
        0,
        1 - Math.min(1, newIdleTime / 20) // Idle factor: 0 after 20s idle
      ) * (
        0.3 + // Base activity
        newTypingSpeed * 0.4 + // Typing contribution
        Math.min(cardCount / 5, 1) * 0.3 // Card count contribution
      );
      
      setActivityLevel(prev => {
        // Smooth transitions
        return prev * 0.8 + newActivityLevel * 0.2;
      });
      
      // Determine background state based on user activity
      let newState = 'idle';
      
      if (activityLevel > 0.7) {
        newState = 'focused';
      } else if (activityLevel > 0.4) {
        newState = 'active';
      } else if (newIdleTime > 30) { // After 30s idle, go back to idle state
        newState = 'idle';
      }
      
      // Determine background pattern based on the latest interactions
      if (state.lastInteraction) {
        const recentCategories = new Set<string>();
        state.interactions.slice(-10).forEach(interaction => {
          if (interaction.data?.category) {
            recentCategories.add(interaction.data.category);
          }
        });
        
        if (recentCategories.has('code')) {
          newState = 'coding';
          if (Math.random() < 0.05) { // Reduced frequency of pattern changes
            setBackgroundPattern(backgroundVariations.grid);
          }
        } else if (recentCategories.has('creative writing')) {
          newState = 'creative';
          if (Math.random() < 0.05) {
            setBackgroundPattern(backgroundVariations.waves);
          }
        } else {
          // Default pattern
          if (Math.random() < 0.02) {
            setBackgroundPattern(backgroundVariations.dots);
          }
        }
      }
      
      setBackgroundState(newState);
      
      // Continue animation loop
      rafRef.current = requestAnimationFrame(updateBackground);
    };
    
    // Start the update loop
    rafRef.current = requestAnimationFrame(updateBackground);
    
    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [activityLevel, calculateTypingSpeed, cardCount, state.interactions, state.lastInteraction]);
  
  // Generate CSS variables for background - memoized
  const cssVars = useMemo(() => {
    const colorSet = colorPalettes[backgroundState as keyof typeof colorPalettes] || colorPalettes.idle;
    
    // Calculate wave animation speed (slower when idle, faster when active)
    const waveSpeed = 10 + activityLevel * 20; // 10-30s
    
    // Calculate pulse intensity based on typing speed
    const pulseIntensity = 0.98 + typingSpeed * 0.04; // 0.98-1.02
    
    return {
      '--bg-color-1': colorSet[0] || '#1a1a2e',
      '--bg-color-2': colorSet[1] || '#16213e', 
      '--bg-color-3': colorSet[2] || '#0f3460',
      '--wave-speed': `${waveSpeed}s`,
      '--pulse-scale': pulseIntensity,
      '--activity-level': activityLevel,
      '--bg-pattern': backgroundPattern,
      '--idle-opacity': Math.min(idleTime / 30, 1).toFixed(2)
    } as React.CSSProperties;
  }, [backgroundState, activityLevel, typingSpeed, idleTime, backgroundPattern]);
  
  return (
    <div 
      className="adaptive-background" 
      ref={backgroundRef}
      style={cssVars}
      data-state={backgroundState}
    >
      <div className="background-overlay"></div>
      <div className="background-pattern"></div>
      <div className="background-gradient"></div>
      <div className="activity-indicator"></div>
      <div className="content-container">
        {children}
      </div>
    </div>
  );
};

export default React.memo(AdaptiveBackground); 