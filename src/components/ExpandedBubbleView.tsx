import React, { useState } from 'react';
import { IntentCategory } from '../services/aiService';

interface ExpandedBubbleViewProps {
  category: IntentCategory;
  confidence: number;
  text: string;
  onClose: () => void;
}

// Secondary suggestions for each category
const getSecondarySuggestions = (category: IntentCategory): string[] => {
  switch(category) {
    case 'code':
      return [
        'Fix syntax errors',
        'Optimize algorithm',
        'Convert to another language',
        'Explain code functionality'
      ];
    case 'food':
      return [
        'Find similar recipes',
        'See nutritional information',
        'Suggest ingredient substitutions',
        'Find wine pairings'
      ];
    case 'creative writing':
      return [
        'Improve character development',
        'Generate plot ideas',
        'Refine dialogue',
        'Edit for clarity'
      ];
    case 'question':
      return [
        'Search for answers',
        'Rephrase question',
        'See related questions',
        'Ask follow-up questions'
      ];
    case 'greeting':
      return [
        'Start a conversation',
        'Set preferences',
        'See command options',
        'Create a new project'
      ];
    case 'task':
      return [
        'Create subtasks',
        'Set deadline',
        'Assign priority',
        'Find related tasks'
      ];
    case 'personal':
      return [
        'Analyze sentiment',
        'Suggest responses',
        'Find related topics',
        'Save for later reference'
      ];
    default:
      return [
        'Tell me more',
        'Clarify your intent',
        'See examples',
        'Try another approach'
      ];
  }
};

// Category-specific content and examples
const getCategoryContent = (category: IntentCategory): { title: string; description: string } => {
  switch(category) {
    case 'code':
      return {
        title: 'Code Assistance',
        description: 'I can help with coding tasks like debugging, optimization, and documentation.'
      };
    case 'food':
      return {
        title: 'Culinary Assistance',
        description: 'I can help with recipes, cooking techniques, ingredient substitutions, and more.'
      };
    case 'creative writing':
      return {
        title: 'Creative Writing Support',
        description: 'I can help with storylines, character development, dialogue, and editing.'
      };
    case 'question':
      return {
        title: 'Question Answering',
        description: 'I can help answer questions, find information, or suggest related topics.'
      };
    case 'greeting':
      return {
        title: 'Welcome!',
        description: 'I\'m here to assist you with a variety of tasks. What would you like to do?'
      };
    case 'task':
      return {
        title: 'Task Management',
        description: 'I can help organize, prioritize, and manage your tasks and projects.'
      };
    case 'personal':
      return {
        title: 'Personal Assistant',
        description: 'I can help with personal matters, provide feedback, or just listen.'
      };
    default:
      return {
        title: 'I\'m Not Sure',
        description: 'Can you tell me more about what you\'re looking for?'
      };
  }
};

const ExpandedBubbleView: React.FC<ExpandedBubbleViewProps> = ({ 
  category, 
  confidence, 
  text, 
  onClose 
}) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const secondarySuggestions = getSecondarySuggestions(category);
  const categoryContent = getCategoryContent(category);
  
  const handleSecondaryClick = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
    console.log(`Secondary suggestion clicked: ${suggestion}`);
    // In a real implementation, this would trigger an action
    // like sending the suggestion to the AI
  };
  
  return (
    <>
      <button className="close-button" onClick={onClose}>×</button>
      
      <div className="expanded-header">
        <h3>{categoryContent.title}</h3>
        <div className="confidence-indicator">
          <div 
            className="confidence-level" 
            style={{ width: `${confidence * 100}%` }}
          />
          <span>{Math.round(confidence * 100)}% confidence</span>
        </div>
      </div>
      
      <div className="expanded-content">
        <p className="original-text">{text}</p>
        <p className="category-description">{categoryContent.description}</p>
        
        <div className="expanded-suggestions">
          <h4>Suggested Actions</h4>
          <div className="suggestion-buttons">
            {secondarySuggestions.map((suggestion, index) => (
              <button 
                key={index} 
                className={`secondary-suggestion ${selectedSuggestion === suggestion ? 'selected' : ''}`}
                onClick={() => handleSecondaryClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
          
          {selectedSuggestion && (
            <div className="suggestion-response">
              <p>You selected: <strong>{selectedSuggestion}</strong></p>
              <p>In a full implementation, this would trigger an AI response related to your selection.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="expanded-footer">
        <p>Click outside to close or press ESC</p>
      </div>
    </>
  );
};

export default ExpandedBubbleView; 