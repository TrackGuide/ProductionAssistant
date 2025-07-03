# Migration Guide: Moving from geminiService.ts to ImprovedGeminiService

This guide outlines the steps required to migrate your application from using the old `geminiService.ts` functions to the new structured `ImprovedGeminiService` class, which offers improved error handling, structured prompts, and robust validation.

## Benefits of the New Implementation

- **Robust Error Handling**: Structured error types and consistent error handling
- **Rate Limiting**: Built-in rate limiting to avoid API quota issues
- **Validation**: Response validation to ensure correct data structure
- **Streaming Support**: Better streaming implementation for real-time responses
- **Structured Prompts**: Template-based prompts for consistency
- **Audio Processing**: Improved audio file handling and validation
- **Singleton Pattern**: Efficient API key and instance management

## Migration Steps

### 1. Import the new service

Replace:
```typescript
import { 
  generateGuidebookContent, 
  generateMidiPatternSuggestions, 
  generateMixFeedback 
} from '../services/geminiService';
```

With:
```typescript
import { AI } from '../core/services';
```

### 2. Function Mapping

| Old Function | New Method |
|--------------|------------|
| `generateGuidebookContent` | `AI.generateTrackGuideStream` |
| `generateGuidebookContent` (non-streaming) | `AI.generateTrackGuide` |
| `generateMidiPatternSuggestions` | `AI.generateMidiPatterns` |
| `generateMixFeedback` | `AI.generateMixFeedback` |
| `generateMixFeedbackWithAudio` | `AI.generateMixFeedback` (accepts audioFile) |
| `generateAIAssistantResponse` | `AI.generateAIAssistantResponseStream` |
| `generateAIAssistantResponseSimple` | `AI.generateAIAssistantResponseSimple` |
| `generateRemixGuide` | `AI.generateRemixGuide` |
| `generateRemixGuideStream` | `AI.generateRemixGuideStream` |
| `generateMixComparison` | `AI.generateMixComparison` |
| `generateMixComparisonStream` | `AI.generateMixComparisonStream` |
| `generateReferenceTrackFramework` | `AI.generateSongFramework` |
| `generateStandaloneSongFramework` | `AI.generateSongFramework` (set isStandalone=true) |

### 3. Error Handling

#### Old approach:
```typescript
try {
  const response = await generateGuidebookContent(inputs);
  // Handle response
} catch (error) {
  console.error("Error generating guide:", error);
  setError("Failed to generate guide. Please try again.");
}
```

#### New approach:
```typescript
try {
  const response = await AI.generateTrackGuide(inputs);
  // Handle response
} catch (error) {
  if (error instanceof AppError) {
    // Access structured error info
    console.error(`${error.type}: ${error.message}`);
    setError(error.userMessage);
    
    // Check if we can retry
    if (error.retryable) {
      // Show retry button
    }
  } else {
    console.error("Unknown error:", error);
    setError("An unexpected error occurred. Please try again.");
  }
}
```

### 4. Streaming Responses

#### Old approach:
```typescript
const stream = await generateGuidebookContent(inputs);
for await (const chunk of stream) {
  if (chunk.text) {
    setCurrentContent(prev => prev + chunk.text);
  }
}
```

#### New approach:
```typescript
const stream = AI.generateTrackGuideStream(inputs);
for await (const chunk of stream) {
  if (chunk.text) {
    setCurrentContent(prev => prev + chunk.text);
  }
}
```

### 5. Audio File Handling

#### Old approach:
```typescript
const fileToBase64 = (file) => {
  // Convert file to base64
};

const audioBase64 = await fileToBase64(audioFile);
const response = await generateMixFeedbackWithAudio({
  audioFile: audioBase64,
  // other inputs
});
```

#### New approach:
```typescript
// Just pass the File object directly
const response = await AI.generateMixFeedback({
  audioFile: audioFile, // File object
  // other inputs
});
```

## Troubleshooting

If you encounter issues during migration:

1. Check the error type from `AppError` to understand the specific issue
2. Ensure you're providing all required parameters to the new methods
3. For audio processing, ensure your files meet the size and format requirements
4. If rate limiting issues occur, you may need to adjust the rate limits in `APIRetryService`

For any persistent issues, check the implementation details in `ImprovedGeminiService.ts` and associated validators.
