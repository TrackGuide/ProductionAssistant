/**
 * Utility functions for parsing AI-generated JSON responses
 * Handles various markdown code block formats and cleans up JSON strings
 */

// Type definitions for MIDI patterns
export interface GeneratedMidiPatterns {
  drums?: {
    kick?: number[];
    snare?: number[];
    hihat?: number[];
    openhat?: number[];
    crash?: number[];
  };
  bass?: {
    notes?: string[];
    pattern?: number[];
    octave?: number;
  };
  melody?: {
    notes?: string[];
    pattern?: number[];
    octave?: number;
  };
  chords?: {
    progression?: string[];
    pattern?: number[];
    voicing?: string;
  };
  tempo?: number;
  timeSignature?: string;
  key?: string;
  scale?: string;
}

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

/**
 * Parses MIDI patterns specifically with validation for expected structure
 * @param rawResponse - The raw response string from the AI
 * @param contextName - Optional context name for error messages
 * @returns Parsed and validated GeneratedMidiPatterns object
 * @throws Error with descriptive message if parsing or validation fails
 */
export const parseMidiPatternsFromAiResponse = (rawResponse: string, contextName: string = 'MIDI patterns'): GeneratedMidiPatterns => {
  try {
    const parsed = parseAiMidiResponse<GeneratedMidiPatterns>(rawResponse, contextName);
    
    // Validate the structure has at least some expected properties
    const hasValidStructure = (
      parsed && 
      typeof parsed === 'object' && 
      (parsed.drums || parsed.bass || parsed.melody || parsed.chords || parsed.tempo)
    );
    
    if (!hasValidStructure) {
      throw new Error(`${contextName} response doesn't contain expected MIDI pattern structure`);
    }
    
    // Provide defaults for missing essential properties
    const validatedPatterns: GeneratedMidiPatterns = {
      tempo: parsed.tempo || 120,
      timeSignature: parsed.timeSignature || '4/4',
      key: parsed.key || 'C',
      scale: parsed.scale || 'major',
      ...parsed
    };
    
    return validatedPatterns;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    throw new Error(`Failed to parse MIDI patterns: ${errorMessage}`);
  }
};

/**
 * Safely parses any AI JSON response with fallback handling
 * @param rawResponse - The raw response string from the AI
 * @param fallbackValue - Value to return if parsing fails
 * @param contextName - Optional context name for error messages
 * @returns Parsed object or fallback value
 */
export const safeParseAiResponse = <T = any>(
  rawResponse: string, 
  fallbackValue: T, 
  contextName: string = 'AI response'
): T => {
  try {
    return parseAiMidiResponse<T>(rawResponse, contextName);
  } catch (error) {
    console.warn(`Failed to parse ${contextName}, using fallback:`, error);
    return fallbackValue;
  }
};

/**
 * Validates if a string contains valid JSON structure
 * @param jsonString - String to validate
 * @returns boolean indicating if string is valid JSON
 */
export const isValidJsonString = (jsonString: string): boolean => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
};

/**
 * Cleans common AI response artifacts from JSON strings
 * @param jsonString - Raw JSON string from AI
 * @returns Cleaned JSON string
 */
export const cleanAiJsonArtifacts = (jsonString: string): string => {
  return jsonString
    // Remove common AI explanatory text
    .replace(/^(Here's|Here is|The|This is).*?:/i, '')
    // Remove trailing explanations
    .replace(/\n\n.*$/s, '')
    // Clean up whitespace
    .trim();
};
