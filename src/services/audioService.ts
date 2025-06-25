
import { GeneratedMidiPatterns, MidiSettings, MidiNote, ChordNoteEvent, DrumPatternData, DrumHit, KeyOfGeneratedMidiPatterns } from '../constants/types';
import { MIDI_DRUM_MAP } from '../constants/constants';

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
    // Enhanced drum synthesis with more robust pattern matching
    const drumKey = drumTypeKey || '';
    console.log(`🥁 Synthesizing drum: "${drumKey}" (MIDI: ${noteNumber})`);
    
    // Kick drum synthesis (MIDI 36)
    if (drumKey.includes('kick') || drumKey.includes('bass_drum') || noteNumber === 36) {
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
    }
    
    // Snare drum synthesis (MIDI 38)
    else if (drumKey.includes('snare') || noteNumber === 38) {
      oscillator = context.createBufferSource(); 
      const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
      const drumBuffer = context.createBuffer(1, frameCount, context.sampleRate);
      const data = drumBuffer.getChannelData(0);
      
      for (let i = 0; i < frameCount; i++) { 
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.05)); 
      }
      (oscillator as AudioBufferSourceNode).buffer = drumBuffer;
    }
    
    // Clap synthesis (MIDI 39)
    else if (drumKey.includes('clap') || drumKey.includes('hand_clap') || noteNumber === 39) {
      oscillator = context.createBufferSource(); 
      const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
      const drumBuffer = context.createBuffer(1, frameCount, context.sampleRate);
      const data = drumBuffer.getChannelData(0);
      
      // Create a sharper, more percussive clap sound
      for (let i = 0; i < frameCount; i++) { 
        const envelope = Math.exp(-i / (context.sampleRate * 0.03));
        const noise = (Math.random() * 2 - 1);
        // Add multiple bursts for realistic clap
        const burstPattern = Math.sin(i * 0.01) > 0.5 ? 1 : 0.3;
        data[i] = noise * envelope * burstPattern;
      }
      (oscillator as AudioBufferSourceNode).buffer = drumBuffer;
    }
    
    // Hi-hat synthesis (MIDI 42 closed, 46 open)
    else if (drumKey.includes('hat') || drumKey.includes('hihat') || noteNumber === 42 || noteNumber === 46) {
      oscillator = context.createBufferSource(); 
      const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
      const drumBuffer = context.createBuffer(1, frameCount, context.sampleRate);
      const data = drumBuffer.getChannelData(0);
      
      const fundamental = 5000;
      const isOpen = drumKey.includes('open') || noteNumber === 46;
      const decayFactor = isOpen ? 0.15 : 0.03;
      
      for (let i = 0; i < frameCount; i++) { 
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * decayFactor)) * 
                  Math.sin(2 * Math.PI * fundamental * (i/context.sampleRate) * (1 + Math.random()*0.3));
      }
      (oscillator as AudioBufferSourceNode).buffer = drumBuffer;
    }
    
    // Crash cymbal synthesis (MIDI 49)
    else if (drumKey.includes('crash') || drumKey.includes('cymbal') || noteNumber === 49) {
      oscillator = context.createBufferSource(); 
      const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
      const drumBuffer = context.createBuffer(1, frameCount, context.sampleRate);
      const data = drumBuffer.getChannelData(0);
      
      const fundamental = 4000;
      const decayFactor = 0.25; // Longer decay for crash
      
      for (let i = 0; i < frameCount; i++) { 
        const envelope = Math.exp(-i / (context.sampleRate * decayFactor));
        const harmonic1 = Math.sin(2 * Math.PI * fundamental * (i/context.sampleRate));
        const harmonic2 = Math.sin(2 * Math.PI * fundamental * 1.5 * (i/context.sampleRate));
        const noise = (Math.random() * 2 - 1) * 0.3;
        data[i] = (harmonic1 + harmonic2 * 0.7 + noise) * envelope;
      }
      (oscillator as AudioBufferSourceNode).buffer = drumBuffer;
    }
    
    // Ride cymbal synthesis (MIDI 51)
    else if (drumKey.includes('ride') || noteNumber === 51) {
      oscillator = context.createBufferSource(); 
      const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
      const drumBuffer = context.createBuffer(1, frameCount, context.sampleRate);
      const data = drumBuffer.getChannelData(0);
      
      const fundamental = 3000;
      const decayFactor = 0.15;
      
      for (let i = 0; i < frameCount; i++) { 
        const envelope = Math.exp(-i / (context.sampleRate * decayFactor));
        const bell = Math.sin(2 * Math.PI * fundamental * (i/context.sampleRate));
        const ping = Math.sin(2 * Math.PI * fundamental * 2.5 * (i/context.sampleRate)) * 0.3;
        data[i] = (bell + ping) * envelope;
      }
      (oscillator as AudioBufferSourceNode).buffer = drumBuffer;
    }
    
    // Tom synthesis (MIDI 41, 47, 50)
    else if (drumKey.includes('tom') || noteNumber === 41 || noteNumber === 47 || noteNumber === 50) {
      const tomOsc = context.createOscillator();
      tomOsc.type = 'sine'; 
      
      // Determine frequency based on tom type or MIDI note
      let startFreq = 200;
      if (drumKey.includes('high') || noteNumber === 50) startFreq = 300;
      else if (drumKey.includes('mid') || noteNumber === 47) startFreq = 200;
      else if (drumKey.includes('low') || noteNumber === 41) startFreq = 120;
      
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
    }
    
    // Other percussion (shaker, tambourine, cowbell, etc.)
    else if (drumKey.includes('shaker') || drumKey.includes('tambourine') || drumKey.includes('cowbell') || 
             noteNumber === 70 || noteNumber === 54 || noteNumber === 56) {
      oscillator = context.createBufferSource(); 
      const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
      const drumBuffer = context.createBuffer(1, frameCount, context.sampleRate);
      const data = drumBuffer.getChannelData(0);
      
      // High frequency percussion with controlled decay
      const fundamental = drumKey.includes('cowbell') ? 800 : 6000;
      const decayFactor = 0.1;
      
      for (let i = 0; i < frameCount; i++) { 
        const envelope = Math.exp(-i / (context.sampleRate * decayFactor));
        if (drumKey.includes('cowbell')) {
          // Metallic cowbell tone
          data[i] = Math.sin(2 * Math.PI * fundamental * (i/context.sampleRate)) * envelope;
        } else {
          // Shaker/tambourine noise
          data[i] = (Math.random() * 2 - 1) * envelope;
        }
      }
      (oscillator as AudioBufferSourceNode).buffer = drumBuffer;
    }
    
    // Generic percussion fallback for any other drum sounds
    else { 
      console.log(`🥁 Using generic percussion for: "${drumKey}" (MIDI: ${noteNumber})`);
      oscillator = context.createBufferSource(); 
      const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
      const drumBuffer = context.createBuffer(1, frameCount, context.sampleRate);
      const data = drumBuffer.getChannelData(0);
      
      // Generic percussion with moderate decay
      for (let i = 0; i < frameCount; i++) { 
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.1)); 
      }
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
          // Enhanced drum key mapping with more robust pattern matching
          let midiPitch: number | undefined;
          let normalizedDrumKey: string;
          
          console.log(`🥁 Processing drum element: "${drumElementName}"`);
          
          // First try direct lookup
          midiPitch = MIDI_DRUM_MAP[drumElementName];
          normalizedDrumKey = drumElementName;
          
          if (!midiPitch) {
            // Try normalized key (lowercase, replace spaces with underscores)
            const drumKeyClean = drumElementName.toLowerCase().replace(/\s+/g, '_');
            midiPitch = MIDI_DRUM_MAP[drumKeyClean];
            normalizedDrumKey = drumKeyClean;
          }
          
          if (!midiPitch) {
            // Try comprehensive aliases and variations
            const aliases: { [key: string]: { midi: string, key: string } } = {
              'kick_drum': { midi: 'kick', key: 'kick' },
              'bass_drum': { midi: 'kick', key: 'kick' },
              'acoustic_bass_drum': { midi: 'kick', key: 'kick' },
              'snare_drum': { midi: 'snare', key: 'snare' },
              'acoustic_snare': { midi: 'snare', key: 'snare' },
              'hi_hat_closed': { midi: 'hihat_closed', key: 'hihat_closed' },
              'hi_hat_open': { midi: 'open_hihat', key: 'open_hihat' },
              'hihat_open': { midi: 'open_hihat', key: 'open_hihat' },
              'closed_hi_hat': { midi: 'hihat_closed', key: 'hihat_closed' },
              'open_hi_hat': { midi: 'open_hihat', key: 'open_hihat' },
              'crash_cymbal': { midi: 'crash_cymbal_1', key: 'crash_cymbal_1' },
              'crash': { midi: 'crash', key: 'crash_cymbal_1' },
              'ride_cymbal': { midi: 'ride_cymbal_1', key: 'ride_cymbal_1' },
              'ride': { midi: 'ride', key: 'ride_cymbal_1' },
              'hand_clap': { midi: 'clap', key: 'clap' },
              'handclap': { midi: 'clap', key: 'clap' },
              'tom_hi': { midi: 'tom_high', key: 'tom_high' },
              'tom_lo': { midi: 'tom_low', key: 'tom_low' },
              'high_tom': { midi: 'tom_high', key: 'tom_high' },
              'mid_tom': { midi: 'tom_mid', key: 'tom_mid' },
              'low_tom': { midi: 'tom_low', key: 'tom_low' },
              'low_floor_tom': { midi: 'tom_low', key: 'tom_low' },
              'high_floor_tom': { midi: 'tom_high', key: 'tom_high' }
            };
            
            const searchKey = drumElementName.toLowerCase().replace(/\s+/g, '_');
            const aliasMatch = aliases[searchKey];
            if (aliasMatch) {
              midiPitch = MIDI_DRUM_MAP[aliasMatch.midi];
              normalizedDrumKey = aliasMatch.key;
            }
          }
          
          console.log(`🥁 Final mapping: "${drumElementName}" -> "${normalizedDrumKey}" -> MIDI: ${midiPitch}`);
          
          if (typeof midiPitch !== 'number' || !hits) {
            console.warn(`🚨 No MIDI mapping found for drum element: "${drumElementName}"`);
            console.warn('🚨 Available drum mappings:', Object.keys(MIDI_DRUM_MAP));
            return;
          }
          
          hits.forEach((hit: DrumHit) => {
            console.log(`🥁 Scheduling ${normalizedDrumKey} hit:`, hit);
            scheduleNote(midiPitch!, beatsToSeconds(hit.time, tempo), beatsToSeconds(hit.duration, tempo), hit.velocity, true, normalizedDrumKey, trackKey);
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
  
  // Make sure the audio context isn't suspended
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
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
