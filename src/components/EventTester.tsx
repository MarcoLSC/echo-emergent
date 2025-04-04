import React, { useState } from 'react';
import { useCanvas } from '../context/CanvasContext';

const EventTester: React.FC = () => {
  const { getInteractionStats } = useCanvas();
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({
    keyboardTested: false,
    clickTested: false,
    scrollTested: false,
    pasteTested: false
  });
  
  // Check which interactions have been recorded
  const stats = getInteractionStats();
  const hasKeyboardEvent = stats.byType['keydown'] > 0 || stats.byType['keyup'] > 0;
  const hasClickEvent = stats.byType['click'] > 0;
  const hasScrollEvent = stats.byType['scroll'] > 0;
  const hasPasteEvent = stats.byType['paste'] > 0;
  
  // Update test results if we haven't already marked them as tested
  if (hasKeyboardEvent && !testResults.keyboardTested) {
    setTestResults(prev => ({ ...prev, keyboardTested: true }));
  }
  
  if (hasClickEvent && !testResults.clickTested) {
    setTestResults(prev => ({ ...prev, clickTested: true }));
  }
  
  if (hasScrollEvent && !testResults.scrollTested) {
    setTestResults(prev => ({ ...prev, scrollTested: true }));
  }
  
  if (hasPasteEvent && !testResults.pasteTested) {
    setTestResults(prev => ({ ...prev, pasteTested: true }));
  }
  
  // Check if all tests have passed
  const allPassed = Object.values(testResults).every(val => val === true);
  
  // Only show if there are interactions
  if (stats.total === 0) return null;
  
  return (
    <div className="event-tester">
      <h4>Interaction Tests</h4>
      <ul>
        <li className={testResults.keyboardTested ? 'test-passed' : 'test-pending'}>
          Keyboard Events: {testResults.keyboardTested ? '✓' : '...waiting'}
        </li>
        <li className={testResults.clickTested ? 'test-passed' : 'test-pending'}>
          Click Events: {testResults.clickTested ? '✓' : '...waiting'}
        </li>
        <li className={testResults.scrollTested ? 'test-passed' : 'test-pending'}>
          Scroll Events: {testResults.scrollTested ? '✓' : '...waiting'}
        </li>
        <li className={testResults.pasteTested ? 'test-passed' : 'test-pending'}>
          Paste Events: {testResults.pasteTested ? '✓' : '...waiting'}
        </li>
      </ul>
      
      {allPassed && (
        <div className="all-tests-passed">
          🎉 All interaction types detected! 🎉
        </div>
      )}
    </div>
  );
};

export default EventTester; 