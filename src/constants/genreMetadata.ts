// constants/genreMetadata.ts
import { remixGenres } from './remixGenres';

/**
 * Remix genre entries imported from remixGenres to consolidate genre data
 */
export type RemixGenreEntry = typeof remixGenres[number];
export const REMIX_GENRES: RemixGenreEntry[] = remixGenres;

export interface GenreMetadataBlock {
  chordProgressions?: string[];
  drumPatterns?: string;
  productionTips?: string[];
  tempos?: string;
  scalesAndModes?: string;
  songStructure?: string;
  dynamicRange?: string;
  relatedGenres: string[];
  [key: string]: any; // allow nested subgenres
}

export const GENRE_METADATA: { [genre: string]: GenreMetadataBlock | any } = {
  "Pop": {
    "chordProgressions": [
      "I–V–vi–IV",
      "vi–IV–I–V",
      "I–IV–V–I",
      "I–vi–IV–V"
    ],
    "drumPatterns": "4/4, kick on 1 & 3, snare on 2 & 4, hats on 8ths. Dance-pop uses four-on-the-floor. Tempos: 90–130 BPM.",
    "productionTips": [
      "Polished vocals with doubling/harmonies",
      "Layered synths, guitars, and piano for full choruses",
      "Subtle sidechaining and EQ carving for vocal clarity"
    ],
    "tempos": "90–130 BPM",
    "scalesAndModes": "Major or minor, often pentatonic melodies",
    "songStructure": "Verse–Chorus–Verse–Chorus–Bridge–Chorus, often with a short intro and big chorus outro",
    "dynamicRange": "Heavily compressed choruses, sparser verses",
    "relatedGenres": ["Indie Pop", "Dance-Pop", "Electropop"]
  },
  "Indie Pop": {
    "chordProgressions": ["I–V–vi–IV", "I–IV–vi–V", "vi–IV–I–V"],
    "drumPatterns": "Backbeat, organic drums, 8th hats, often live kit. 100–140 BPM.",
    "productionTips": [
      "Organic percussion, vintage synths, warm guitar layers",
      "Group vocals and lo-fi textures"
    ],
    "tempos": "100–140 BPM",
    "scalesAndModes": "Major & natural minor, some modal color",
    "songStructure": "Verse–Pre–Chorus–Chorus etc.",
    "dynamicRange": "Quiet verses, energetic choruses",
    "relatedGenres": ["Pop", "Alternative Rock", "Synth-Pop"]
  },
  "Synth-Pop": {
    "chordProgressions": ["i–VI–III–VII", "I–IV–ii–V", "vi–IV–I–V"],
    "drumPatterns": "Electronic drums, steady kick, claps on 2 & 4, offbeat hats. 110–140 BPM.",
    "productionTips": [
      "Analog-style synth pads/leads",
      "Gated reverb for retro flavor"
    ],
    "tempos": "110–140 BPM",
    "scalesAndModes": "Major & minor keys",
    "songStructure": "Intro–Verse–Chorus–Synth Solo–Chorus",
    "dynamicRange": "Glossy, compressed choruses",
    "relatedGenres": ["Retrowave", "Electropop", "Chillwave"]
  },
  "Rock": {
    "chordProgressions": [
      "I–IV–V",
      "I–V–vi–IV",
      "I–♭VII–IV–I",
      "vi–IV–I–V"
    ],
    "drumPatterns": "Standard rock beat, kick 1 & 3, snare 2 & 4, hats/ride on 8ths. 100–140 BPM (ballads 60–90, punk/metal up to 200).",
    "productionTips": [
      "Double-tracked guitars, analog amps",
      "Room reverb on drums",
      "Authentic live feel, minimal quantizing"
    ],
    "tempos": "100–140 BPM (varies by subgenre)",
    "scalesAndModes": "Pentatonic, Mixolydian, blues scale",
    "songStructure": "Verse–Chorus–Verse–Chorus–Bridge–Chorus/Outro",
    "dynamicRange": "Loud choruses, quieter verses/bridges",
    "relatedGenres": ["Blues Rock", "Hard Rock", "Punk Rock", "Alternative Rock"]
  },
  "Alternative Rock": {
    "chordProgressions": ["vi–IV–I–V", "I–V–IV–I", "I–♭VII–IV–I"],
    "drumPatterns": "Standard or experimental, 90–150 BPM.",
    "productionTips": [
      "Lo-fi textures, pedal fx, stereo delays",
      "Hybrid analog/digital layering"
    ],
    "tempos": "90–150 BPM",
    "scalesAndModes": "Mixolydian, Dorian, minor",
    "songStructure": "Verse–Chorus–Verse–Chorus–Bridge–Chorus",
    "dynamicRange": "Loud/quiet contrast",
    "relatedGenres": ["Rock", "Post-Punk", "Shoegaze"]
  },
  "Hard Rock": {
    "chordProgressions": ["I–IV–V", "vi–IV–I–V"],
    "drumPatterns": "Big, powerful kick/snare, 100–160 BPM.",
    "productionTips": [
      "Quad-tracked guitars",
      "Parallel drum compression"
    ],
    "tempos": "100–160 BPM",
    "scalesAndModes": "Minor pentatonic, natural minor",
    "songStructure": "Intro riff–Verse–Chorus–Solo–Chorus–Outro",
    "dynamicRange": "Consistent, high energy",
    "relatedGenres": ["Rock", "Heavy Metal", "Nu Metal"]
  },
  "Punk Rock": {
    "chordProgressions": ["I–IV–V", "vi–IV–I–V"],
    "drumPatterns": "Fast 4/4, 140–200 BPM, minimal fills.",
    "productionTips": [
      "Raw guitars, minimal FX",
      "Direct, aggressive performance"
    ],
    "tempos": "140–200 BPM",
    "scalesAndModes": "Major & minor pentatonic, power chords",
    "songStructure": "Verse–Chorus–Verse–Chorus–Bridge–Chorus",
    "dynamicRange": "Loud and consistent",
    "relatedGenres": ["Hardcore Punk", "Pop Punk"]
  },
  "Post-Punk": {
    "chordProgressions": ["i–VII–VI–VII", "I–♭VII–II–V"],
    "drumPatterns": "Danceable 4/4, off-beat toms, 120–140 BPM.",
    "productionTips": [
      "Clean, angular guitars",
      "Synth bass lines"
    ],
    "tempos": "120–140 BPM",
    "scalesAndModes": "Dorian, Aeolian",
    "songStructure": "Intro–Verse–Chorus–Verse–Bridge–Chorus",
    "dynamicRange": "Moderate, rhythm-driven",
    "relatedGenres": ["Post-Punk Revival", "New Wave", "Shoegaze"]
  },
  "Nu Metal": {
    "relatedGenres": ["Hard Rock", "Metalcore", "Alternative Metal"]
  },
  "Progressive Rock": {
    "relatedGenres": ["Alternative Rock", "Art Rock", "Symphonic Rock"]
  },
  "Psychedelic Rock": {
    "relatedGenres": ["Progressive Rock", "Shoegaze", "Acid Rock"]
  },
  "Folk Rock": {
    "relatedGenres": ["Folk", "Rock", "Americana"]
  },
  "Shoegaze": {
    "relatedGenres": ["Post-Punk", "Dream Pop", "Atmospheric Rock"]
  },
  "Heavy Metal": {
    "chordProgressions": [
      "i–♭VI–♭VII",
      "Power-chord chromatic riffs"
    ],
    "drumPatterns": "Aggressive kick/snare, double bass, blast beats in some subgenres. 120–220 BPM.",
    "productionTips": [
      "High-gain guitars, palm-muting",
      "Multi-tracked rhythm guitars",
      "Punchy, triggered drums"
    ],
    "tempos": "100–220+ BPM",
    "scalesAndModes": "Natural minor, Phrygian, blues scale, diminished fifth",
    "songStructure": "Verse–Chorus, often with extended solos/breakdowns",
    "dynamicRange": "Loud, some contrast for breakdowns/solos",
    "relatedGenres": ["Thrash Metal", "Death Metal", "Doom Metal", "Metalcore"]
  },
  "Thrash Metal": {
    "relatedGenres": ["Heavy Metal", "Hardcore Punk"]
  },
  "Death Metal": {
    "relatedGenres": ["Heavy Metal", "Thrash Metal"]
  },
  "Black Metal": {
    "relatedGenres": ["Death Metal", "Doom Metal"]
  },
  "Doom Metal": {
    "relatedGenres": ["Black Metal", "Heavy Metal"]
  },
  "Metalcore": {
    "relatedGenres": ["Heavy Metal", "Hardcore Punk"]
  },
  "Deathcore": {
    "relatedGenres": ["Death Metal", "Metalcore"]
  },

  "House": {
    "Deep House": {
      "chordProgressions": ["i–iv–v", "i–IV–V", "III–vi–ii–V"],
      "drumPatterns": "4/4, deep kick, offbeat hats, claps layered, swung 16ths. 120–125 BPM.",
      "productionTips": [
        "Minor 7th chords, lush electric piano",
        "Low-pass filters, atmospheric pads, sidechain compression"
      ],
      "tempos": "120–125 BPM",
      "scalesAndModes": "Minor keys (Aeolian), jazzy 7ths/9ths",
      "songStructure": "Long intros/outros, subtle builds, gradual evolution",
      "dynamicRange": "Moderate, DJ-friendly compression",
      "relatedGenres": ["Chicago House", "Soulful House", "Nu-Disco"]
    },
    "Tech House": {
      "chordProgressions": ["(Minimal; focus on groove and one-chord vamps)"],
      "drumPatterns": "Punchy 4/4, strong offbeat hats, syncopated percussion. 120–128 BPM.",
      "productionTips": [
        "Classic 909/808 drum sounds, tight percs",
        "Filter automation, chopped vocal hooks, sidechain bass"
      ],
      "tempos": "120–128 BPM",
      "scalesAndModes": "Minor or modal",
      "songStructure": "DJ-friendly: beat intro, gradual build, small drops",
      "dynamicRange": "Steady, compressed, club-ready",
      "relatedGenres": ["Techno", "Minimal House"]
    },
    "Progressive House": {
      "chordProgressions": ["I–VI–IV–V", "I–V–vi–IV", "I–IV–V"],
      "drumPatterns": "4/4, open hats, layered percussion, classic driving house groove. 126–130 BPM.",
      "productionTips": [
        "Supersaw leads, lush pads, heavy sidechain",
        "White noise sweeps, melodic arps"
      ],
      "tempos": "126–130 BPM",
      "scalesAndModes": "Major/minor diatonic",
      "songStructure": "Intro–Breakdown–Drop–Breakdown–Drop–Outro",
      "dynamicRange": "Contrast between quieter breakdowns, loud drops",
      "relatedGenres": ["Trance", "Electro House"]
    },
    "Future House": {
      "chordProgressions": ["i–VII–i–VII", "i–VI–III–VII"],
      "drumPatterns": "Bouncy 4/4, tight kick/snare, syncopated bass. 125–128 BPM.",
      "productionTips": [
        "Modulated 'talking' bass, chopped staccato chords",
        "Pitch bends, sidechain, vocal chops"
      ],
      "tempos": "125–128 BPM",
      "scalesAndModes": "Mostly minor",
      "songStructure": "Beat intro, build, bass drop, short breaks",
      "dynamicRange": "Compressed, hard-hitting",
      "relatedGenres": ["Bass House", "Electro House"]
    },
    "Minimal House": {
      "relatedGenres": ["Tech House", "Deep House", "Electro House"]
    },
    "Electro House": {
      "relatedGenres": ["Future House", "Progressive House", "Big Room House"]
    },
    "Bass House": {
      "relatedGenres": ["House", "Future House", "UK Garage"]
    }
  },
  "Techno": {
    "chordProgressions": ["(Not chord-driven; often a single chord or note)"],
    "drumPatterns": "Pounding 4/4, steady kick, offbeat hats, syncopated metallic percs. 120–140 BPM.",
    "productionTips": [
      "Analog drum machines, effects automation",
      "Minimalism, percussive synth stabs, heavy reverb"
    ],
    "tempos": "120–140 BPM",
    "scalesAndModes": "Atonal or minor/modal",
    "songStructure": "Loop-based, gradual build/layering, 5–7 min tracks",
    "dynamicRange": "Steady, narrow, driving",
    "relatedGenres": ["Detroit Techno", "Minimal Techno", "Industrial Techno"]
  },
  "Minimal Techno": {
    "relatedGenres": ["Techno", "Deep Techno", "Microhouse"]
  },
  "Industrial Techno": {
    "relatedGenres": ["Techno", "EBM", "Industrial"]
  },
  "Melodic Techno": {
    "relatedGenres": ["Techno", "Progressive Techno", "Trance"]
  },
  "Ambient Techno": {
    "relatedGenres": ["Techno", "Ambient", "Downtempo"]
  },
  "Hard Techno": {
    "relatedGenres": ["Techno", "Hardstyle", "Gabber"]
  },
  "Trance": {
    "Uplifting Trance": {
      "chordProgressions": ["i–VI–VII–i", "i–iv–V–III"],
      "drumPatterns": "4/4, 135–140 BPM, rolling 16th-note bass, energetic kicks, snare rolls in builds.",
      "productionTips": [
        "Supersaw leads, lush pads, sidechain compression",
        "Emotional breakdowns, white noise risers"
      ],
      "tempos": "135–140 BPM",
      "scalesAndModes": "Minor, with some modal color",
      "songStructure": "Intro–Breakdown–Build–Drop–Breakdown–Drop–Outro",
      "dynamicRange": "Quiet breakdowns, loud drops",
      "relatedGenres": ["Progressive Trance", "Euro Trance"]
    },
    "Progressive Trance": {
      "chordProgressions": ["VI–VII–i–VII", "i–VI–v–i"],
      "drumPatterns": "Groovier, syncopated hats, 128–134 BPM, more laid-back than uplifting trance.",
      "productionTips": [
        "Atmospheric pads, rhythmic gating, subtle melodies"
      ],
      "tempos": "128–134 BPM",
      "scalesAndModes": "Mostly minor, repetitive for hypnosis",
      "songStructure": "Long builds, smooth transitions, DJ-friendly",
      "dynamicRange": "More uniform, not as dramatic as uplifting",
      "relatedGenres": ["Uplifting Trance", "Progressive House"]
    },
    "Psytrance": {
      "chordProgressions": ["(Little to no harmonic movement; focus on bass and rhythm)"],
      "drumPatterns": "4/4, fast (140–145 BPM), 16th-note rolling bass, steady kick.",
      "productionTips": [
        "Acidic synths, modulated FX, stereo panning",
        "Fast 16th-note bass, filter/FX automation"
      ],
      "tempos": "140–145 BPM",
      "scalesAndModes": "Phrygian/Phrygian dominant for mystical leads",
      "songStructure": "Continuous flow, short breakdowns",
      "dynamicRange": "Very steady, relentless",
      "relatedGenres": ["Goa Trance", "Dark Psytrance"]
    },
    "Goa Trance": {
      "relatedGenres": ["Trance", "Psytrance"]
    },
    "Hard Trance": {
      "relatedGenres": ["Trance", "Hardstyle"]
    }
  },
  "Ambient": {
    "relatedGenres": ["Dark Ambient", "Downtempo", "Chillout"]
  },
  "Dark Ambient": {
    "relatedGenres": ["Ambient", "Industrial", "Psybient"]
  },
  "Downtempo": {
    "relatedGenres": ["Ambient", "Chillout", "Trip-Hop"]
  },
  "Chillout": {
    "relatedGenres": ["Downtempo", "Chillwave", "Lounge"]
  },
  "Chillwave": {
    "relatedGenres": ["Synthwave", "Lo-Fi Hip Hop", "Dream Pop"]
  },
  "Psybient": {
    "relatedGenres": ["Ambient", "Psytrance", "Downtempo"]
  },
  "Berlin School": {
    "relatedGenres": ["Ambient", "Synthwave", "Electronic"]
  },
  "Synthwave": {
    "relatedGenres": ["Retrowave", "Darksynth", "Electropop"]
  },
  "Retrowave": {
    "relatedGenres": ["Synthwave", "Vaporwave"]
  },
  "Darksynth": {
    "relatedGenres": ["Synthwave", "Industrial", "Dark Ambient"]
  },
  "Vaporwave": {
    "relatedGenres": ["Retrowave", "Chillwave", "Lo-Fi Hip Hop"]
  },
  "Future Funk": {
    "relatedGenres": ["Vaporwave", "Nu Disco", "Electro"]
  },
  "Drum and Bass": {
    "chordProgressions": ["(Simple or sampled; focus on bassline, pads for Liquid DnB)"],
    "drumPatterns": "Fast breakbeats (165–175 BPM), snare on 2 & 4, complex ghost snare shuffle.",
    "productionTips": [
      "Chopped breakbeats, deep sub bass",
      "Layered atmospheric pads, punchy drums"
    ],
    "tempos": "170–175 BPM",
    "scalesAndModes": "Minor, minor pentatonic, jazz chords (Liquid)",
    "songStructure": "Intro–Drop–Breakdown–Drop–Outro, DJ-friendly",
    "dynamicRange": "Loud drops, quieter intros/breakdowns",
    "relatedGenres": ["Jungle", "Liquid DnB", "Breakcore"]
  },
  "Jungle": {
    "relatedGenres": ["Drum and Bass", "Breakbeat", "UK Garage"]
  },
  "Liquid DnB": {
    "relatedGenres": ["Drum and Bass", "Jazz", "Soul"]
  },
  "Neurofunk": {
    "relatedGenres": ["Drum and Bass", "Techno"]
  },
  "Breakcore": {
    "relatedGenres": ["Drum and Bass", "IDM"]
  },
  "Dubstep": {
    "chordProgressions": ["(Minimal; single minor chord or pitch, with melodic breaks in some tracks)"],
    "drumPatterns": "Half-time feel, 140 BPM, heavy snare on 3, LFO bass modulations.",
    "productionTips": [
      "Wobble bass, FM synthesis, aggressive resampling",
      "Sidechain on bass, mid-heavy mixes"
    ],
    "tempos": "140 BPM",
    "scalesAndModes": "Minor, pentatonic, chromatic intervals",
    "songStructure": "Intro–Build–Drop–Break–Drop–Outro",
    "dynamicRange": "Loud, highly compressed drops",
    "relatedGenres": ["Brostep", "Riddim", "Trap (EDM)"]
  },
  "Riddim": {
    "relatedGenres": ["Dubstep", "Future Bass"]
  },
  "Future Bass": {
    "relatedGenres": ["Dubstep", "Trap"]
  },
  "Trap (EDM)": {
    "relatedGenres": ["Future Bass", "Hip Hop", "Drill"]
  },
  "Hardstyle": {
    "relatedGenres": ["Gabber", "Hardcore"]
  },
  "Gabber": {
    "relatedGenres": ["Hardstyle", "Hardcore"]
  },
  "UK Hardcore": {
    "relatedGenres": ["Gabber", "Hardcore"]
  },
  "IDM": {
    "relatedGenres": ["Glitch", "Ambient", "Breakcore"]
  },
  "Glitch": {
    "relatedGenres": ["IDM", "Experimental"]
  },
  "Breakbeat": {
    "relatedGenres": ["Jungle", "Drum and Bass"]
  },
  "UK Garage": {
    "relatedGenres": ["2-Step", "Future Garage"]
  },
  "2-Step": {
    "relatedGenres": ["UK Garage", "Future Garage"]
  },
  "Future Garage": {
    "relatedGenres": ["UK Garage", "Dubstep"]
  },
  "EBM": {
    "relatedGenres": ["Industrial", "Synthpop"]
  },
  "Footwork": {
    "relatedGenres": ["Juke", "Drum and Bass"]
  },
  "Juke": {
    "relatedGenres": ["Footwork", "Garage"]
  },
  "Hip Hop": {
    "chordProgressions": ["Sample-based or looped, minor pentatonic, jazz-influenced ii–V–I (occasionally)"],
    "drumPatterns": "Syncopated kicks, snares on 2 & 4, hi-hats with 16ths/triplets, swing/shuffle. 70–110 BPM.",
    "productionTips": [
      "Sampled breaks, chopped vocals, heavy sub bass",
      "808 kicks, hi-hat rolls, sidechain for headroom"
    ],
    "tempos": "70–110 BPM (Trap: 130–150 BPM, half-time feel)",
    "scalesAndModes": "Minor, pentatonic, jazz modes (Boom Bap), phrygian",
    "songStructure": "Intro–Verse–Chorus–Verse–Bridge–Chorus/Outro, with breakdowns/drops in modern styles",
    "dynamicRange": "Heavily compressed, punchy drums",
    "relatedGenres": ["Boom Bap", "Trap", "Lo-fi Hip Hop", "Drill", "Cloud Rap"]
  },
  "Boom Bap": {
    "relatedGenres": ["Hip Hop", "Jazz Rap"]
  },
  "Trap": {
    "relatedGenres": ["Hip Hop", "Drill", "Cloud Rap"]
  },
  "Lo-fi Hip Hop": {
    "relatedGenres": ["Hip Hop", "Chillwave"]
  },
  "Cloud Rap": {
    "relatedGenres": ["Hip Hop", "Trap"]
  },
  "Drill": {
    "relatedGenres": ["Trap", "Hip Hop"]
  },
  "Conscious Hip Hop": {
    "relatedGenres": ["Hip Hop", "Boom Bap"]
  },
  "R&B": {
    "chordProgressions": [
      "I–vi–IV–V",
      "I–IV–V–IV",
      "ii–V–I",
      "Imaj7–vi7–ii7–V7",
      "I–iii–vi–V"
    ],
    "drumPatterns": "Laid-back grooves, swung 16ths, syncopated snares, soft hats. 70–100 BPM.",
    "productionTips": [
      "Smooth vocal layering, lush harmonies, electric piano",
      "Soulful guitar licks, subtle hip hop drums, sidechained bass"
    ],
    "tempos": "60–100 BPM",
    "scalesAndModes": "Major/minor, Mixolydian, jazz-influenced 7th/9th chords",
    "songStructure": "Verse–Chorus–Verse–Bridge–Chorus/Outro",
    "dynamicRange": "Warm, soft verses, louder choruses/bridges",
    "relatedGenres": ["Contemporary R&B", "Neo-Soul", "Soul"]
  },
  "Contemporary R&B": {
    "relatedGenres": ["R&B", "Pop"]
  },
  "Neo-Soul": {
    "relatedGenres": ["R&B", "Soul", "Jazz"]
  },
  "Soul": {
    "relatedGenres": ["R&B", "Funk", "Motown"]
  },
  "Jazz": {
    "chordProgressions": [
      "ii–V–I",
      "I–vi–ii–V",
      "iii–vi–ii–V",
      "Imaj7–II7–V7–I"
    ],
    "drumPatterns": "Swing ride cymbal, brushes or sticks, walking bass. 70–220 BPM.",
    "productionTips": [
      "Live horns, upright/double bass, electric piano",
      "Improvisation, jazz voicings, complex harmony"
    ],
    "tempos": "70–220 BPM",
    "scalesAndModes": "Major, Dorian, Mixolydian, chromatic passing tones",
    "songStructure": "Head–Solos–Head (AABA or ABAC)",
    "dynamicRange": "Wide, from whisper-quiet to very loud",
    "relatedGenres": ["Smooth Jazz", "Fusion", "Bebop", "Funk"]
  },
  "Smooth Jazz": {
    "relatedGenres": ["Jazz", "R&B", "Fusion"]
  },
  "Blues": {
    "chordProgressions": [
      "I–I–I–I–IV–IV–I–I–V–IV–I–I",
      "i–i–i–i–iv–iv–i–i–v–iv–i–i"
    ],
    "drumPatterns": "Shuffle, swung 8ths, simple kit, brushwork. 70–130 BPM.",
    "productionTips": [
      "Blues scale, expressive bends, call-and-response",
      "Raw vocal delivery, amp breakup, tremolo"
    ],
    "tempos": "70–130 BPM",
    "scalesAndModes": "Major/minor pentatonic, blues scale",
    "songStructure": "12-bar, 8-bar or 16-bar blues",
    "dynamicRange": "Moderate, expressive",
    "relatedGenres": ["Rock", "Jazz", "Soul", "Funk"]
  },
  "Funk": {
    "chordProgressions": [
      "I7–IV7–V7",
      "Dominant 7th vamps"
    ],
    "drumPatterns": "16th-note syncopation, ghost notes, tight kick/snare. 90–120 BPM.",
    "productionTips": [
      "Rhythmic guitar, slap bass, horn stabs",
      "Percussive keys, congas, polyrhythms"
    ],
    "tempos": "90–120 BPM",
    "scalesAndModes": "Dominant 7th, Mixolydian, Dorian",
    "songStructure": "Groove-based, extended vamps, call-and-response",
    "dynamicRange": "Consistently punchy, danceable",
    "relatedGenres": ["Soul", "Disco", "Jazz", "Afrobeat"]
  },
  "Folk": {
    "relatedGenres": ["Folk Rock", "Country"]
  },
  "Acoustic": {
    "relatedGenres": ["Folk", "Singer-Songwriter"]
  },
  "World Music": {
    "relatedGenres": ["Reggae", "Afrobeat", "Latin", "Celtic"]
  },
  "Reggae": {
    "relatedGenres": ["Dub", "Ska"]
  },
  "Dub": {
    "relatedGenres": ["Reggae", "Electronic"]
  },
  "Ska": {
    "relatedGenres": ["Reggae", "Punk Rock"]
  },
  "Latin": {
    "relatedGenres": ["Afrobeat", "World Music"]
  },
  "Afrobeat": {
    "relatedGenres": ["Funk", "World Music"]
  },
  "Celtic": {
    "relatedGenres": ["Folk", "World Music"]
  },
  "Experimental": {
    "relatedGenres": ["Noise", "IDM", "Glitch"]
  },
  "Noise": {
    "relatedGenres": ["Experimental", "Industrial"]
  },
  "Industrial": {
    "relatedGenres": ["Noise", "EBM", "Industrial Techno"]
  },
  "Classical Crossover": {
    "relatedGenres": ["Classical", "Orchestral"]
  },
  "Chiptune": {
    "relatedGenres": ["Video Game Music", "IDM"]
  },
  "Video Game Music": {
    "relatedGenres": ["Chiptune", "Orchestral"]
  }
};

