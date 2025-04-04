// Mock AI interpretation function
// This can be replaced with a real API call to OpenAI or other LLM service
import { adjustConfidenceByUserPreference } from './userPreferenceService';

// Basic categories for classification
export type IntentCategory = 
  | 'code' 
  | 'food' 
  | 'creative writing' 
  | 'question' 
  | 'greeting' 
  | 'task' 
  | 'personal' 
  | 'unknown';

export interface InterpretationResult {
  category: IntentCategory;
  confidence: number;
  details?: string;
  timestamp: number;
}

// Cache for recent interpretations
const interpretationCache: Record<string, InterpretationResult> = {};
const MAX_CACHE_SIZE = 20;
const cacheKeys: string[] = [];

// Helper patterns for basic mock classification
const patterns = {
  code: /function|const|var|let|if|else|for|while|class|import|export|return|=>|{|}|\[|\]|</i,
  food: /ingredient|recipe|cook|bake|food|eat|drink|meal|dinner|lunch|breakfast|restaurant/i,
  creativeWriting: /story|novel|poem|creative|write|character|plot|scene|setting|narrative/i,
  question: /\?|how|what|when|where|why|who|which|can you|could you/i,
  greeting: /hello|hi|hey|good morning|good afternoon|good evening|greetings|welcome/i,
  task: /todo|task|reminder|schedule|plan|organize|list|create|make|build|develop|implement/i,
  personal: /I feel|I think|I want|I need|my|I'm|I am|I've|I have/i
};

// Add an interpretation to the cache
const cacheInterpretation = (text: string, result: InterpretationResult): void => {
  // Generate cache key from first 50 chars of text
  const cacheKey = text.slice(0, 50);
  
  // Check if key already exists
  if (!interpretationCache[cacheKey]) {
    // Add to cache keys list for LRU tracking
    cacheKeys.push(cacheKey);
    
    // If cache is full, remove oldest entry
    if (cacheKeys.length > MAX_CACHE_SIZE) {
      const oldestKey = cacheKeys.shift();
      if (oldestKey) {
        delete interpretationCache[oldestKey];
      }
    }
  }
  
  // Store in cache
  interpretationCache[cacheKey] = result;
};

// Try to get an interpretation from cache
const getCachedInterpretation = (text: string): InterpretationResult | null => {
  const cacheKey = text.slice(0, 50);
  return interpretationCache[cacheKey] || null;
};

