  import { GeneratedMidiPatterns, MidiSettings, MidiNote, ChordNoteEvent, DrumPatternData, DrumHit, KeyOfGeneratedMidiPatterns } from '../constants/types';
  import { MIDI_DRUM_MAP } from '../constants/constants';

  interface ActiveSourceEntry {
    node: AudioScheduledSourceNode;
    controlGainNode: GainNode;
    trackType: KeyOfGeneratedMidiPatterns;
    intendedVolume: number;
    scheduledStopTime: number;
    isDrum: boolean;
    isScheduled: boolean; // Track if node is scheduled
  }

  // Optimized audio context management
  class AudioContextManager {
    private static instance: AudioContextManager;
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private isInitialized: boolean = false;
    private resumePromise: Promise<void> | null = null;

    static getInstance(): AudioContextManager {
      if (!AudioContextManager.instance) {
        AudioContextManager.instance = new AudioContextManager();
      }
      return AudioContextManager.instance;
    }

    async getAudioContext(): Promise<AudioContext> {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        await this.initializeContext();
      }

      if (this.audioContext.state === 'suspended') {
        await this.resumeContext();
      }

      return this.audioContext!;
    }

    private async initializeContext(): Promise<void> {
      try {
        // Use more specific constructor detection
        const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextConstructor) {
          throw new Error('Web Audio API not supported in this browser');
        }

        this.audioContext = new AudioContextConstructor({
          latencyHint: 'interactive', // Optimize for low latency
          sampleRate: 44100 // Ensure consistent sample rate
        });

        // Create master gain with proper initialization
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.setValueAtTime(0.8, this.audioContext.currentTime); // Set initial volume
        this.masterGain.connect(this.audioContext.destination);

        // Add context state change listener
        this.audioContext.addEventListener('statechange', this.handleStateChange.bind(this));

        this.isInitialized = true;
        console.log('🎵 AudioContext initialized successfully', {
          sampleRate: this.audioContext.sampleRate,
          state: this.audioContext.state,
          baseLatency: this.audioContext.baseLatency
        });

      } catch (error) {
        console.error('🚨 Failed to initialize AudioContext:', error);
        throw new Error(`Audio initialization failed: ${error.message}`);
      }
    }

    private async resumeContext(): Promise<void> {
      if (!this.audioContext || this.audioContext.state !== 'suspended') {
        return;
      }

      // Prevent multiple resume attempts
      if (this.resumePromise) {
        return this.resumePromise;
      }

      this.resumePromise = this.audioContext.resume().then(() => {
        console.log('🎵 AudioContext resumed successfully');
        this.resumePromise = null;
      }).catch((error) => {
        console.error('🚨 Failed to resume AudioContext:', error);
        this.resumePromise = null;
        throw error;
      });

      return this.resumePromise;
    }

    private handleStateChange(): void {
      if (this.audioContext) {
        console.log('🎵 AudioContext state changed:', this.audioContext.state);
      
        if (this.audioContext.state === 'closed') {
          this.cleanup();
        }
      }
    }

    getMasterGain(): GainNode | null {
      return this.masterGain;
    }

    getCurrentTime(): number {
      return this.audioContext?.currentTime || 0;
    }

    getSampleRate(): number {
      return this.audioContext?.sampleRate || 44100;
    }

    getState(): AudioContextState | 'uninitialized' {
      return this.audioContext?.state || 'uninitialized';
    }

    async cleanup(): Promise<void> {
      if (this.audioContext && this.audioContext.state !== 'closed') {
        try {
          await this.audioContext.close();
          console.log('🎵 AudioContext closed successfully');
        } catch (error) {
          console.error('🚨 Error closing AudioContext:', error);
        }
      }
    
      this.audioContext = null;
      this.masterGain = null;
      this.isInitialized = false;
      this.resumePromise = null;
    }

    // Optimized buffer creation with validation
    createBuffer(channels: number, length: number): AudioBuffer {
      if (!this.audioContext) {
        throw new Error('AudioContext not initialized');
      }

      const validatedLength = Math.max(1, Math.floor(length));
      const validatedChannels = Math.max(1, Math.min(channels, 32)); // Reasonable channel limit

      return this.audioContext.createBuffer(validatedChannels, validatedLength, this.audioContext.sampleRate);
    }

    // Optimized oscillator creation
    createOscillator(): OscillatorNode {
      if (!this.audioContext) {
        throw new Error('AudioContext not initialized');
      }
      return this.audioContext.createOscillator();
    }

    // Optimized buffer source creation
    createBufferSource(): AudioBufferSourceNode {
      if (!this.audioContext) {
        throw new Error('AudioContext not initialized');
      }
      return this.audioContext.createBufferSource();
    }

    // Optimized gain node creation
    createGain(): GainNode {
      if (!this.audioContext) {
        throw new Error('AudioContext not initialized');
      }
      return this.audioContext.createGain();
    }
  }

  // Global state management with better organization
  class PlaybackStateManager {
    private static instance: PlaybackStateManager;
    private activeSources: ActiveSourceEntry[] = [];
    private loopTimeoutId: number | null = null;
    private overallPlaybackStartTime: number = 0;
    private currentLoopIteration: number = 0;
    private isGloballyPlaying: boolean = false;
    private lastSettingsForLoopDuration: Pick<MidiSettings, 'tempo' | 'bars' | 'timeSignature'> | null = null;
    private cleanupIntervalId: number | null = null;

    static getInstance(): PlaybackStateManager {
      if (!PlaybackStateManager.instance) {
        PlaybackStateManager.instance = new PlaybackStateManager();
      }
      return PlaybackStateManager.instance;
    }

    constructor() {
      // Start periodic cleanup of finished sources
      this.startPeriodicCleanup();
    }

    private startPeriodicCleanup(): void {
      this.cleanupIntervalId = window.setInterval(() => {
        this.cleanupFinishedSources();
      }, 1000); // Clean up every second
    }

    private cleanupFinishedSources(): void {
      const currentTime = AudioContextManager.getInstance().getCurrentTime();
      const initialCount = this.activeSources.length;
    
      this.activeSources = this.activeSources.filter(source => {
        const isFinished = source.scheduledStopTime <= currentTime;
        if (isFinished) {
          this.safelyDisconnectSource(source);
        }
        return !isFinished;
      });

      if (this.activeSources.length !== initialCount) {
        console.log(`🧹 Cleaned up ${initialCount - this.activeSources.length} finished audio sources`);
      }
    }

    private safelyDisconnectSource(source: ActiveSourceEntry): void {
      try {
        if (source.node) {
          source.node.disconnect();
        }
        if (source.controlGainNode) {
          source.controlGainNode.disconnect();
        }
      } catch (error) {
        // Ignore errors - node might already be disconnected
      }
    }

    addActiveSource(source: ActiveSourceEntry): void {
      this.activeSources.push(source);
    }

    stopAllSources(): void {
      console.log(`🛑 Stopping ${this.activeSources.length} active audio sources`);
    
      this.activeSources.forEach(source => {
        try {
          if (source.node && source.isScheduled) {
            source.node.stop();
          }
          this.safelyDisconnectSource(source);
        } catch (error) {
          // Ignore errors - source might already be stopped
        }
      });
    
      this.activeSources = [];
    }

    setLoopSettings(settings: Pick<MidiSettings, 'tempo' | 'bars' | 'timeSignature'>): void {
      this.lastSettingsForLoopDuration = { ...settings };
    }

    getLoopDurationSeconds(): number {
      if (!this.lastSettingsForLoopDuration) {
        throw new Error("Settings not available for loop duration calculation.");
      }
    
      const { tempo, bars, timeSignature } = this.lastSettingsForLoopDuration;
      const beatsPerBar = timeSignature[0] * (4 / timeSignature[1]);
      return beatsToSeconds(bars * beatsPerBar, tempo);
    }

    // Getters and setters for playback state
    get isPlaying(): boolean { return this.isGloballyPlaying; }
    set isPlaying(value: boolean) { this.isGloballyPlaying = value; }

    get playbackStartTime(): number { return this.overallPlaybackStartTime; }
    set playbackStartTime(value: number) { this.overallPlaybackStartTime = value; }

    get loopIteration(): number { return this.currentLoopIteration; }
    set loopIteration(value: number) { this.currentLoopIteration = value; }

    get loopTimeout(): number | null { return this.loopTimeoutId; }
    set loopTimeout(value: number | null) { 
      if (this.loopTimeoutId !== null) {
        clearTimeout(this.loopTimeoutId);
      }
      this.loopTimeoutId = value; 
    }

    cleanup(): void {
      this.stopAllSources();
      this.loopTimeout = null;
      this.isPlaying = false;
      this.loopIteration = 0;
      this.playbackStartTime = 0;
    
      if (this.cleanupIntervalId !== null) {
        clearInterval(this.cleanupIntervalId);
        this.cleanupIntervalId = null;
      }
    }
  }

  // Optimized utility functions
  const beatsToSeconds = (beats: number, tempo: number): number => {
    if (!Number.isFinite(beats) || !Number.isFinite(tempo) || tempo <= 0) {
      console.error('🚨 Invalid beatsToSeconds parameters:', { beats, tempo });
      return 0;
    }
  
    const result = (beats / tempo) * 60;
    return Number.isFinite(result) ? result : 0;
  };

  // Optimized note scheduling with better error handling
  const scheduleNote = async (
    noteNumber: number,
    startTimeInLoopSeconds: number,
    durationSeconds: number,
    velocity: number = 100,
    isDrum: boolean = false,
    drumTypeKey?: string,
    trackType?: KeyOfGeneratedMidiPatterns
  ) => {
    const contextManager = AudioContextManager.getInstance();
    const stateManager = PlaybackStateManager.getInstance();
  
    try {
      const context = await contextManager.getAudioContext();
      const masterGain = contextManager.getMasterGain();
    
      if (!masterGain || !trackType) {
        console.warn('🚨 Missing masterGain or trackType for note scheduling');
        return;
      }

      // Enhanced input validation
      const validationErrors = [];
      if (!Number.isFinite(noteNumber) || noteNumber < 0 || noteNumber > 127) {
        validationErrors.push(`Invalid MIDI note: ${noteNumber}`);
      }
      if (!Number.isFinite(startTimeInLoopSeconds) || startTimeInLoopSeconds < 0) {
        validationErrors.push(`Invalid start time: ${startTimeInLoopSeconds}`);
      }
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        validationErrors.push(`Invalid duration: ${durationSeconds}`);
      }
      if (!Number.isFinite(velocity) || velocity < 0 || velocity > 127) {
        validationErrors.push(`Invalid velocity: ${velocity}`);
      }

      if (validationErrors.length > 0) {
        console.error('🚨 Note validation failed:', validationErrors.join(', '));
        return;
      }

      const absoluteScheduleTime = stateManager.playbackStartTime + 
        (stateManager.loopIteration * stateManager.getLoopDurationSeconds()) + 
        startTimeInLoopSeconds;
    
      // Skip notes that are too far in the past
      if (absoluteScheduleTime < context.currentTime - 0.1) {
        return;
      }

      // Create and configure gain node with validation
      const controlGainNode = contextManager.createGain();
      const intendedVolume = Math.max(0, Math.min(1, (velocity / 127) * (isDrum ? 0.75 : 0.35)));
    
      controlGainNode.gain.setValueAtTime(intendedVolume, absoluteScheduleTime);
    
      if (intendedVolume > 0.0001) {
        try {
          controlGainNode.gain.exponentialRampToValueAtTime(0.0001, absoluteScheduleTime + durationSeconds);
        } catch (e) {
          controlGainNode.gain.linearRampToValueAtTime(0.0001, absoluteScheduleTime + durationSeconds);
        }
      }
    
      controlGainNode.connect(masterGain);

      let oscillator: AudioScheduledSourceNode;
      let isScheduled = false;

      if (isDrum) {
        oscillator = await createDrumSound(contextManager, noteNumber, drumTypeKey, durationSeconds, absoluteScheduleTime);
      } else {
        oscillator = createTonalSound(contextManager, noteNumber, absoluteScheduleTime);
      }

      if (oscillator) {
        oscillator.connect(controlGainNode);
        oscillator.start(absoluteScheduleTime);
        oscillator.stop(absoluteScheduleTime + durationSeconds);
        isScheduled = true;

        stateManager.addActiveSource({
          node: oscillator,
          controlGainNode,
          trackType,
          intendedVolume,
          scheduledStopTime: absoluteScheduleTime + durationSeconds,
          isDrum,
          isScheduled
        });
      }

    } catch (error) {
      console.error('🚨 Error scheduling note:', error, {
        noteNumber,
        startTimeInLoopSeconds,
        durationSeconds,
        velocity,
        isDrum,
        drumTypeKey,
        trackType
      });
    }
  };

  // Optimized drum sound creation
  const createDrumSound = async (
    contextManager: AudioContextManager,
    noteNumber: number,
    drumTypeKey: string = '',
    durationSeconds: number,
    absoluteScheduleTime: number
  ): Promise<AudioScheduledSourceNode | null> => {
    try {
      const context = await contextManager.getAudioContext();
      const sampleRate = contextManager.getSampleRate();
    
      console.log(`🥁 Creating drum sound: "${drumTypeKey}" (MIDI: ${noteNumber})`);
    
      // Enhanced drum key mapping with fallback
      const drumKey = drumTypeKey.toLowerCase();
    
      // Kick drum synthesis (MIDI 36)
      if (drumKey.includes('kick') || drumKey.includes('bass_drum') || noteNumber === 36) {
        const kickOsc = contextManager.createOscillator();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(150, absoluteScheduleTime);
        kickOsc.frequency.exponentialRampToValueAtTime(50, absoluteScheduleTime + Math.min(durationSeconds, 0.12));
      
        const kickEnvGain = contextManager.createGain();
        kickEnvGain.gain.setValueAtTime(1, absoluteScheduleTime);
        kickEnvGain.gain.exponentialRampToValueAtTime(0.001, absoluteScheduleTime + durationSeconds);
      
        kickOsc.connect(kickEnvGain);
        return kickOsc;
      }
    
      // Snare drum synthesis (MIDI 38)
      else if (drumKey.includes('snare') || noteNumber === 38) {
        return createNoiseBasedDrum(contextManager, durationSeconds, 0.05, 'snare');
      }
    
      // Clap synthesis (MIDI 39)
      else if (drumKey.includes('clap') || drumKey.includes('hand_clap') || noteNumber === 39) {
        return createNoiseBasedDrum(contextManager, durationSeconds, 0.03, 'clap');
      }
    
      // Hi-hat synthesis (MIDI 42 closed, 46 open)
      else if (drumKey.includes('hat') || drumKey.includes('hihat') || noteNumber === 42 || noteNumber === 46) {
        const isOpen = drumKey.includes('open') || noteNumber === 46;
        return createCymbalSound(contextManager, durationSeconds, 5000, isOpen ? 0.15 : 0.03);
      }
    
      // Crash cymbal synthesis (MIDI 49)
      else if (drumKey.includes('crash') || drumKey.includes('cymbal') || noteNumber === 49) {
        return createCymbalSound(contextManager, durationSeconds, 4000, 0.25);
      }
    
      // Ride cymbal synthesis (MIDI 51)
      else if (drumKey.includes('ride') || noteNumber === 51) {
        return createCymbalSound(contextManager, durationSeconds, 3000, 0.15, true);
      }
    
      // Tom synthesis (MIDI 41, 47, 50)
      else if (drumKey.includes('tom') || noteNumber === 41 || noteNumber === 47 || noteNumber === 50) {
        let startFreq = 200;
        if (drumKey.includes('high') || noteNumber === 50) startFreq = 300;
        else if (drumKey.includes('mid') || noteNumber === 47) startFreq = 200;
        else if (drumKey.includes('low') || noteNumber === 41) startFreq = 120;
      
        const tomOsc = contextManager.createOscillator();
        tomOsc.type = 'sine';
        tomOsc.frequency.setValueAtTime(startFreq, absoluteScheduleTime);
        tomOsc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, absoluteScheduleTime + durationSeconds * 0.8);
      
        const tomEnvGain = contextManager.createGain();
        tomEnvGain.gain.setValueAtTime(0.9, absoluteScheduleTime);
        tomEnvGain.gain.exponentialRampToValueAtTime(0.001, absoluteScheduleTime + durationSeconds);
      
        tomOsc.connect(tomEnvGain);
        return tomOsc;
      }
    
      // Other percussion (shaker, tambourine, cowbell, etc.)
      else if (drumKey.includes('shaker') || drumKey.includes('tambourine') || drumKey.includes('cowbell') || 
               noteNumber === 70 || noteNumber === 54 || noteNumber === 56) {
        const fundamental = drumKey.includes('cowbell') ? 800 : 6000;
        if (drumKey.includes('cowbell')) {
          return createMetallicSound(contextManager, durationSeconds, fundamental);
        } else {
          return createNoiseBasedDrum(contextManager, durationSeconds, 0.1, 'percussion');
        }
      }
    
      // Generic percussion fallback
      else {
        console.log(`🥁 Using generic percussion for: "${drumKey}" (MIDI: ${noteNumber})`);
        return createNoiseBasedDrum(contextManager, durationSeconds, 0.1, 'generic');
      }
    
    } catch (error) {
      console.error('🚨 Error creating drum sound:', error);
      return null;
    }
  };

  // Optimized noise-based drum creation with better memory management
  const createNoiseBasedDrum = (
    contextManager: AudioContextManager,
    durationSeconds: number,
    decayFactor: number,
    drumType: 'snare' | 'clap' | 'percussion' | 'generic'
  ): AudioBufferSourceNode => {
    const sampleRate = contextManager.getSampleRate();
    const frameCount = Math.max(1, Math.min(Math.floor(sampleRate * durationSeconds), sampleRate * 2)); // Cap at 2 seconds
    
    const bufferSource = contextManager.createBufferSource();
    const drumBuffer = contextManager.createBuffer(1, frameCount, sampleRate);
    const data = drumBuffer.getChannelData(0);
    
    // Optimized noise generation based on drum type
    switch (drumType) {
      case 'snare':
        for (let i = 0; i < frameCount; i++) {
          const envelope = Math.exp(-i / (sampleRate * decayFactor));
          data[i] = (Math.random() * 2 - 1) * envelope;
        }
        break;
        
      case 'clap':
        for (let i = 0; i < frameCount; i++) {
          const envelope = Math.exp(-i / (sampleRate * decayFactor));
          const noise = (Math.random() * 2 - 1);
          const burstPattern = Math.sin(i * 0.01) > 0.5 ? 1 : 0.3;
          data[i] = noise * envelope * burstPattern;
        }
        break;
        
      default:
        for (let i = 0; i < frameCount; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * decayFactor));
        }
    }
    
    bufferSource.buffer = drumBuffer;
    return bufferSource;
  };

  // Optimized cymbal sound creation
  const createCymbalSound = (
    contextManager: AudioContextManager,
    durationSeconds: number,
    fundamental: number,
    decayFactor: number,
    isRide: boolean = false
  ): AudioBufferSourceNode => {
    const sampleRate = contextManager.getSampleRate();
    const frameCount = Math.max(1, Math.min(Math.floor(sampleRate * durationSeconds), sampleRate * 3)); // Cap at 3 seconds
    
    const bufferSource = contextManager.createBufferSource();
    const drumBuffer = contextManager.createBuffer(1, frameCount, sampleRate);
    const data = drumBuffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
      const envelope = Math.exp(-i / (sampleRate * decayFactor));
      const time = i / sampleRate;
      
      if (isRide) {
        // Ride cymbal with bell component
        const bell = Math.sin(2 * Math.PI * fundamental * time);
        const ping = Math.sin(2 * Math.PI * fundamental * 2.5 * time) * 0.3;
        data[i] = (bell + ping) * envelope;
      } else {
        // Regular cymbal with harmonics
        const harmonic1 = Math.sin(2 * Math.PI * fundamental * time);
        const harmonic2 = Math.sin(2 * Math.PI * fundamental * 1.5 * time);
        const noise = (Math.random() * 2 - 1) * 0.3;
        data[i] = (harmonic1 + harmonic2 * 0.7 + noise) * envelope;
      }
    }
    
    bufferSource.buffer = drumBuffer;
    return bufferSource;
  };

  // Optimized metallic sound creation
  const createMetallicSound = (
    contextManager: AudioContextManager,
    durationSeconds: number,
    fundamental: number
  ): AudioBufferSourceNode => {
    const sampleRate = contextManager.getSampleRate();
    const frameCount = Math.max(1, Math.floor(sampleRate * durationSeconds));
    
    const bufferSource = contextManager.createBufferSource();
    const drumBuffer = contextManager.createBuffer(1, frameCount, sampleRate);
    const data = drumBuffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
      const envelope = Math.exp(-i / (sampleRate * 0.1));
      const time = i / sampleRate;
      data[i] = Math.sin(2 * Math.PI * fundamental * time) * envelope;
    }
    
    bufferSource.buffer = drumBuffer;
    return bufferSource;
  };

  // Optimized tonal sound creation
  const createTonalSound = (
    contextManager: AudioContextManager,
    noteNumber: number,
    absoluteScheduleTime: number
  ): OscillatorNode => {
    const oscillator = contextManager.createOscillator();
    oscillator.type = 'sawtooth';
    
    const freq = 440 * Math.pow(2, (noteNumber - 69) / 12);
    
    // Validate frequency
    if (!Number.isFinite(freq) || freq <= 0 || freq > 20000) {
      console.error('🚨 Invalid frequency calculated:', freq, 'for note number:', noteNumber);
      oscillator.frequency.setValueAtTime(440, absoluteScheduleTime); // Fallback to A4
    } else {
      oscillator.frequency.setValueAtTime(freq, absoluteScheduleTime);
    }
    
    return oscillator;
  };

  // Optimized main playback function
  export const playMidiPatterns = async (
    patterns: GeneratedMidiPatterns,
    settings: Pick<MidiSettings, 'tempo' | 'bars' | 'timeSignature'>,
    trackToPlay?: KeyOfGeneratedMidiPatterns
  ) => {
    console.log('🎵 Starting optimized playback with patterns:', patterns);
    console.log('🎵 Settings:', settings);
    console.log('🎵 Track to play:', trackToPlay);
    
    const contextManager = AudioContextManager.getInstance();
    const stateManager = PlaybackStateManager.getInstance();
    
    try {
      // Initialize audio context
      const context = await contextManager.getAudioContext();
      
      // Stop any existing playback
      await stopPlaybackInternal(false);
      
      stateManager.isPlaying = true;
      stateManager.loopIteration = 0;
      stateManager.setLoopSettings(settings);
      stateManager.playbackStartTime = context.currentTime;

      const loopDurationSec = stateManager.getLoopDurationSeconds();
      console.log('🎵 Loop duration:', loopDurationSec, 'seconds');
      
      if (loopDurationSec <= 0) {
        throw new Error("Invalid loop duration calculated");
      }
      
      await scheduleLoopContent(patterns, settings, trackToPlay, contextManager, stateManager);
      
    } catch (error) {
      console.error('🚨 Error in playMidiPatterns:', error);
      stateManager.isPlaying = false;
      throw error;
    }
  };

  // Optimized loop scheduling with better error handling
  const scheduleLoopContent = async (
    patterns: GeneratedMidiPatterns,
    settings: Pick<MidiSettings, 'tempo' | 'bars' | 'timeSignature'>,
    trackToPlay: KeyOfGeneratedMidiPatterns | undefined,
    contextManager: AudioContextManager,
    stateManager: PlaybackStateManager
  ) => {
    if (!stateManager.isPlaying) return;

    try {
      const context = await contextManager.getAudioContext();
      const tempo = settings.tempo;

      // Determine which tracks to schedule
      const tracksToSchedule: KeyOfGeneratedMidiPatterns[] = trackToPlay ? [trackToPlay] : ['chords', 'bassline', 'melody', 'drums'];

      // Schedule each track with optimized processing
      for (const trackKey of tracksToSchedule) {
        const trackData = patterns[trackKey];
        if (trackData) {
          await scheduleTrackData(trackKey, trackData, tempo);
        }
      }

      // Schedule next loop iteration with drift compensation
      if (stateManager.isPlaying) {
        const nextLoopTime = stateManager.playbackStartTime + ((stateManager.loopIteration + 1) * stateManager.getLoopDurationSeconds());
        let delayMilliseconds = Math.max(10, (nextLoopTime - context.currentTime) * 1000);

        stateManager.loopTimeout = window.setTimeout(async () => {
          if (!stateManager.isPlaying) return;
          stateManager.loopIteration++;
          await scheduleLoopContent(patterns, settings, trackToPlay, contextManager, stateManager);
        }, delayMilliseconds);
      }

    } catch (error) {
      console.error('🚨 Error in scheduleLoopContent:', error);
      stateManager.isPlaying = false;
    }
  };

  // Optimized track scheduling
  const scheduleTrackData = async (
    trackKey: KeyOfGeneratedMidiPatterns,
    data: MidiNote[] | ChordNoteEvent[] | DrumPatternData,
    tempo: number
  ) => {
    console.log(`🎵 Scheduling track: ${trackKey}`, data);

    if (trackKey === 'drums' && typeof data === 'object' && !Array.isArray(data)) {
      // Handle drum patterns
      const drumData = data as DrumPatternData;
      
      for (const [drumElementName, hits] of Object.entries(drumData)) {
        if (!hits || !Array.isArray(hits)) continue;
        
        const midiPitch = getDrumMidiPitch(drumElementName);
        const normalizedDrumKey = normalizeDrumKey(drumElementName);
        
        if (typeof midiPitch !== 'number') {
          console.warn(`🚨 No MIDI mapping found for drum element: "${drumElementName}"`);
          continue;
        }
        
        const hitPromises = hits.map(async (hit: DrumHit) => {
          if (!hit || typeof hit.time !== 'number' || typeof hit.duration !== 'number') {
            console.warn('🚨 Invalid drum hit data:', hit);
            return;
          }
        
          return scheduleNote(
            midiPitch,
            beatsToSeconds(hit.time, tempo),
            beatsToSeconds(hit.duration, tempo),
            hit.velocity || 100,
            true,
            normalizedDrumKey,
            trackKey
          );
        });
        
        await Promise.all(hitPromises);
      }
    } else if (Array.isArray(data)) {
      // Handle melodic patterns
      const eventPromises = (data as Array<MidiNote | ChordNoteEvent>).map(async (event, index) => {
        if (!event || typeof event.time !== 'number' || typeof event.duration !== 'number') {
          console.warn(`🚨 Invalid ${trackKey} event at index ${index}:`, event);
          return;
        }
        
        const isChord = 'notes' in event;
        
        if (isChord) {
          const chordEvent = event as ChordNoteEvent;
          if (!chordEvent.notes || !Array.isArray(chordEvent.notes)) {
            console.warn('🚨 Invalid chord notes:', chordEvent);
            return;
          }
        
          const notePromises = chordEvent.notes.map(async (note, noteIndex) => {
            if (!note || typeof note.midi !== 'number') {
              console.warn(`🚨 Invalid chord note at ${index}.${noteIndex}:`, note);
              return;
            }
            
            return scheduleNote(
              note.midi,
              beatsToSeconds(event.time, tempo),
              beatsToSeconds(event.duration, tempo),
              event.velocity || 100,
              false,
              undefined,
              trackKey
            );
          });
        
          await Promise.all(notePromises);
        } else {
          const noteEvent = event as MidiNote;
          if (typeof noteEvent.midi !== 'number') {
            console.warn(`🚨 Invalid MIDI note at index ${index}:`, noteEvent);
            return;
          }
        
          return scheduleNote(
            noteEvent.midi,
            beatsToSeconds(event.time, tempo),
            beatsToSeconds(event.duration, tempo),
            event.velocity || 100,
            false,
            undefined,
            trackKey
          );
        }
      });
    
      await Promise.all(eventPromises);
    }
  };

