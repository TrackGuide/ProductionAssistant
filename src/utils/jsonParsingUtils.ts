/**
 * Utility functions for parsing AI-generated JSON responses
 * Handles various markdown code block formats and cleans up JSON strings
 */

/**
 * Extracts and cleans JSON from AI responses that may contain markdown formatting
 * @param rawResponse - The raw response string from the AI
 * @param contextName - Optional context name for error messages
 * @returns Cleaned JSON string ready for parsing
 * @throws Error if no valid JSON structure is found
 */
export const extractJsonFromAiResponse = (rawResponse: string, contextName: string = 'AI response'): string => {
  let jsonStr = rawResponse.trim();
  
  if (!jsonStr) {
    throw new Error(`Empty ${contextName} received`);
  }
  
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
    throw new Error(`${contextName} doesn't contain valid JSON structure. Got: ${jsonStr.substring(0, 100)}...`);
  }
  
  return jsonStr;
};

/**
 * Parses AI-generated MIDI patterns with enhanced error handling
 * @param rawResponse - The raw response string from the AI
 * @param contextName - Optional context name for error messages
 * @returns Parsed GeneratedMidiPatterns object
 * @throws Error with descriptive message if parsing fails
 */
export const parseAiMidiResponse = <T = any>(rawResponse: string, contextName: string = 'MIDI generation'): T => {
  try {
    const cleanedJson = extractJsonFromAiResponse(rawResponse, contextName);
    return JSON.parse(cleanedJson) as T;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    
    // Provide more specific error messages for common issues
    if (errorMessage.includes('Unexpected token')) {
      if (errorMessage.includes('`')) {
        throw new Error(`AI returned invalid JSON for ${contextName}. (${errorMessage}) The response likely contains markdown formatting that wasn't properly cleaned.`);
      } else {
        throw new Error(`AI returned malformed JSON for ${contextName}. (${errorMessage})`);
      }
    }
    
    throw new Error(`Failed to parse ${contextName} response: ${errorMessage}`);
  }
};