// Mock interpretation with simulated failures
const mockInterpretText = (text: string): Promise<InterpretationResult> => {
  return new Promise((resolve, reject) => {
    const normalizedText = text.trim().toLowerCase();
    
    // Simulate occasional failures (5% chance)
    if (Math.random() < 0.05) {
      return reject(new Error("Simulated interpretation failure"));
    }
    
    if (!normalizedText) {
      return resolve({
        category: 'unknown',
        confidence: 0,
        timestamp: Date.now()
      });
    }
    
    // First check if we have it in cache for instant response
    const cachedResult = getCachedInterpretation(normalizedText);
    if (cachedResult) {
      // Update the timestamp to keep it fresh
      return resolve({
        ...cachedResult,
        timestamp: Date.now()
      });
    }
    
    // Check each pattern and assign confidence scores
    const scores: Record<IntentCategory, number> = {
      code: 0,
      food: 0,
      'creative writing': 0,
      question: 0,
      greeting: 0,
      task: 0,
      personal: 0,
      unknown: 0.1 // Default small confidence
    };
    
    // Simple pattern matching to assign confidence scores
    if (patterns.code.test(normalizedText)) {
      scores.code = 0.3 + (normalizedText.match(patterns.code)?.length || 0) * 0.1;
    }
    
    if (patterns.food.test(normalizedText)) {
      scores.food = 0.3 + (normalizedText.match(patterns.food)?.length || 0) * 0.1;
    }
    
    if (patterns.creativeWriting.test(normalizedText)) {
      scores['creative writing'] = 0.3 + (normalizedText.match(patterns.creativeWriting)?.length || 0) * 0.1;
    }
    
    if (patterns.question.test(normalizedText)) {
      scores.question = 0.3 + (normalizedText.match(patterns.question)?.length || 0) * 0.1;
    }
    
    if (patterns.greeting.test(normalizedText)) {
      scores.greeting = 0.4 + (normalizedText.match(patterns.greeting)?.length || 0) * 0.1;
    }
    
    if (patterns.task.test(normalizedText)) {
      scores.task = 0.3 + (normalizedText.match(patterns.task)?.length || 0) * 0.1;
    }
    
    if (patterns.personal.test(normalizedText)) {
      scores.personal = 0.3 + (normalizedText.match(patterns.personal)?.length || 0) * 0.1;
    }
    
    // Adjust scores based on user history and preferences
    const adjustedScores = adjustConfidenceByUserPreference(scores);
    
    // Find the category with the highest confidence
    let topCategory: IntentCategory = 'unknown';
    let topConfidence = 0;
    
    Object.entries(adjustedScores).forEach(([category, confidence]) => {
      if (confidence > topConfidence) {
        topCategory = category as IntentCategory;
        topConfidence = confidence;
      }
    });
    
    // Cap confidence at 0.95
    topConfidence = Math.min(topConfidence, 0.95);
    
    const result = {
      category: topCategory,
      confidence: topConfidence,
      details: generateDetails(normalizedText, topCategory),
      timestamp: Date.now()
    };
    
    // Cache the result for future use
    cacheInterpretation(normalizedText, result);
    
    // Simulate network delay for realism (50-300ms)
    setTimeout(() => resolve(result), Math.random() * 250 + 50);
  });
};

// Generate additional details based on category
const generateDetails = (text: string, category: IntentCategory): string => {
  switch(category) {
    case 'code':
      return text.length > 20 
        ? 'Looks like programming or markup code' 
        : 'Possibly a programming-related term';
    case 'food':
      return 'Content related to food or cooking';
    case 'creative writing':
      return 'Appears to be creative or narrative text';
    case 'question':
      return 'This seems to be a question or inquiry';
    case 'greeting':
      return 'A conversational greeting';
    case 'task':
      return 'Task or planning related content';
    case 'personal':
      return 'Personal or emotional expression';
    default:
      return 'Unclear context';
  }
};

// For use with real APIs like OpenAI
const interpretWithExternalAPI = async (text: string): Promise<InterpretationResult> => {
  // This would be replaced with an actual API call
  console.log('Would call external API with:', text);
  
  // For now, just use our mock function
  return mockInterpretText(text);
};

// Debounced function to avoid spamming the AI
let debounceTimer: ReturnType<typeof setTimeout>;
export const interpretTextWithDebounce = (
  text: string, 
  callback: (result: InterpretationResult) => void,
  errorCallback?: (error: string) => void,
  debounceMs = 500
): void => {
  clearTimeout(debounceTimer);
  
  debounceTimer = setTimeout(async () => {
    try {
      // Try to get from cache first for immediate feedback
      const cachedResult = getCachedInterpretation(text);
      if (cachedResult) {
        // Immediately return cached result
        callback({...cachedResult, timestamp: Date.now()});
        
        // Still make the request to update the cache in background
        try {
          const freshResult = await mockInterpretText(text);
          callback(freshResult);
        } catch (error) {
          // If background refresh fails, we already showed cached result, so no need to notify
          console.log('Background refresh failed, using cached result');
        }
        return;
      }
      
      // No cache hit, make the request
      const result = await mockInterpretText(text);
      callback(result);
    } catch (error) {
      console.error('Error interpreting text:', error);
      if (errorCallback) {
        errorCallback(error instanceof Error ? error.message : 'Error processing text');
      } else {
        // Fallback with unknown category if no error handler
        callback({
          category: 'unknown',
          confidence: 0.1,
          details: 'Error processing text',
          timestamp: Date.now()
        });
      }
    }
  }, debounceMs);
}; 