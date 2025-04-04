import React, { useEffect } from 'react';
import { InterpretationResult } from '../services/aiService';
import { useCanvas } from '../context/CanvasContext';

interface AIInterpretationProps {
  interpretation: InterpretationResult | null;
}

const AIInterpretation: React.FC<AIInterpretationProps> = ({ interpretation }) => {
  const { updateCategory } = useCanvas();
  
  useEffect(() => {
    if (interpretation && interpretation.category) {
      // Update context with the current category
      updateCategory(interpretation.category);
    }
  }, [interpretation, updateCategory]);
  
  if (!interpretation) return null;
  
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'rgba(46, 204, 113, 0.8)';
    if (confidence >= 0.5) return 'rgba(241, 196, 15, 0.8)';
    return 'rgba(231, 76, 60, 0.8)';
  };
  
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  
  return (
    <div className="ai-interpretation">
      <h4>AI Interpretation</h4>
      <div className="interpretation-content">
        <span 
          className="category-badge"
          style={{ backgroundColor: `rgba(100, 200, 255, ${interpretation.confidence * 0.5})` }}
        >
          {interpretation.category}
        </span>
        
        <div className="interpretation-details">
          {interpretation.details}
        </div>
        
        <div className="confidence-bar-container">
          <div 
            className="confidence-bar" 
            style={{ 
              width: `${interpretation.confidence * 100}%`,
              backgroundColor: getConfidenceColor(interpretation.confidence)
            }}
          ></div>
          <span className="confidence-label">{Math.round(interpretation.confidence * 100)}%</span>
        </div>
        
        <div className="interpretation-timestamp">
          {formatTimestamp(interpretation.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default AIInterpretation; 