export const parseBpmFromGuidebook = (content: string): number | null => {
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
        return Math.round((parseInt(match[1], 10) + parseInt(match[2], 10)) / 2);
      } else if (match[1]) {
        return parseInt(match[1], 10);
      }
    }
  }
  return null;
};

export const parseKeyFromGuidebook = (content: string, MIDI_SCALES: string[]): string | null => {
  const patterns = [
    /Suggested Key\(s\) \/ Scale\(s\):\s*([^(\n]+)/i,
    /Key.*?:\s*([A-G][#b]?\s*(?:Major|Minor|major|minor))/i,
    /([A-G][#b]?\s*(?:Major|Minor|major|minor))/i
  ];
  
  for (const pattern of patterns) {
    const keyMatch = content.match(pattern);
    if (keyMatch && keyMatch[1]) {
      const keys = keyMatch[1].split(/,|\/| or /).map(k => k.trim().replace(/\.$/, ''));
      for (const k of keys) {
        const normalizedKey = k.includes(" Minor") || k.includes(" minor") ? 
          k.replace(/minor/i, "Minor") : 
          k.replace(/major/i, "Major").replace(/Major$/, "").trim() + " Major";
        
        if (MIDI_SCALES.includes(k) || MIDI_SCALES.includes(normalizedKey)) {
          return MIDI_SCALES.includes(k) ? k : normalizedKey;
        }
      }
      
      const firstKey = keys[0];
      if (firstKey) {
        for (const scale of MIDI_SCALES) {
          if (firstKey.toLowerCase().startsWith(scale.split(' ')[0].toLowerCase())) {
            if (firstKey.toLowerCase().includes('minor')) {
              if (scale.includes('Minor')) return scale;
            } else {
              if (scale.includes('Major')) return scale;
            }
          }
        }
        return firstKey; 
      }
    }
  }
  return null;
};

export const parseChordProgressionFromGuidebook = (content: string): string | null => {
  const patterns = [
    /Chord Progression\(s\)?\s*(?:\([^)]+\))?:\s*([^\n]+)/i,
    /Progression\(s\)?:\s*([^\n]+)/i,
    /Chords?:\s*([ivclxmdIVCLXMDab#ø°dimaug\d\/sus-][^\n]*)/i,
    /([ivclxmdIVCLXMD]+(?:\s*-\s*[ivclxmdIVCLXMD]+){2,})/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const progressionsText = match[1];
      const firstProgMatch = progressionsText.match(/([ivclxmdIVCLXMDab#ø°dimaug\d\/sus-]+(?:\s*-\s*[ivclxmdIVCLXMDab#ø°dimaug\d\/sus-]+)*)/);
      if (firstProgMatch && firstProgMatch[1]) {
        let progression = firstProgMatch[1].trim();
        if (progression.endsWith('.')) progression = progression.slice(0, -1);
        
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

export const extractEssentialMidiContext = (guidebookContent: string): string => {
  if (!guidebookContent) return "";
  
  let essentialContext = "";

  const overviewSectionRegex = /^##\s*1\.\s*Song Overview/im;
  essentialContext += extractSectionContent(guidebookContent, overviewSectionRegex) + "\n\n";
  
  const harmonySectionRegex = /^##\s*4\.\s*Harmony, Melody & Rhythmic Core/im;
  essentialContext += extractSectionContent(guidebookContent, harmonySectionRegex);
  
  return essentialContext.trim() || "General musical context not fully parsed. Focus on genre and vibe.";
};

export const parseSuggestedTitleFromMarkdownStream = (markdownText: string): string | null => {
  const match = markdownText.match(/^\s*-\s*\*\*Suggested Title:\*\*\s*(.*)/im);
  if (match && match[1]) {
    return match[1].trim().replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
  }
  return null;
};
