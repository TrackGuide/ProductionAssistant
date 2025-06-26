/**
 * Utility functions for parsing JSON responses from AI that may contain markdown formatting
 */

/**
 * Enhanced JSON extraction from AI responses that may contain markdown code blocks
 * @param rawResponse - The raw response string from the AI
 * @param context - Optional context for better error messages
 * @returns Cleaned JSON string ready for parsing
 * @throws Error if no valid JSON structure is found
 */
export function extractJsonFromResponse(rawResponse: string, context?: string): string {
  let jsonStr = rawResponse.trim();
  
  // Handle various markdown code block formats
  const codeBlockPatterns = [
    /^```json\s*\n(.*?)\n\s*```$/s,          // ```json\n...\n```
    /^```\s*json\s*\n(.*?)\n\s*```$/s,       // ``` json\n...\n```
    /^```\s*\n(.*?)\n\s*```$/s,              // ```\n...\n```
    /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s       // General case
  ];
  
  for (const pattern of codeBlockPatterns) {
    const match = jsonStr.match(pattern);
    if (match) {
      jsonStr = match[match.length - 1].trim(); // Get the last capture group
      break;
    }
  }
  
  // Remove any remaining backticks or markdown artifacts
  jsonStr = jsonStr
    .replace(/^`+/g, '')      // Remove leading backticks
    .replace(/`+$/g, '')      // Remove trailing backticks
    .replace(/^json\s*/i, '') // Remove 'json' language identifier
    .trim();
  
  // Validate we have valid JSON structure
  if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
    const contextStr = context ? ` for ${context}` : '';
    throw new Error(`Response doesn't contain valid JSON structure${contextStr}. Got: ${jsonStr.substring(0, 100)}...`);
  }
  
  return jsonStr;
}

/**
 * Parse JSON from AI response with enhanced error handling
 * @param rawResponse - The raw response string from the AI
 * @param context - Optional context for better error messages
 * @returns Parsed JSON object
 * @throws Error with detailed information if parsing fails
 */
export function parseJsonFromResponse<T = any>(rawResponse: string, context?: string): T {
  try {
    const cleanedJson = extractJsonFromResponse(rawResponse, context);
    return JSON.parse(cleanedJson) as T;
  } catch (error) {
    const contextStr = context ? ` for ${context}` : '';
    if (error instanceof Error) {
      throw new Error(`Failed to parse JSON${contextStr}: ${error.message}`);
    }
    throw new Error(`Failed to parse JSON${contextStr}: Unknown error`);
  }
}