// Optimized drum mapping functions
const getDrumMidiPitch = (drumElementName: string): number | undefined => {
  // Direct lookup first
  let midiPitch = MIDI_DRUM_MAP[drumElementName];
  if (midiPitch) return midiPitch;
  
  // Normalized key lookup
  const drumKeyClean = drumElementName.toLowerCase().replace(/\s+/g, '_');
  midiPitch = MIDI_DRUM_MAP[drumKeyClean];
  if (midiPitch) return midiPitch;
  
  // Comprehensive aliases lookup
  const aliases: { [key: string]: string } = {
    'kick_drum': 'kick',
    'bass_drum': 'kick',
    'acoustic_bass_drum': 'kick',
    'snare_drum': 'snare',
    'acoustic_snare': 'snare',
    'hi_hat_closed': 'hihat_closed',
    'hi_hat_open': 'open_hihat',
    'hihat_open': 'open_hihat',
    'closed_hi_hat': 'hihat_closed',
    'open_hi_hat': 'open_hihat',
    'crash_cymbal': 'crash_cymbal_1',
    'crash': 'crash_cymbal_1',
    'ride_cymbal': 'ride_cymbal_1',
    'ride': 'ride_cymbal_1',
    'hand_clap': 'clap',
    'handclap': 'clap',
    'tom_hi': 'tom_high',
    'tom_lo': 'tom_low',
    'high_tom': 'tom_high',
    'mid_tom': 'tom_mid',
    'low_tom': 'tom_low',
    'low_floor_tom': 'tom_low',
    'high_floor_tom': 'tom_high'
  };
  
  const aliasKey = aliases[drumKeyClean];
  return aliasKey ? MIDI_DRUM_MAP[aliasKey] : undefined;
};

