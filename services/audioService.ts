
import { GeneratedMidiPatterns, MidiSettings, MidiNote, ChordNoteEvent, DrumPatternData, DrumHit, KeyOfGeneratedMidiPatterns } from '../types.ts';
import { MIDI_DRUM_MAP } from '../constants.ts';

interface ActiveSourceEntry {
  node: AudioScheduledSourceNode;
  controlGainNode: GainNode;
  trackType: KeyOfGeneratedMidiPatterns;
  intendedVolume: number; // Volume based on velocity (0-1)
  scheduledStopTime: number; // AudioContext time when the note's envelope should end
  isDrum: boolean;
}

let audioContext: AudioContext | null = null;
let activeSources: ActiveSourceEntry[] = [];
let masterGain: GainNode | null = null;

// Global state for playback control, managed by functions in this service
let loopTimeoutId: number | null = null;
let overallPlaybackStartTime: number = 0; // AudioContext time when "Play All" was initiated for the current session
let currentLoopIteration: number = 0;
let isGloballyPlaying: boolean = false; // Reflects if playback sequence is active


const getAudioContext = (): AudioContext => {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

const beatsToSeconds = (beats: number, tempo: number): number => {
  const result = (beats / tempo) * 60;
  if (!Number.isFinite(result)) {
    console.error('🚨 beatsToSeconds produced non-finite result:', result, 'beats:', beats, 'tempo:', tempo);
    return 0; // Fallback to 0
  }
  return result;
};

const scheduleNote = (
  noteNumber: number,
  startTimeInLoopSeconds: number, // Time from the start of the current loop iteration
  durationSeconds: number,
  velocity: number = 100,
  isDrum: boolean = false,
  drumTypeKey?: string, // e.g. 'kick', 'snare'
  trackType?: KeyOfGeneratedMidiPatterns // trackType is primarily for debugging or advanced routing if needed later
) => {
  const context = getAudioContext();
  if (!masterGain || !trackType) return;

  // Validate all input values to prevent non-finite values
  if (!Number.isFinite(noteNumber) || !Number.isFinite(startTimeInLoopSeconds) || 
      !Number.isFinite(durationSeconds) || !Number.isFinite(velocity)) {
    console.error('🚨 Invalid note values detected:', {
      noteNumber,
      startTimeInLoopSeconds,
      durationSeconds,
      velocity,
      trackType,
      isDrum,
      drumTypeKey
    });
    return;
  }

  const absoluteScheduleTime = overallPlaybackStartTime + (currentLoopIteration * getLoopDurationSeconds()) + startTimeInLoopSeconds;
  
  if (absoluteScheduleTime < context.currentTime - 0.05) { 
      // Note is in the past, don't schedule
      return;
  }

  const controlGainNode = context.createGain();
  const intendedVolume = (velocity / 127) * (isDrum ? 0.75 : 0.35); 
  let currentAppliedGain = intendedVolume;
  
  // Ensure gain values are finite
  if (!Number.isFinite(currentAppliedGain) || currentAppliedGain < 0) {
    console.error('🚨 Invalid gain value detected:', currentAppliedGain, 'for velocity:', velocity);
    currentAppliedGain = 0.1; // Fallback to a safe value
  }
  
  controlGainNode.gain.setValueAtTime(currentAppliedGain, absoluteScheduleTime);
  // Only schedule decay if it's audible. If currentAppliedGain is 0 (or very close), ramp won't work correctly.
  if (currentAppliedGain > 0.0001) { 
    try {
        controlGainNode.gain.exponentialRampToValueAtTime(0.0001, absoluteScheduleTime + durationSeconds);
    } catch(e) {
        // Fallback if exponentialRamp fails (e.g., value is too close to 0 for some implementations)
        controlGainNode.gain.linearRampToValueAtTime(0.0001, absoluteScheduleTime + durationSeconds);
    }
  }
  controlGainNode.connect(masterGain);
  
  let oscillator: AudioScheduledSourceNode;

  if (isDrum) {
    if (drumTypeKey === 'kick') {
      const kickOsc = context.createOscillator();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(150, absoluteScheduleTime);
      kickOsc.frequency.exponentialRampToValueAtTime(50, absoluteScheduleTime + Math.min(durationSeconds, 0.12));
      
      const kickEnvGain = context.createGain();
      kickEnvGain.gain.setValueAtTime(1, absoluteScheduleTime); 
      kickEnvGain.gain.exponentialRampToValueAtTime(0.001, absoluteScheduleTime + durationSeconds);
      
      kickOsc.connect(kickEnvGain).connect(controlGainNode); 
      kickOsc.start(absoluteScheduleTime);
      kickOsc.stop(absoluteScheduleTime + durationSeconds);
      activeSources.push({ node: kickOsc, controlGainNode, trackType, intendedVolume, scheduledStopTime: absoluteScheduleTime + durationSeconds, isDrum: true });
      return; 
    } else if (drumTypeKey === 'snare' || drumTypeKey === 'clap') {
      // Noise-based snare/clap
      oscillator = context.createBufferSource(); 
      const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
      const drumBuffer = context.createBuffer(1, frameCount, context.sampleRate);
      const data = drumBuffer.getChannelData(0);
      
      for (let i = 0; i < frameCount; i++) { 
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.05)); 
      }
      (oscillator as AudioBufferSourceNode).buffer = drumBuffer;
    } else if (drumTypeKey && (drumTypeKey.includes('hat') || drumTypeKey === 'hihat_closed' || drumTypeKey === 'open_hihat')) {
      // Hi-hat synthesis
      oscillator = context.createBufferSource(); 
      const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
      const drumBuffer = context.createBuffer(1, frameCount, context.sampleRate);
      const data = drumBuffer.getChannelData(0);
      
      const fundamental = 5000;
      const decayFactor = drumTypeKey === 'open_hihat' ? 0.15 : 0.03;
      for (let i = 0; i < frameCount; i++) { 
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * decayFactor)) * 
                  Math.sin(2 * Math.PI * fundamental * (i/context.sampleRate) * (1 + Math.random()*0.3));
      }
      (oscillator as AudioBufferSourceNode).buffer = drumBuffer;
    } else if (drumTypeKey && (drumTypeKey.includes('cymbal') || drumTypeKey === 'crash_cymbal_1' || drumTypeKey === 'ride_cymbal_1')) {
      // Cymbal synthesis
      oscillator = context.createBufferSource(); 
      const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
      const drumBuffer = context.createBuffer(1, frameCount, context.sampleRate);
      const data = drumBuffer.getChannelData(0);
      
      const fundamental = drumTypeKey === 'ride_cymbal_1' ? 3000 : 4000;
      const decayFactor = drumTypeKey === 'crash_cymbal_1' ? 0.25 : 0.15;
      for (let i = 0; i < frameCount; i++) { 
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * decayFactor)) * 
                  Math.sin(2 * Math.PI * fundamental * (i/context.sampleRate) * (1 + Math.random()*0.5));
      }
      (oscillator as AudioBufferSourceNode).buffer = drumBuffer;
    } else if (drumTypeKey && drumTypeKey.includes('tom')) {
      // Tom synthesis
      const tomOsc = context.createOscillator();
      tomOsc.type = 'sine'; 
      let startFreq = 200;
      if (drumTypeKey === 'tom_high') startFreq = 300;
      else if (drumTypeKey === 'tom_mid') startFreq = 200;
      else if (drumTypeKey === 'tom_low') startFreq = 120;
      
      tomOsc.frequency.setValueAtTime(startFreq, absoluteScheduleTime);
      tomOsc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, absoluteScheduleTime + durationSeconds * 0.8);
      
      const tomEnvGain = context.createGain();
      tomEnvGain.gain.setValueAtTime(0.9, absoluteScheduleTime);
      tomEnvGain.gain.exponentialRampToValueAtTime(0.001, absoluteScheduleTime + durationSeconds);
      
      tomOsc.connect(tomEnvGain).connect(controlGainNode);
      tomOsc.start(absoluteScheduleTime);
      tomOsc.stop(absoluteScheduleTime + durationSeconds);
      activeSources.push({ node: tomOsc, controlGainNode, trackType, intendedVolume, scheduledStopTime: absoluteScheduleTime + durationSeconds, isDrum: true });
      return;
    } else { 
        // Generic percussion fallback
        oscillator = context.createBufferSource(); 
        const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
        const drumBuffer = context.createBuffer(1, frameCount, context.sampleRate);
        const data = drumBuffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) { data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.1)); }
        (oscillator as AudioBufferSourceNode).buffer = drumBuffer;
    }
  } else {
      // Non-drum notes (Chords, Bassline, Melody)
      oscillator = context.createOscillator(); 
      (oscillator as OscillatorNode).type = 'sawtooth'; // A reasonably bright waveform
      const freq = 440 * Math.pow(2, (noteNumber - 69) / 12);
      
      // Validate frequency
      if (!Number.isFinite(freq) || freq <= 0) {
        console.error('🚨 Invalid frequency calculated:', freq, 'for note number:', noteNumber);
        return; // Skip this note
      }
      
      (oscillator as OscillatorNode).frequency.setValueAtTime(freq, absoluteScheduleTime);
  }

  oscillator.connect(controlGainNode);
  oscillator.start(absoluteScheduleTime);
  oscillator.stop(absoluteScheduleTime + durationSeconds);
  activeSources.push({ node: oscillator, controlGainNode, trackType, intendedVolume, scheduledStopTime: absoluteScheduleTime + durationSeconds, isDrum });
};

