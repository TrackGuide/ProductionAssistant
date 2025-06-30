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
  
  if (!jsonStr) {
    const contextStr = context ? ` for ${context}` : '';
    throw new Error(`Empty response received${contextStr}`);
  }
  
  // Handle various markdown code block formats
  const codeBlockPatterns = [
    /^\s*\n(.*?)\n\s*$/s,          // \n...\n
    /^\s*json\s*\n(.*?)\n\s*$/s,       //  json\n...\n
    /^\s*\n(.*?)\n\s*$/s,              // \n...\n
    /^(\w*)?\s*\n?(.*?)\n?\s*$/s       // General case
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
  
  // Clean common AI response artifacts
  jsonStr = cleanResponseArtifacts(jsonStr);
  
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
export function parseJsonFromAiResponse<T>(rawResponse: string, context?: string): T {
  try {
    const cleanedJson = extractJsonFromResponse(rawResponse, context);
    return JSON.parse(cleanedJson) as T;
  } catch (error) {
    const contextStr = context ? ` for ${context}` : '';
    if (error instanceof Error) {
      // Provide more specific error messages for common JSON parsing issues
      if (error.message.includes('Unexpected token')) {
        throw new Error(`Malformed JSON${contextStr}: ${error.message}. The AI response may contain invalid JSON syntax.`);
      } else if (error.message.includes('Unexpected end of JSON input')) {
        throw new Error(`Incomplete JSON${contextStr}: The AI response appears to be truncated.`);
      } else {
        throw new Error(`Failed to parse JSON${contextStr}: ${error.message}`);
      }
    }
    throw new Error(`Failed to parse JSON${contextStr}: Unknown error`);
  }
}

/**
 * Safely parse JSON with fallback value
 * @param rawResponse - The raw response string from the AI
 * @param fallbackValue - Value to return if parsing fails
 * @param context - Optional context for better error messages
 * @returns Parsed JSON object or fallback value
 */
export function safeParseJsonFromResponse<T>(
  rawResponse: string, 
  fallbackValue: T, 
  context?: string
): T {
  try {
    return parseJsonFromResponse<T>(rawResponse, context);
  } catch (error) {
    const contextStr = context ? ` for ${context}` : '';
    console.warn(`Failed to parse JSON${contextStr}, using fallback:`, error);
    return fallbackValue;
  }
}

/**
 * Validate if a string contains parseable JSON
 * @param jsonString - String to validate
 * @returns True if string can be parsed as JSON
 */
export function isValidJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean common AI response artifacts that interfere with JSON parsing
 * @param responseText - Raw response text
 * @returns Cleaned response text
 */
function cleanResponseArtifacts(responseText: string): string {
  return responseText
    // Remove common AI explanatory prefixes
    .replace(/^(Here's|Here is|The|This is|Below is).*?:/i, '')
    .replace(/^(I'll|Let me|I will).*?:/i, '')
    // Remove trailing explanations after JSON
    .replace(/\n\n.*$/s, '')
    // Remove single line explanations
    .replace(/^.*?(?=\{)/s, '')
    // Clean up excessive whitespace
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

/**
 * Extract multiple JSON objects from a response that may contain several
 * @param rawResponse - The raw response string from the AI
 * @param context - Optional context for better error messages
 * @returns Array of parsed JSON objects
 */
export function extractMultipleJsonFromResponse<T = any>(
  rawResponse: string, 
  context?: string
): T[] {
  const results: T[] = [];
  const jsonObjectPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  
  let match;
  while ((match = jsonObjectPattern.exec(rawResponse)) !== null) {
    try {
      const parsed = JSON.parse(match[0]) as T;
      results.push(parsed);
    } catch (error) {
      // Skip invalid JSON objects but continue processing
      console.warn(`Skipping invalid JSON object in ${context || 'response'}:`, error);
    }
  }
  
  if (results.length === 0) {
    const contextStr = context ? ` for ${context}` : '';
    throw new Error(`No valid JSON objects found${contextStr}`);
  }
  
  return results;
}

/**
 * Parse JSON with schema validation
 * @param rawResponse - The raw response string from the AI
 * @param validator - Function to validate the parsed object
 * @param context - Optional context for better error messages
 * @returns Validated parsed JSON object
 * @throws Error if parsing fails or validation fails
 */
export function parseAndValidateJsonFromResponse<T>(
  rawResponse: string,
  validator: (obj: any) => obj is T,
  context?: string
): T {
  const parsed = parseJsonFromResponse(rawResponse, context);
  
  if (!validator(parsed)) {
    const contextStr = context ? ` for ${context}` : '';
    throw new Error(`Parsed JSON doesn't match expected schema${contextStr}`);
  }
  
  return parsed;
}

/**
 * Repair common JSON syntax issues in AI responses
 * @param jsonString - Potentially malformed JSON string
 * @returns Repaired JSON string
 */
export function repairJsonString(jsonString: string): string {
  return jsonString
    // Fix trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix missing quotes around keys
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // Fix single quotes to double quotes
    .replace(/'/g, '"')
    // Fix escaped quotes that shouldn't be escaped
    .replace(/\\"/g, '"')
    // Remove comments (not valid in JSON)
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}