const normalizeDrumKey = (drumElementName: string): string => {
  const drumKeyClean = drumElementName.toLowerCase().replace(/\s+/g, '_');
  
  // Return the most appropriate normalized key for synthesis
  const keyMappings: { [key: string]: string } = {
    'kick_drum': 'kick',
    'bass_drum': 'kick',
    'snare_drum': 'snare',
    'hi_hat_closed': 'hihat_closed',
    'hi_hat_open': 'hihat_open',
    'crash_cymbal': 'crash',
    'ride_cymbal': 'ride',
    'hand_clap': 'clap'
  };
  
  return keyMappings[drumKeyClean] || drumKeyClean;
};

// Optimized stop functions
export const stopPlayback = async (): Promise<void> => {
  const stateManager = PlaybackStateManager.getInstance();
  stateManager.isPlaying = false;
  await stopPlaybackInternal(true);
  
  // Ensure audio context is ready for next playback
  const contextManager = AudioContextManager.getInstance();
  try {
    const context = await contextManager.getAudioContext();
    if (context.state === 'suspended') {
      await context.resume();
    }
  } catch (error) {
    console.error('🚨 Error resuming audio context after stop:', error);
  }
};

const stopPlaybackInternal = async (resetLoopIterationAndTime: boolean): Promise<void> => {
  const stateManager = PlaybackStateManager.getInstance();
  
  // Clear timeout
  stateManager.loopTimeout = null;
  
  // Stop all active sources
  stateManager.stopAllSources();
  
  if (resetLoopIterationAndTime) {
    stateManager.loopIteration = 0;
    stateManager.playbackStartTime = 0;
  }
  
  console.log('🛑 Playback stopped successfully');
};

