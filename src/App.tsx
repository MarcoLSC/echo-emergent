import './App.css'
import { CanvasProvider } from './context/CanvasContext'
import { Canvas } from './components/Canvas'
import KeyboardDisplay from './components/KeyboardDisplay'
import PasteDisplay from './components/PasteDisplay'
import EventTester from './components/EventTester'
import TextInput from './components/TextInput'
import AdaptiveBackground from './components/AdaptiveBackground'
import PrivacyToggle from './components/PrivacyToggle'
import UserPreferenceStats from './components/UserPreferenceStats'
import { useState } from 'react'
import { InterpretationResult } from './services/aiService'

function App() {
  const [clickCount, setClickCount] = useState(0);
  const [interpretation, setInterpretation] = useState<InterpretationResult | null>(null);
  const [showPreferenceStats, setShowPreferenceStats] = useState(false);

  const handleTestButtonClick = () => {
    setClickCount(prev => prev + 1);
    // Toggle preference stats panel for demonstration purposes
    setShowPreferenceStats(prev => !prev);
  };

  const handleInterpretation = (result: InterpretationResult) => {
    setInterpretation(result);
    // We could use interpretation state for other purposes in the future
  };

  return (
    <CanvasProvider>
      <AdaptiveBackground>
        <Canvas>
          <div className="welcome-message">
            <h1>Welcome to Echo</h1>
            <p>An evolving canvas that responds to your interactions.</p>
            
            <button 
              className="test-button" 
              onClick={handleTestButtonClick}
            >
              Click me! ({clickCount})
            </button>
            
            <TextInput onInterpretation={handleInterpretation} />
            
            <p className="instructions">
              Type or paste text above to see visual AI interpretations.
              <br />
              You can also click, scroll, or use keyboard shortcuts.
              <br />
              (Press Alt+S to toggle interaction statistics)
            </p>
            
            {/* Show preference stats conditionally */}
            <UserPreferenceStats showStats={showPreferenceStats} />
          </div>
        </Canvas>
      </AdaptiveBackground>
      <KeyboardDisplay />
      <PasteDisplay onInterpretation={handleInterpretation} />
      <EventTester />
      
      {/* Privacy toggle for data collection */}
      <PrivacyToggle position="bottom-left" />
    </CanvasProvider>
  )
}

export default App
