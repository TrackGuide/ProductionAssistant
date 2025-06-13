
import MidiWriter from 'midi-writer-js';
import { GeneratedMidiPatterns, MidiSettings, ChordNoteEvent, MidiNote, DrumPatternData, DrumHit } from '../types.ts';
import { MIDI_DRUM_MAP } from '../constants.ts';

const createTrackInstance = (trackName: string): InstanceType<typeof MidiWriter.Track> | null => {
  if (!MidiWriter.Track) return null;
  const track = new MidiWriter.Track();
  track.addTrackName(trackName);
  return track;
};

const addNotesToTrack = (
    trackInstance: InstanceType<typeof MidiWriter.Track>, 
    notes: MidiNote[] | ChordNoteEvent[], 
    channel: number, 
    isChordTrack: boolean = false
) => {
  if (!MidiWriter.NoteEvent || !notes || notes.length === 0 || !trackInstance) return;

  notes.forEach(event => {
    let pitches: number[] = [];

    if (isChordTrack) {
      const chordEvent = event as ChordNoteEvent;
      pitches = chordEvent.notes.map(n => n.midi).filter(n => typeof n === 'number');
    } else {
      const noteEvent = event as MidiNote;
      if (typeof noteEvent.midi === 'number') {
        pitches = [noteEvent.midi];
      }
    }
    
    if (pitches.length > 0) {
       const durationTicks = Math.round(event.duration * 128); // 128 ticks per beat (quarter note) is default
       const startTick = Math.round(event.time * 128);

        trackInstance.addEvent(new MidiWriter.NoteEvent({
            pitch: pitches,
            duration: `T${durationTicks}`,
            startTick: startTick,
            velocity: event.velocity || (isChordTrack ? 90 : 100),
            channel: channel 
        }));
    }
  });
};

const addDrumHitsToTrack = (trackInstance: InstanceType<typeof MidiWriter.Track>, drumData: DrumPatternData) => {
  if (!MidiWriter.NoteEvent || !drumData || Object.keys(drumData).length === 0 || !trackInstance) return;

  Object.entries(drumData).forEach(([drumElementName, hits]) => {
    const drumKey = drumElementName.toLowerCase().replace(/\s+/g, '_');
    const midiPitch = MIDI_DRUM_MAP[drumKey] || MIDI_DRUM_MAP[drumElementName]; 
    
    if (typeof midiPitch !== 'number' || !hits) return;

    hits.forEach((hit: DrumHit) => {
      const durationTicks = Math.round(hit.duration * 128);
      const startTick = Math.round(hit.time * 128);
      trackInstance.addEvent(new MidiWriter.NoteEvent({
        pitch: [midiPitch],
        duration: `T${durationTicks}`,
        startTick: startTick,
        velocity: hit.velocity || 100,
        channel: 10 // Standard GM drum channel
      }));
    });
  });
};


export const generateMidiFile = (
  patterns: GeneratedMidiPatterns,
  settings: Pick<MidiSettings, 'tempo' | 'timeSignature' | 'key'>,
  trackNamePrefix: string = "TrackGuide"
): string | null => { 
  if (!MidiWriter || !MidiWriter.Writer || !MidiWriter.Track || !MidiWriter.NoteEvent) {
    console.error("MidiWriterJS components (Writer, Track, NoteEvent) are not loaded. Cannot generate MIDI file.");
    return null;
  }
  
  const tracks: Array<InstanceType<typeof MidiWriter.Track>> = [];
  let hasContent = false;

  const configureAndAddTrack = (trackInstance: InstanceType<typeof MidiWriter.Track> | null) => {
    if (trackInstance) {
        trackInstance.setTempo(settings.tempo);
        // Provide all 4 arguments to setTimeSignature, using common defaults for the last two.
        // This can resolve issues if TypeScript typings are strict about these optional params.
        trackInstance.setTimeSignature(settings.timeSignature[0], settings.timeSignature[1], 24, 8);
        // Key signature can be added if MidiWriter supports it easily and it's desired
        // trackInstance.addKeySignature(settings.key); // Example, check MidiWriter docs for exact usage if needed
    }
    return trackInstance;
  }

  if (patterns.chords && patterns.chords.length > 0) {
    let chordTrack = createTrackInstance(`${trackNamePrefix} Chords`);
    chordTrack = configureAndAddTrack(chordTrack);
    if (chordTrack) {
        addNotesToTrack(chordTrack, patterns.chords, 1, true); 
        tracks.push(chordTrack);
        hasContent = true;
    }
  }
  if (patterns.bassline && patterns.bassline.length > 0) {
    let bassTrack = createTrackInstance(`${trackNamePrefix} Bassline`);
    bassTrack = configureAndAddTrack(bassTrack);
    if (bassTrack) {
        addNotesToTrack(bassTrack, patterns.bassline, 2, false); 
        tracks.push(bassTrack);
        hasContent = true;
    }
  }
  if (patterns.melody && patterns.melody.length > 0) {
    let melodyTrack = createTrackInstance(`${trackNamePrefix} Melody`);
    melodyTrack = configureAndAddTrack(melodyTrack);
    if (melodyTrack) {
        addNotesToTrack(melodyTrack, patterns.melody, 3, false); 
        tracks.push(melodyTrack);
        hasContent = true;
    }
  }
  if (patterns.drums && Object.keys(patterns.drums).length > 0) {
    let drumTrack = createTrackInstance(`${trackNamePrefix} Drums`);
    drumTrack = configureAndAddTrack(drumTrack);
    if (drumTrack) {
        addDrumHitsToTrack(drumTrack, patterns.drums);
        tracks.push(drumTrack);
        hasContent = true;
    }
  }
  
  if (!hasContent) {
    console.warn("No patterns to write to MIDI file.");
    return null;
  }

  const writerInstance = new MidiWriter.Writer(tracks); 
  return writerInstance.dataUri(); 
};

export const downloadMidi = (midiDataUri: string, filename: string) => { 
  if (!midiDataUri) {
    console.error("MIDI data URI is null or empty. Cannot download.");
    alert("Failed to generate MIDI data for download.");
    return;
  }
  const a = document.createElement('a');
  a.href = midiDataUri;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
