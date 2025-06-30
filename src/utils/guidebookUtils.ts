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
