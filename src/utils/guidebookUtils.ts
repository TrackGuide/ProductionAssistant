// Utility functions for Guidebook parsing

/**
 * Extracts BPM from guidebook content. Returns the average if a range is found.
 */
export const parseBpmFromGuidebook = (content: string): number | null => {
  // Try multiple patterns for BPM detection
  const patterns = [
    /Tempo.*?(\d+)\s*(?:-|to)\s*(\d+)\s*BPM/i,
    /BPM.*?(\d+)\s*(?:-|to)\s*(\d+)/i,
    /(\d+)\s*(?:-|to)\s*(\d+)\s*BPM/i,
    /Tempo.*?(\d+)\s*BPM/i,
    /BPM.*?(\d+)/i,
    /(\d+)\s*BPM/i
  ];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      if (match[2]) {
        // Range found, return average
        return (parseInt(match[1], 10) + parseInt(match[2], 10)) / 2;
      }
      return parseInt(match[1], 10);
    }
  }
  return null;
};

/**
 * Extracts chord progression from guidebook content.
 */
export const parseChordProgressionFromGuidebook = (content: string): string | null => {
  // Enhanced chord progression detection patterns
  const patterns = [
    /Chord Progression\(s\)?\s*(?:\([^)]+\))?:\s*([^\n]+)/i,
    /Progression\(s\)?:\s*([^\n]+)/i,
    /Chords?:\s*([ivclxmdIVCLXMDab#ø°dimaug\d\/sus-][^\n]*)/i,
    /([ivclxmdIVCLXMD]+(?:\s*-\s*[ivclxmdIVCLXMD]+){2,})/i // Roman numeral pattern
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const progressionsText = match[1];
      const firstProgMatch = progressionsText.match(/([ivclxmdIVCLXMDab#ø°dimaug\d\/sus-]+(?:\s*-\s*[ivclxmdIVCLXMDab#ø°dimaug\d\/sus-]+)*)/);
      if (firstProgMatch && firstProgMatch[1]) {
        let progression = firstProgMatch[1].trim();
        if (progression.endsWith('.')) progression = progression.slice(0, -1);
        // Clean up common separators
        const commonSeparators = [', ', '. ', '; '];
        for (const sep of commonSeparators) {
          if (progression.includes(sep)) {
            progression = progression.split(sep)[0].trim();
            break;
          }
        }
        return progression;
      }
    }
  }
  return null;
};

/**
 * Extracts a section's content from markdown text using a section title regex.
 */
export const extractSectionContent = (markdownText: string, sectionTitleRegex: RegExp): string => {
  const match = markdownText.match(sectionTitleRegex);
  if (!match || typeof match.index === 'undefined') return "";
  const startIndex = match.index;
  const nextSectionMatch = markdownText.substring(startIndex + match[0].length).match(/^##\s+/m);
  const endIndex = nextSectionMatch && typeof nextSectionMatch.index !== 'undefined' 
                   ? startIndex + match[0].length + nextSectionMatch.index 
                   : markdownText.length;
  return markdownText.substring(startIndex, endIndex).trim();
};

/**
 * Extracts essential MIDI context from guidebook content.
 */
export const extractEssentialMidiContext = (guidebookContent: string): string => {
  if (!guidebookContent) return "";
  let essentialContext = "";
  const overviewSectionRegex = /^##\s*1\.\s*Song Overview/im;
  essentialContext += extractSectionContent(guidebookContent, overviewSectionRegex) + "\n\n";
  const harmonySectionRegex = /^##\s*4\.\s*Harmony, Melody & Rhythmic Core/im;
  essentialContext += extractSectionContent(guidebookContent, harmonySectionRegex);
  return essentialContext.trim() || "General musical context not fully parsed. Focus on genre and vibe.";
};

/**
 * Parses a suggested title from markdown stream.
 */
export const parseSuggestedTitleFromMarkdownStream = (markdownText: string): string | null => {
  const match = markdownText.match(/^\s*-\s*\*\*Suggested Title:\*\*\s*(.*)/im);
  if (match && match[1]) {
    return match[1].trim().replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
  }
  return null;
};

/**
 * Extracts key signature from guidebook content
 */
export const parseKeyFromGuidebook = (content: string): string | null => {
  const patterns = [
    /Key\s*(?:Signature)?:\s*([A-G][#b]?\s*(?:major|minor|maj|min))/i,
    /(?:In|Key of)\s+([A-G][#b]?\s*(?:major|minor|maj|min))/i,
    /([A-G][#b]?)\s*(major|minor|maj|min)/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
};

/**
 * Extracts time signature from guidebook content
 */
export const parseTimeSignatureFromGuidebook = (content: string): string | null => {
  const patterns = [
    /Time\s*Signature:\s*(\d+\/\d+)/i,
    /(\d+\/\d+)\s*time/i,
    /in\s+(\d+\/\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

/**
 * Extracts genre information from guidebook content
 */
export const parseGenreFromGuidebook = (content: string): string | null => {
  const patterns = [
    /Genre:\s*([^\n]+)/i,
    /Style:\s*([^\n]+)/i,
    /Musical\s*Style:\s*([^\n]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/[.,;]$/, '');
    }
  }
  return null;
};

/**
 * Extracts mood/vibe information from guidebook content
 */
export const parseVibeFromGuidebook = (content: string): string | null => {
  const patterns = [
    /Vibe:\s*([^\n]+)/i,
    /Mood:\s*([^\n]+)/i,
    /Feel:\s*([^\n]+)/i,
    /Energy:\s*([^\n]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/[.,;]$/, '');
    }
  }
  return null;
};

/**
 * Extracts all sections from a markdown guidebook
 */
export const extractAllSections = (markdownText: string): Record<string, string> => {
  const sections: Record<string, string> = {};
  const sectionRegex = /^##\s+(.+?)$/gm;
  let match;
  
  while ((match = sectionRegex.exec(markdownText)) !== null) {
    const sectionTitle = match[1].trim();
    const sectionContent = extractSectionContent(markdownText, new RegExp(`^##\\s+${sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'im'));
    sections[sectionTitle] = sectionContent;
  }
  
  return sections;
};

/**
 * Extracts instrument list from guidebook content
 */
export const parseInstrumentsFromGuidebook = (content: string): string[] => {
  const instruments: string[] = [];
  const patterns = [
    /Instruments?:\s*([^\n]+)/i,
    /Instrumentation:\s*([^\n]+)/i,
    /Track\s*List:\s*([^\n]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const instrumentText = match[1];
      // Split by common separators and clean up
      const splitInstruments = instrumentText
        .split(/[,;]/)
        .map(inst => inst.trim())
        .filter(inst => inst.length > 0);
      instruments.push(...splitInstruments);
      break;
    }
  }
  
  return instruments;
};

/**
 * Extracts arrangement structure from guidebook content
 */
export const parseArrangementFromGuidebook = (content: string): string[] => {
  const arrangement: string[] = [];
  const patterns = [
    /(?:Song\s*)?Structure:\s*([^\n]+)/i,
    /Arrangement:\s*([^\n]+)/i,
    /Form:\s*([^\n]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const structureText = match[1];
      // Split by common separators and clean up
      const sections = structureText
        .split(/[-,>]/)
        .map(section => section.trim())
        .filter(section => section.length > 0);
      arrangement.push(...sections);
      break;
    }
  }
  
  return arrangement;
};

/**
 * Creates a summary object from guidebook content
 */
export const createGuidebookSummary = (content: string): {
  bpm: number | null;
  key: string | null;
  timeSignature: string | null;
  genre: string | null;
  vibe: string | null;
  chordProgression: string | null;
  instruments: string[];
  arrangement: string[];
} => {
  return {
    bpm: parseBpmFromGuidebook(content),
    key: parseKeyFromGuidebook(content),
    timeSignature: parseTimeSignatureFromGuidebook(content),
    genre: parseGenreFromGuidebook(content),
    vibe: parseVibeFromGuidebook(content),
    chordProgression: parseChordProgressionFromGuidebook(content),
    instruments: parseInstrumentsFromGuidebook(content),
    arrangement: parseArrangementFromGuidebook(content)
  };
};

/**
 * Validates if content appears to be a valid guidebook
 */
export const isValidGuidebook = (content: string): boolean => {
  if (!content || content.trim().length < 100) return false;
  
  // Check for common guidebook markers
  const hasMarkdownHeaders = /^##\s+/m.test(content);
  const hasMusicalContent = /(?:bpm|tempo|chord|key|genre|style)/i.test(content);
  const hasStructure = content.split('\n').length > 10;
  
  return hasMarkdownHeaders && hasMusicalContent && hasStructure;
};

/**
 * Cleans and formats guidebook content for display
 */
export const formatGuidebookContent = (content: string): string => {
  return content
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Remove excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    // Clean up spacing around headers
    .replace(/^##\s+/gm, '## ')
    // Ensure proper spacing after headers
    .replace(/^(##.+)$/gm, '$1\n')
    // Trim whitespace
    .trim();
};