// Optimized initialization with user gesture handling
export const initializeAudio = async (): Promise<void> => {
  const contextManager = AudioContextManager.getInstance();
  
  try {
    const context = await contextManager.getAudioContext();
    console.log('🎵 Audio initialized successfully:', {
      state: context.state,
      sampleRate: context.sampleRate,
      baseLatency: context.baseLatency
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('🚨 Failed to initialize audio:', error);
    throw new Error(`Audio initialization failed: ${error.message}`);
  }
};

// Optimized file upload with better error handling
export const uploadAudio = async (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('audio/')) {
      reject(new Error(`Invalid file type: ${file.type}. Expected audio file.`));
      return;
    }
    
    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      reject(new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 100MB.`));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        if (reader.result && typeof reader.result === 'string') {
          const parts = reader.result.split(',');
          if (parts.length !== 2) {
            throw new Error('Invalid file data format');
          }
          
          const base64Data = parts[1];
          const mimeTypeMatch = parts[0].match(/data:(.*);base64/);
          const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : file.type || 'audio/mpeg';
          
          // Validate base64 data
          if (!base64Data || base64Data.length === 0) {
            throw new Error('Empty file data');
          }
          
          resolve({ base64: base64Data, mimeType });
        } else {
          throw new Error('Failed to read file data');
        }
      } catch (error) {
        reject(new Error(`File processing failed: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error(`File reading failed: ${reader.error?.message || 'Unknown error'}`));
    };
    
    reader.onabort = () => {
      reject(new Error('File reading was aborted'));
    };
    
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      reject(new Error(`Failed to start file reading: ${error.message}`));
    }
  });
};