// Helper functions
export const getGenreMetadata = (genreName: string): GenreMetadataBlock | null => {
  // Check if it's a top-level genre
  if (GENRE_METADATA[genreName]) {
    return GENRE_METADATA[genreName];
  }
  
  // Check if it's a nested genre (e.g., "Deep House" under "House")
  for (const topGenre in GENRE_METADATA) {
    const metadata = GENRE_METADATA[topGenre];
    if (typeof metadata === 'object' && metadata !== null) {
      // Check if this top genre has the nested genre
      if (metadata[genreName]) {
        return metadata[genreName];
      }
    }
  }
  
  return null;
};

export const getCombinedGenreData = (genreName: string) => {
  const remixGenreData = getGenreInfo(genreName);
  const metadataGenreData = getGenreMetadata(genreName);
  
  return {
    ...remixGenreData,
    metadata: metadataGenreData
  };
};

// Re-export remix genre utility functions from remixGenres for consolidated imports
/**
 * Returns the genre information object for the given genre name from remixGenres.
 */
export function getGenreInfo(genreName: string) {
  return remixGenres.find(entry => entry.genre === genreName) || null;
}

/**
 * Returns a mapping of categories to their genres array from remixGenres.
 */
export function getGenresByCategory(): Record<string, string[]> {
  return remixGenres.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    if (!acc[entry.category].includes(entry.genre)) {
      acc[entry.category].push(entry.genre);
    }
    return acc;
  }, {} as Record<string, string[]>);
}
