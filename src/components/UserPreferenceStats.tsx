import React, { useState, useEffect } from 'react';
import { getUserHistory, IntentCategory } from '../services/userPreferenceService';
import { categoryColors } from './SuggestionCards';

interface UserPreferenceStatsProps {
  showStats?: boolean;
}

const UserPreferenceStats: React.FC<UserPreferenceStatsProps> = ({ showStats = true }) => {
  const [preferences, setPreferences] = useState<Record<IntentCategory, number>>({
    'code': 0,
    'food': 0,
    'creative writing': 0,
    'question': 0,
    'greeting': 0,
    'task': 0,
    'personal': 0,
    'unknown': 0
  });
  const [totalScore, setTotalScore] = useState(0);
  const [dataEnabled, setDataEnabled] = useState(true);
  
  // Load user preferences
  useEffect(() => {
    const updateStats = () => {
      const history = getUserHistory();
      setPreferences(history.categoryPreferences);
      setDataEnabled(history.dataCollectionEnabled);
      
      // Calculate total for percentage
      const total = Object.values(history.categoryPreferences).reduce((sum, val) => sum + val, 0);
      setTotalScore(total);
    };
    
    // Initial load
    updateStats();
    
    // Set interval to refresh data
    const interval = setInterval(updateStats, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!showStats || !dataEnabled || totalScore === 0) return null;
  
  // Sort categories by preference score
  const sortedCategories = Object.entries(preferences)
    .filter(([, score]) => score > 0)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([category]) => category as IntentCategory);
  
  return (
    <div className="user-preferences">
      <h4>Your Content Preferences</h4>
      
      {sortedCategories.length > 0 ? (
        sortedCategories.map(category => {
          const score = preferences[category];
          const percentage = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
          
          return (
            <div key={category}>
              <div className="preference-label">
                <span className="preference-category">{category}</span>
                <span className="preference-score">{percentage}%</span>
              </div>
              <div className="preference-bar">
                <div 
                  className="preference-level"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: categoryColors[category]
                  }}
                />
              </div>
            </div>
          );
        })
      ) : (
        <p>No preferences recorded yet. Interact with suggestions to build your profile.</p>
      )}
    </div>
  );
};

export default UserPreferenceStats; 