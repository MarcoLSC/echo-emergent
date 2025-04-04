import React, { useState, useEffect } from 'react';
import { getUserHistory, toggleDataCollection, clearUserHistory } from '../services/userPreferenceService';

interface PrivacyToggleProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

const PrivacyToggle: React.FC<PrivacyToggleProps> = ({ position = 'bottom-left' }) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  
  // Get initial state from local storage
  useEffect(() => {
    const history = getUserHistory();
    setIsEnabled(history.dataCollectionEnabled);
  }, []);
  
  const handleToggle = () => {
    const newState = toggleDataCollection();
    setIsEnabled(newState);
  };
  
  const handleClearData = () => {
    clearUserHistory();
    // Ensure the toggle is set correctly after clearing
    setIsEnabled(getUserHistory().dataCollectionEnabled);
  };
  
  return (
    <div className={`privacy-toggle ${position}`}>
      <div 
        className="privacy-icon" 
        onClick={() => setShowDetails(!showDetails)}
        title="Privacy settings"
      >
        🔒
      </div>
      
      {showDetails && (
        <div className="privacy-panel">
          <h4>Privacy Settings</h4>
          
          <div className="toggle-container">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={handleToggle}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">
              Learning & Personalization
            </span>
          </div>
          
          <p className="privacy-description">
            {isEnabled 
              ? "Echo is learning from your interactions to provide better suggestions."
              : "Echo is not collecting data or personalizing suggestions."
            }
          </p>
          
          <div className="privacy-actions">
            <button 
              className="clear-data-button"
              onClick={handleClearData}
              disabled={!isEnabled}
            >
              Clear My Data
            </button>
          </div>
          
          <p className="privacy-note">
            Your data stays on your device and is never sent to a server.
          </p>
          
          <button
            className="close-button privacy-close"
            onClick={() => setShowDetails(false)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default PrivacyToggle; 