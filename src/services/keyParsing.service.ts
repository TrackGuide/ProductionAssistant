import { MIDI_SCALES } from '../constants/constants';

export class KeyParsingService {
  static parseKeyFromGuidebook(content: string): string | null {
    // Enhanced key detection patterns
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
        
        // Fallback: try to match the first key
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
  }
}