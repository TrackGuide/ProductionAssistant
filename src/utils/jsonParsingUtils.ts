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
    /^```json\s*\n([\s\S]*?)\n\s*```$/s,          // ```json\n...\n```
    /^```\s*json\s*\n([\s\S]*?)\n\s*```$/s,       // ``` json\n...\n```
    /^```\s*\n([\s\S]*?)\n\s*```$/s,              // ```\n...\n```
    /^```(\w*)?\s*\n?([\s\S]*?)\n?\s*```$/s       // General case
  ];
  for (const pattern of codeBlockPatterns) {
    const match = jsonStr.match(pattern);
    if (match) {
      jsonStr = match[match.length - 1].trim();
      break;
    }
  }
  // Remove any remaining backticks or markdown artifacts
  jsonStr = jsonStr
    .replace(/^`+/g, '')
    .replace(/`+$/g, '')
    .replace(/^json\s*/i, '')
    .trim();

  // Validate we have valid JSON structure
  if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
    // Fallback: try to extract the first {...} JSON object from anywhere in the string
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    } else {
      throw new Error(`${contextName} doesn't contain valid JSON structure. Got: ${jsonStr.substring(0, 100)}...`);
    }
  }
  return jsonStr;
};

/**
 * Parses AI-generated MIDI patterns with enhanced error handling and fallback
 * @param rawResponse - The raw response string from the AI
 * @param contextName - Optional context name for error messages
 * @param fallback - Optional fallback value to return if parsing fails
 * @returns Parsed GeneratedMidiPatterns object or fallback
 * @throws Error with descriptive message if parsing fails and no fallback is provided
 */
export const parseAiMidiResponse = <T = any>(rawResponse: string, contextName: string = 'MIDI generation', fallback?: T): T => {
  try {
    const cleanedJson = extractJsonFromAiResponse(rawResponse, contextName);
    return JSON.parse(cleanedJson) as T;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    // Try to extract the first {...} block as a last resort
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {}
    }
    if (fallback !== undefined) {
      return fallback;
    }
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
