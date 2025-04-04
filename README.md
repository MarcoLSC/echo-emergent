# Echo Emergent

A responsive, AI-powered interface that evolves and adapts to your interactions.

## Overview

Echo is an experimental interface that demonstrates an organic, living UI that responds to user interactions. It features:

- A responsive background that adapts to user activity and content
- AI-driven interpretation of user input with visual feedback
- Suggestion cards that provide content-aware assistance
- Learning capabilities that improve suggestions over time
- Privacy controls that keep user data on-device

## Features

### Core Components

- **Responsive Canvas**: Tracks and visualizes user interactions in real-time
- **AI Interpretation**: Analyzes text input to determine intent and content type
- **Suggestion Cards**: Dynamic cards that appear with contextual suggestions
- **Adaptive Background**: Background that shifts and evolves based on activity
- **User Preferences**: Learning system that improves suggestions based on past interactions

### Performance Optimizations

- Debounced processing to minimize unnecessary AI calls
- Request Animation Frame for smooth background transitions
- Memoized components for efficient rendering
- Hardware-accelerated animations with transform and opacity
- Adaptive refresh rates based on user activity level
- Collision detection for card placement with minimal reflows

### Fallback Behaviors

- Intelligent caching of AI interpretations for offline use
- Graceful error handling with visual feedback
- Reduced motion support for accessibility
- Progressive enhancement for older browsers

## Technical Details

- Built with React and TypeScript
- Uses context for global state management
- CSS animations for smooth transitions
- Local storage for user preferences

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open your browser to the localhost URL shown in the terminal

## Interactions

- **Type in the input area** to see AI interpretations
- **Click on suggestion cards** to see expanded details
- **Paste text** for immediate analysis
- **Remain idle** to see the background transition to a calmer state
- **Toggle privacy settings** using the lock icon
- **Click the test button** to see your content preferences

## Performance Notes

The application uses various techniques to maintain smooth performance:

- Background updates throttle when the user is idle
- Animations use hardware acceleration where possible
- Heavy computations are deferred when not in the active viewport
- Render optimizations with React.memo for pure components

## Privacy

All data is processed and stored locally in your browser. No information is sent to external servers. User preferences can be cleared at any time through the privacy settings panel.

## Deployment to GitHub Pages

1. Update the `homepage` field in `package.json` with your GitHub username:
   ```json
   "homepage": "https://yourusername.github.io/echo-emergent"
   ```

2. Build and deploy the application:
   ```sh
   npm run deploy
   ```

3. Your application will be available at `https://yourusername.github.io/echo-emergent`

## Project Structure

```
src/
├── components/     # UI components
│   ├── Canvas.tsx              # Main canvas component with event listeners
│   ├── KeyboardDisplay.tsx     # Component to display keyboard events
│   └── PasteDisplay.tsx        # Component to display paste events
├── context/        # React context for state management
│   └── CanvasContext.tsx       # Context for tracking interactions
├── types/          # TypeScript interfaces and types
│   └── index.ts                # Types for interactions and state
├── services/       # Services for AI and user preferences
├── App.tsx         # Main application component
└── main.tsx        # Entry point
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