// Memoized settings for loop duration calculation
let lastSettingsForLoopDuration: Pick<MidiSettings, 'tempo' | 'bars' | 'timeSignature'> | null = null;
// let cachedLoopDurationSeconds: number = 0;

const getLoopDurationSeconds = (): number => {
    if (!lastSettingsForLoopDuration) throw new Error("Settings not available for loop duration calculation.");
    const { tempo, bars, timeSignature } = lastSettingsForLoopDuration;
    // Calculate beats per bar, considering time signature (e.g., 4/4 has 4 beats, 3/4 has 3, 6/8 has 2 main beats if counted in 2)
    // For simplicity with AI output, assume timeSignature[0] is the number of primary beats.
    const beatsPerBar = timeSignature[0] * (4 / timeSignature[1]); 
    return beatsToSeconds(bars * beatsPerBar, tempo);
};


export const playMidiPatterns = (
  patterns: GeneratedMidiPatterns,
  settings: Pick<MidiSettings, 'tempo' | 'bars' | 'timeSignature'>,
  trackToPlay?: KeyOfGeneratedMidiPatterns // Optional: if provided, only play this track
) => {
  console.log('🎵 Starting playback with patterns:', patterns);
  console.log('🎵 Settings:', settings);
  console.log('🎵 Track to play:', trackToPlay);
  
  stopPlaybackInternal(false); // Stop any existing playback but don't reset loop iteration fully yet
  
  isGloballyPlaying = true; 
  currentLoopIteration = 0; // Reset loop iteration for new playback session
  
  lastSettingsForLoopDuration = { ...settings };

  const context = getAudioContext();
  overallPlaybackStartTime = context.currentTime; // Set new start time for this playback session

  activeSources = []; // Clear previously scheduled sources

  const loopDurationSec = getLoopDurationSeconds();
  console.log('🎵 Loop duration:', loopDurationSec, 'seconds');
  
  if (loopDurationSec <= 0) {
      console.error("Loop duration is zero or negative. Cannot play.");
      isGloballyPlaying = false;
      return;
  }
  
  function scheduleLoopContent() {
    if (!isGloballyPlaying) return; // If stop was called, exit

    // Clean up sources that have definitively finished playing from previous loops
    // This is a basic cleanup; more robust would involve checking node.playbackState if available
    const currentTime = context.currentTime;
    activeSources = activeSources.filter(s => s.scheduledStopTime > currentTime || !s.node);


    const tempo = settings.tempo;

    const scheduleTrack = (
      trackKey: KeyOfGeneratedMidiPatterns,
      data?: MidiNote[] | ChordNoteEvent[] | DrumPatternData
    ) => {
      if (!data) {
        console.log(`🎵 No data for track: ${trackKey}`);
        return;
      }

      console.log(`🎵 Scheduling track: ${trackKey}`, data);

      if (trackKey === 'drums' && typeof data === 'object' && !Array.isArray(data)) {
        Object.entries(data as DrumPatternData).forEach(([drumElementName, hits]) => {
          // Normalize drum element name for mapping (e.g., 'closed hi-hat' -> 'closed_hihat')
          const drumKeyClean = drumElementName.toLowerCase().replace(/\s+/g, '_');
          const midiPitch = MIDI_DRUM_MAP[drumKeyClean] || MIDI_DRUM_MAP[drumElementName]; // Try cleaned key first
          
          console.log(`🥁 Processing drum element: ${drumElementName} -> ${drumKeyClean}, MIDI: ${midiPitch}, hits:`, hits);
          
          if (typeof midiPitch !== 'number' || !hits) {
            console.warn(`🚨 Invalid drum mapping for ${drumElementName}:`, midiPitch);
            return;
          }
          hits.forEach((hit: DrumHit) => {
            console.log(`🥁 Scheduling drum hit:`, hit);
            scheduleNote(midiPitch, beatsToSeconds(hit.time, tempo), beatsToSeconds(hit.duration, tempo), hit.velocity, true, drumKeyClean, trackKey);
          });
        });
      } else if (Array.isArray(data)) {
        (data as Array<MidiNote | ChordNoteEvent>).forEach((event, index) => {
          console.log(`🎹 Processing ${trackKey} event ${index}:`, event);
          const isChord = 'notes' in event; // Check if it's a ChordNoteEvent
          if (isChord) {
            // For chords, schedule each note within the chord
            (event as ChordNoteEvent).notes.forEach((note, noteIndex) => {
              console.log(`🎹 Chord note ${noteIndex}:`, note);
              if (typeof note.midi === 'number') {
                scheduleNote(note.midi, beatsToSeconds(event.time, tempo), beatsToSeconds(event.duration, tempo), event.velocity, false, undefined, trackKey);
              } else {
                console.warn(`🚨 Invalid MIDI number in chord note:`, note);
              }
            });
          } else {
            // For single notes (melody, bassline)
            const noteEvent = event as MidiNote;
            console.log(`🎹 Single note:`, noteEvent);
            if (typeof noteEvent.midi === 'number') {
              scheduleNote(noteEvent.midi, beatsToSeconds(event.time, tempo), beatsToSeconds(event.duration, tempo), event.velocity, false, undefined, trackKey);
            } else {
              console.warn(`🚨 Invalid MIDI number in note:`, noteEvent);
            }
          }
        });
      }
    };
    
    // Determine which tracks to schedule based on trackToPlay argument
    const tracksToSchedule: KeyOfGeneratedMidiPatterns[] = trackToPlay ? [trackToPlay] : ['chords', 'bassline', 'melody', 'drums'];

    tracksToSchedule.forEach(key => {
        switch(key) {
            case 'chords': if (patterns.chords) scheduleTrack('chords', patterns.chords); break;
            case 'bassline': if (patterns.bassline) scheduleTrack('bassline', patterns.bassline); break;
            case 'melody': if (patterns.melody) scheduleTrack('melody', patterns.melody); break;
            case 'drums': if (patterns.drums) scheduleTrack('drums', patterns.drums); break;
        }
    });


    // Schedule the next iteration of the loop
    if (isGloballyPlaying) {
      const nextLoopTime = overallPlaybackStartTime + ((currentLoopIteration + 1) * loopDurationSec);
      let delayMilliseconds = (nextLoopTime - context.currentTime) * 1000;
      
      // If calculation results in a negative delay (e.g. due to heavy processing in current iteration), schedule ASAP
      if(delayMilliseconds < 0) {
        console.warn(`Loop drift detected. Next loop scheduled with minimal delay. Ideal: ${nextLoopTime}, Current: ${context.currentTime}`);
        delayMilliseconds = 10; // Small positive delay
      }

      loopTimeoutId = window.setTimeout(() => {
        if (!isGloballyPlaying) return; // Check again in case stop was called during timeout
        currentLoopIteration++;
        scheduleLoopContent();
      }, delayMilliseconds); 
    }
  }
  
  scheduleLoopContent(); // Start the first iteration
};