// Performance monitoring and diagnostics
export const getAudioPerformanceStats = (): {
  contextState: AudioContextState | 'uninitialized';
  activeSources: number;
  sampleRate: number;
  currentTime: number;
  isPlaying: boolean;
  loopIteration: number;
} => {
  const contextManager = AudioContextManager.getInstance();
  const stateManager = PlaybackStateManager.getInstance();
  
  return {
    contextState: contextManager.getState(),
    activeSources: stateManager['activeSources'].length, // Access private property for diagnostics
    sampleRate: contextManager.getSampleRate(),
    currentTime: contextManager.getCurrentTime(),
    isPlaying: stateManager.isPlaying,
    loopIteration: stateManager.loopIteration
  };
};

// Cleanup function for app shutdown
export const cleanupAudio = async (): Promise<void> => {
  console.log('🧹 Cleaning up audio resources...');
  
  const stateManager = PlaybackStateManager.getInstance();
  const contextManager = AudioContextManager.getInstance();
  
  // Stop playback and clean up state
  await stopPlayback();
  stateManager.cleanup();
  
  // Close audio context
  await contextManager.cleanup();
  
  console.log('🧹 Audio cleanup completed');
};

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cleanupAudio().catch(console.error);
  });
  
  // Handle visibility change to pause/resume appropriately
  document.addEventListener('visibilitychange', async () => {
    const contextManager = AudioContextManager.getInstance();
    
    if (document.hidden) {
      // Page is hidden, audio context might be suspended
      console.log('🎵 Page hidden, audio context may suspend');
    } else {
      // Page is visible again, ensure audio context is running
      try {
        const context = await contextManager.getAudioContext();
        if (context.state === 'suspended') {
          await context.resume();
          console.log('🎵 Audio context resumed after page visibility change');
        }
      } catch (error) {
        console.error('🚨 Error resuming audio context:', error);
      }
    }
  });
}

// Export singleton instances for external access if needed
export const audioContextManager = AudioContextManager.getInstance();
export const playbackStateManager = PlaybackStateManager.getInstance();
