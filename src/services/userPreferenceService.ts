import { IntentCategory } from './aiService';

export type { IntentCategory } from './aiService';

// Define the structure for user interaction history
export interface UserInteractionHistory {
  categoryPreferences: Record<IntentCategory, number>;
  lastInteractions: Array<{
    category: IntentCategory;
    timestamp: number;
    text?: string;
  }>;
  totalInteractions: number;
  dataCollectionEnabled: boolean;
}

// Default user history
const defaultHistory: UserInteractionHistory = {
  categoryPreferences: {
    'code': 0,
    'food': 0,
    'creative writing': 0,
    'question': 0,
    'greeting': 0,
    'task': 0,
    'personal': 0,
    'unknown': 0
  },
  lastInteractions: [],
  totalInteractions: 0,
  dataCollectionEnabled: true // Default to enabled
};

// Local storage key
const STORAGE_KEY = 'echo_user_preferences';

// Get user history from local storage
export const getUserHistory = (): UserInteractionHistory => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return { ...defaultHistory };
    
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error retrieving user history:', error);
    return { ...defaultHistory };
  }
};

// Save user history to local storage
export const saveUserHistory = (history: UserInteractionHistory): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving user history:', error);
  }
};

// Record a new interaction
export const recordInteraction = (
  category: IntentCategory,
  text?: string,
  isAccepted: boolean = false
): void => {
  // Get current history
  const history = getUserHistory();
  
  // If data collection is disabled, don't record anything
  if (!history.dataCollectionEnabled) return;
  
  // Update category preferences
  history.categoryPreferences[category] = (history.categoryPreferences[category] || 0) + (isAccepted ? 2 : 1);
  
  // Add to recent interactions
  const newInteraction = {
    category,
    timestamp: Date.now(),
    text: text?.slice(0, 100) // Limit text length to avoid excessive storage
  };
  
  history.lastInteractions.unshift(newInteraction);
  
  // Keep only the last 20 interactions
  if (history.lastInteractions.length > 20) {
    history.lastInteractions = history.lastInteractions.slice(0, 20);
  }
  
  // Update total count
  history.totalInteractions += 1;
  
  // Save updated history
  saveUserHistory(history);
};

// Toggle data collection preference
export const toggleDataCollection = (): boolean => {
  const history = getUserHistory();
  history.dataCollectionEnabled = !history.dataCollectionEnabled;
  
  // If disabled, clear all data
  if (!history.dataCollectionEnabled) {
    history.categoryPreferences = { ...defaultHistory.categoryPreferences };
    history.lastInteractions = [];
    history.totalInteractions = 0;
  }
  
  saveUserHistory(history);
  return history.dataCollectionEnabled;
};

// Clear all user history
export const clearUserHistory = (): void => {
  saveUserHistory({ ...defaultHistory });
};

// Get preferred categories sorted by preference score
export const getPreferredCategories = (): IntentCategory[] => {
  const history = getUserHistory();
  
  return Object.entries(history.categoryPreferences)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([category]) => category as IntentCategory);
};

// Adjust confidence scores based on user history
export const adjustConfidenceByUserPreference = (
  scores: Record<IntentCategory, number>
): Record<IntentCategory, number> => {
  const history = getUserHistory();
  
  // If data collection is disabled or no interactions yet, return original scores
  if (!history.dataCollectionEnabled || history.totalInteractions === 0) {
    return scores;
  }
  
  const adjustedScores = { ...scores };
  const totalPreferenceScore = Object.values(history.categoryPreferences).reduce((sum, score) => sum + score, 0);
  
  // Only adjust if we have enough data
  if (totalPreferenceScore > 5) {
    Object.keys(adjustedScores).forEach(category => {
      const preferenceWeight = history.categoryPreferences[category as IntentCategory] / totalPreferenceScore;
      // Adjust by at most 30% based on user preferences
      adjustedScores[category as IntentCategory] += scores[category as IntentCategory] * preferenceWeight * 0.3;
    });
  }
  
  return adjustedScores;
}; 