export const stopPlayback = () => {
  isGloballyPlaying = false; // Signal to stop looping and scheduling
  stopPlaybackInternal(true);
};

// Internal stop function, can be called without resetting loop iteration if needed (e.g., before starting a new preview)
const stopPlaybackInternal = (resetLoopIterationAndTime: boolean) => {
  if (loopTimeoutId !== null) {
    clearTimeout(loopTimeoutId);
    loopTimeoutId = null;
  }
  
  // Stop and disconnect all active audio sources
  activeSources.forEach(sourceEntry => {
    try {
      if (sourceEntry.node) { // Check if node exists
        sourceEntry.node.stop();
        sourceEntry.node.disconnect();
      }
      if (sourceEntry.controlGainNode) { // Check if gain node exists
         sourceEntry.controlGainNode.disconnect();
      }
    } catch (e) { /* Ignore errors if already stopped or disconnected */ }
  });
  activeSources = []; // Clear the list of active sources

  if (resetLoopIterationAndTime) {
    currentLoopIteration = 0;
    overallPlaybackStartTime = 0; // Reset this only when "Stop All" is explicitly called
  }
};


export const initializeAudio = async () => {
    // Ensure AudioContext is running (e.g., after user interaction)
    try {
      const context = getAudioContext();
      if (context.state === 'suspended') {
        await context.resume();
      }
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      // Optionally, inform the user they might need to interact with the page for audio to work.
    }
};

export const uploadAudio = async (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        const parts = reader.result.split(',');
        const base64Data = parts[1];
        const mimeTypeMatch = parts[0].match(/data:(.*);base64/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : file.type || 'audio/mpeg';
        resolve({ base64: base64Data, mimeType });
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
};
