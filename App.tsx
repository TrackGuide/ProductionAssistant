<<<<<<< HEAD
import React, { useEffect } from 'react';
import { useAppStore } from './src/store/useAppStore';
import { useAuthStore } from './src/store/useAuthStore';
import { LandingPage } from './src/components/LandingPage';
import { TrackGuideView } from './src/components/TrackGuideView';
import { MixFeedbackView } from './src/components/MixFeedbackView';
import { RemixGuideAI } from './src/components/RemixGuideAI';
import { PatchGuide } from './src/components/PatchGuide';
import { EQGuide } from './src/components/EQGuide';
import { LoginPage } from './src/components/LoginPage';
import { RegisterPage } from './src/components/RegisterPage';
import { SavePromptModal } from './src/components/SavePromptModal';
import { Button } from './src/components/Button';
import { UserIcon } from './src/components/icons';
import { APP_TITLE } from './src/constants/constants';
=======
// App.tsx - New modular architecture with feature-based structure
import React, { useState, useRef, useEffect } from 'react';
import { useUser } from './src/context/UserContext';
import { GuidebookEntry, UserInputs, GeneratedMidiPatterns, ActiveView } from './src/constants/types';
import { 
  LOCAL_STORAGE_KEY, 
  LAST_USED_DAW_KEY, 
  LAST_USED_PLUGINS_KEY, 
  MIDI_SCALES 
} from './src/constants/constants';
import { stopPlayback } from './src/services/audioService';
// ...existing code...
>>>>>>> de701982 (Implement and fix save logic for all AI features and resolve lint/type errors)

// Custom TrackGuide Logo Component
const TrackGuideLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} bg-orange-500 transform rotate-45 flex items-center justify-center`}>
    <div className="w-1/2 h-1/2 bg-white transform -rotate-45"></div>
  </div>
);

<<<<<<< HEAD
=======

const initialInputsState: UserInputs = {
  songTitle: '',
  genre: [],
  artistReference: '',
  referenceTrackLink: '',
  lyrics: '',
  key: '',
  scale: '',
  chords: '',
  generalNotes: '',
  vibe: [],
  daw: '',
  plugins: '',
  availableInstruments: '',
};

const initialMixFeedbackInputsState: {
  audioFile: File | null;
  userNotes: string;
  trackName: string;
  dawName: string;
} = {
  audioFile: null,
  userNotes: '',
  trackName: '',
  dawName: '',
};

const MAX_AUDIO_FILE_SIZE_MB = 100;
const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;


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
        return Math.round((parseInt(match[1], 10) + parseInt(match[2], 10)) / 2);
      } else if (match[1]) {
        // Single BPM found
        return parseInt(match[1], 10);
      }
    }
  }
  return null;
};

export const parseKeyFromGuidebook = (content: string): string | null => {
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
};

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

const extractSectionContent = (markdownText: string, sectionTitleRegex: RegExp): string => {
  const match = markdownText.match(sectionTitleRegex);
  if (!match || typeof match.index === 'undefined') return "";

  const startIndex = match.index;
  const nextSectionMatch = markdownText.substring(startIndex + match[0].length).match(/^##\s+/m);
  const endIndex = nextSectionMatch && typeof nextSectionMatch.index !== 'undefined' 
                   ? startIndex + match[0].length + nextSectionMatch.index 
                   : markdownText.length;
  
  return markdownText.substring(startIndex, endIndex).trim();
};


const extractEssentialMidiContext = (guidebookContent: string): string => {
  if (!guidebookContent) return "";
  
  let essentialContext = "";

  const overviewSectionRegex = /^##\s*1\.\s*Song Overview/im;
  essentialContext += extractSectionContent(guidebookContent, overviewSectionRegex) + "\n\n";
  
  const harmonySectionRegex = /^##\s*4\.\s*Harmony, Melody & Rhythmic Core/im;
  essentialContext += extractSectionContent(guidebookContent, harmonySectionRegex);
  
  return essentialContext.trim() || "General musical context not fully parsed. Focus on genre and vibe.";
};



const parseSuggestedTitleFromMarkdownStream = (markdownText: string): string | null => {
  const match = markdownText.match(/^\s*-\s*\*\*Suggested Title:\*\*\s*(.*)/im);
  if (match && match[1]) {
    return match[1].trim().replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
  }
  return null;
};


>>>>>>> de701982 (Implement and fix save logic for all AI features and resolve lint/type errors)
const App: React.FC = () => {
  const { activeView, setActiveView } = useAppStore();
  const { 
    user, 
    isAuthenticated, 
    checkAuth, 
    logout,
    saveGeneration
  } = useAuthStore();

<<<<<<< HEAD
  // Save prompt modal state
  const [showSavePrompt, setShowSavePrompt] = React.useState(false);
  const [pendingSaveData, setPendingSaveData] = React.useState<any>(null);
  const [pendingSaveType, setPendingSaveType] = React.useState<'trackGuide' | 'mixFeedback' | 'mixCompare' | 'remixGuide' | 'patchGuide' | null>(null);
=======
  // Mix Feedback State
  const [mixFeedbackInputs, setMixFeedbackInputs] = useState<{
    audioFile: File | null;
    userNotes: string;
    trackName: string;
    dawName: string;
  }>(initialMixFeedbackInputsState);
  const [mixFeedbackResult, setMixFeedbackResult] = useState<string | null>(null);
  const [streamingMixFeedback, setStreamingMixFeedback] = useState<string>('');
  const [isGeneratingMixFeedback, setIsGeneratingMixFeedback] = useState<boolean>(false);
  const [mixFeedbackError, setMixFeedbackError] = useState<string | null>(null);
  const [mixFeedbackTab, setMixFeedbackTab] = useState<'single' | 'compare'>('single');

  // Mix Comparison State
  const [mixCompareInputs, setMixCompareInputs] = useState<{
    mixA: File | null;
    mixB: File | null;
    userNotes: string;
    includeMixBFeedback?: boolean;
  }>({
    mixA: null,
    mixB: null,
    userNotes: '',
    includeMixBFeedback: false
  });
  const [mixCompareResult, setMixCompareResult] = useState<string | null>(null);
  const [streamingMixComparison, setStreamingMixComparison] = useState<string>('');
  const [isGeneratingMixComparison, setIsGeneratingMixComparison] = useState<boolean>(false);
  const [mixCompareError, setMixCompareError] = useState<string | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Additional guide content state for AI Assistant context
  const [remixGuideContent, setRemixGuideContent] = useState<string>('');
  const [patchGuideContent, setPatchGuideContent] = useState<string>('');

  const genreInputRef = useRef<HTMLInputElement>(null);
  const vibeInputRef = useRef<HTMLInputElement>(null);
>>>>>>> de701982 (Implement and fix save logic for all AI features and resolve lint/type errors)

  useEffect(() => {
    // Check authentication status on app load
    checkAuth();
  }, [checkAuth]);

  // Save prompt handlers
  const handleSaveToCloud = async (title: string, tags: string[]) => {
    if (!pendingSaveData || !pendingSaveType) return;

    try {
      await saveGeneration({
        type: pendingSaveType,
        title,
        content: pendingSaveData.content,
        inputs: pendingSaveData.inputs,
        tags
      });
      
      setShowSavePrompt(false);
      setPendingSaveData(null);
      setPendingSaveType(null);
      
      // Show success message (you might want to add a toast system)
      console.log('Saved to cloud library successfully!');
    } catch (error) {
      console.error('Failed to save to cloud:', error);
    }
  };

<<<<<<< HEAD
  const handleSavePrompt = (type: 'trackGuide' | 'mixFeedback' | 'mixCompare' | 'remixGuide' | 'patchGuide', data: any) => {
    if (!isAuthenticated) {
      // Show login prompt
      if (confirm('You need to be logged in to save generations. Would you like to go to the login page?')) {
        setActiveView('login');
      }
=======
  // --- Auth Modal State ---
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSaveType, setPendingSaveType] = useState<null | 'trackGuide' | 'mixFeedback' | 'mixCompare' | 'remixGuide' | 'patchGuide'>(null);
  const { user, isGuest, login, register, continueAsGuest } = useUser();

  // --- Save Handlers for all AI features ---
  const handleSaveToLibrary = (type: 'trackGuide' | 'mixFeedback' | 'mixCompare' | 'remixGuide' | 'patchGuide' = 'trackGuide') => {
    // For each type, you can add more logic as needed
    if (!user && !isGuest) {
      setPendingSaveType(type);
      setShowAuthModal(true);
      return;
    }

    // --- TrackGuide ---
    if (type === 'trackGuide') {
      if (!activeGuidebookDetails) return;
      const entryToSave: GuidebookEntry = { ...activeGuidebookDetails };
      setLibrary(prev => {
        const existingIndex = prev.findIndex(item => item.id === entryToSave.id);
        if (existingIndex > -1) {
          const updatedLibrary = [...prev];
          updatedLibrary[existingIndex] = entryToSave;
          return updatedLibrary;
        }
        return [entryToSave, ...prev];
      });
      setPendingSaveType(null);
      return;
    }

    // --- Mix Feedback ---
    if (type === 'mixFeedback') {
      if (!mixFeedbackResult || !mixFeedbackInputs.audioFile) return;
      const newEntry: GuidebookEntry = {
        id: Date.now().toString(),
        title: mixFeedbackInputs.audioFile.name || 'Mix Feedback',
        genre: [],
        artistReference: '',
        referenceTrackLink: '',
        lyrics: '',
        key: '',
        scale: '',
        chords: '',
        generalNotes: '',
        vibe: [],
        daw: '',
        plugins: '',
        availableInstruments: '',
        content: mixFeedbackResult,
        createdAt: new Date().toISOString(),
        midiSettings: undefined,
        generatedMidiPatterns: undefined,
        // custom fields
        type: 'mixFeedback',
        userNotes: mixFeedbackInputs.userNotes,
        audioFileName: mixFeedbackInputs.audioFile.name,
      } as GuidebookEntry;
      setLibrary(prev => [newEntry, ...prev]);
      setPendingSaveType(null);
      return;
    }

    // --- Mix Compare ---
    if (type === 'mixCompare') {
      if (!mixCompareResult || !mixCompareInputs.mixA || !mixCompareInputs.mixB) return;
      const newEntry: GuidebookEntry = {
        id: Date.now().toString(),
        title: `${mixCompareInputs.mixA.name} vs ${mixCompareInputs.mixB.name}`,
        genre: [],
        artistReference: '',
        referenceTrackLink: '',
        lyrics: '',
        key: '',
        scale: '',
        chords: '',
        generalNotes: '',
        vibe: [],
        daw: '',
        plugins: '',
        availableInstruments: '',
        content: mixCompareResult,
        createdAt: new Date().toISOString(),
        midiSettings: undefined,
        generatedMidiPatterns: undefined,
        // custom fields
        type: 'mixCompare',
        userNotes: mixCompareInputs.userNotes,
        mixAFileName: mixCompareInputs.mixA.name,
        mixBFileName: mixCompareInputs.mixB.name,
        includeMixBFeedback: mixCompareInputs.includeMixBFeedback,
      } as GuidebookEntry;
      setLibrary(prev => [newEntry, ...prev]);
      setPendingSaveType(null);
      return;
    }

    // --- RemixGuide ---
    if (type === 'remixGuide') {
      if (!remixGuideContent) return;
      const newEntry: GuidebookEntry = {
        id: Date.now().toString(),
        title: 'Remix Guide',
        genre: [],
        artistReference: '',
        referenceTrackLink: '',
        lyrics: '',
        key: '',
        scale: '',
        chords: '',
        generalNotes: '',
        vibe: [],
        daw: '',
        plugins: '',
        availableInstruments: '',
        content: remixGuideContent,
        createdAt: new Date().toISOString(),
        midiSettings: undefined,
        generatedMidiPatterns: undefined,
        type: 'remixGuide',
      } as GuidebookEntry;
      setLibrary(prev => [newEntry, ...prev]);
      setPendingSaveType(null);
      return;
    }

    // --- PatchGuide ---
    if (type === 'patchGuide') {
      if (!patchGuideContent) return;
      const newEntry: GuidebookEntry = {
        id: Date.now().toString(),
        title: 'Patch Guide',
        genre: [],
        artistReference: '',
        referenceTrackLink: '',
        lyrics: '',
        key: '',
        scale: '',
        chords: '',
        generalNotes: '',
        vibe: [],
        daw: '',
        plugins: '',
        availableInstruments: '',
        content: patchGuideContent,
        createdAt: new Date().toISOString(),
        midiSettings: undefined,
        generatedMidiPatterns: undefined,
        type: 'patchGuide',
      } as GuidebookEntry;
      setLibrary(prev => [newEntry, ...prev]);
      setPendingSaveType(null);
      return;
    }

    setPendingSaveType(null);
  };
  // --- Auth Modal Component ---
  const AuthModal = ({ onClose }: { onClose: () => void }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const handleAuth = (e: React.FormEvent) => {
      e.preventDefault();
      if (!username || !email) {
        setError('Please enter username and email.');
        return;
      }
      if (mode === 'login') login({ username, email });
      else register({ username, email });
      onClose();
      if (pendingSaveType) {
        setTimeout(() => handleSaveToLibrary(pendingSaveType), 0);
      }
    };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-gray-900 rounded-lg shadow-xl p-8 w-full max-w-md border border-orange-500 relative">
          <h2 className="text-2xl font-bold text-orange-400 mb-4 text-center">{mode === 'login' ? 'Login' : 'Register'} to Save</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              className="w-full border p-2 rounded bg-gray-800 text-white"
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <input
              className="w-full border p-2 rounded bg-gray-800 text-white"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <button className="w-full bg-orange-600 text-white py-2 rounded" type="submit">{mode === 'login' ? 'Login' : 'Register'}</button>
          </form>
          <div className="flex justify-between mt-4">
            <button className="text-orange-400 underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
            </button>
            <button className="text-gray-400 underline" onClick={() => { continueAsGuest(); onClose(); setPendingSaveType(null); }}>
              Continue as Guest
            </button>
          </div>
          <button className="absolute top-2 right-3 text-gray-400 hover:text-white text-xl" onClick={onClose}>&times;</button>
        </div>
      </div>
    );
  };
  
  const handleUpdateGuidebookEntryMidi = (midiSettings: MidiSettings, generatedMidiPatterns: GeneratedMidiPatterns) => {
    setActiveGuidebookDetails(prev => {
        if (!prev) return null; 
        // Ensure content (guidebook text) is preserved from the existing state
        return {
            ...prev, 
            midiSettings,
            generatedMidiPatterns,
        };
    });
  };

  const handleLoadFromLibrary = (entry: GuidebookEntry) => {
    setInputs({ 
      songTitle: entry.title, 
      genre: Array.isArray(entry.genre) ? entry.genre : (entry.genre ? [String(entry.genre)] : []),
      artistReference: entry.artistReference,
      referenceTrackLink: entry.referenceTrackLink || '',
      lyrics: entry.lyrics || '',
      key: entry.key || '',
      chords: entry.chords || '',
      generalNotes: entry.generalNotes || '',
      vibe: Array.isArray(entry.vibe) ? entry.vibe : (entry.vibe ? [String(entry.vibe)] : []),
      daw: entry.daw,
      plugins: entry.plugins,
      availableInstruments: entry.availableInstruments || '',
    });
    setCurrentGenreText('');
    setCurrentVibeText('');
    setGeneratedGuidebook(entry.content); // Load full content directly
    setActiveGuidebookDetails(entry); 
    setError(null);
    setMidiError(null);
    setCopyStatus('');
    stopPlayback();
    setShowLibraryModal(false);
    setActiveView('trackGuide'); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFromLibrary = (id: string) => {
    setLibrary(prev => prev.filter(entry => entry.id !== id));
    if (activeGuidebookDetails && activeGuidebookDetails.id === id) {
        setGeneratedGuidebook("");
        setActiveGuidebookDetails(null);
        stopPlayback();
    }
  };
  
  const getFormattedTextFromHtmlElement = (element: HTMLElement): string => {
    let text = '';
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null);
    let currentNode;
    let currentLine = '';
    let listLevel = 0;
  
    const appendLine = (line: string) => {
      text += line + '\n';
      currentLine = '';
    };
  
    const appendToCurrentLine = (str: string) => {
      currentLine += str;
    };
  
    while (currentNode = walker.nextNode()) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        appendToCurrentLine(currentNode.textContent || '');
      } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const el = currentNode as HTMLElement;
        const tagName = el.tagName.toLowerCase();
  
        const blockElements = ['h1', 'h2', 'h3', 'p', 'div', 'ul', 'li', 'table', 'hr', 'tr', 'td', 'th'];
        if (blockElements.includes(tagName) && currentLine.trim() !== '') {
          appendLine(currentLine);
        }
  
        switch (tagName) {
          case 'h1': appendToCurrentLine('# '); break;
          case 'h2': appendToCurrentLine('## '); break;
          case 'h3': appendToCurrentLine('### '); break;
          case 'p': if(text.length > 0 && !text.endsWith('\n\n') && !text.endsWith('\n')) appendLine(''); break; 
          case 'strong': case 'b': appendToCurrentLine('**'); break;
          case 'em': case 'i': appendToCurrentLine('*'); break;
          case 'ul': listLevel++; break;
          case 'li': appendToCurrentLine('  '.repeat(listLevel -1) + '- '); break;
          case 'hr': appendLine('---'); break;
          case 'br': appendLine(currentLine); break; 
          case 'tr': if(currentLine.trim() !== '') appendLine(currentLine); break;
          case 'td': case 'th': appendToCurrentLine('| '); break;
        }
  
        switch (tagName) {
          case 'h1': case 'h2': case 'h3': case 'p':
            appendLine(currentLine);
            appendLine(''); 
            break;
          case 'strong': case 'b': appendToCurrentLine('**'); break;
          case 'em': case 'i': appendToCurrentLine('*'); break;
          case 'ul': listLevel--; if (!text.endsWith('\n')) appendLine(currentLine); break;
          case 'li': appendLine(currentLine); break;
          case 'tr': appendToCurrentLine(' |'); appendLine(currentLine); break; 
          case 'table': if (!text.endsWith('\n')) appendLine(''); break; 
        }
      }
    }
    if (currentLine.trim() !== '') {
      appendLine(currentLine); 
    }
    return text.replace(/\n\s*\n/g, '\n\n').trim();
  };

  // Create clean HTML with black text on white/transparent background
  const createCleanHtmlFromText = (text: string): string => {
    const lines = text.split('\n');
    let html = '<div style="color: #000000; font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; background: transparent;">';
    
    for (const line of lines) {
      if (line.trim() === '') {
        html += '<br>';
      } else if (line.startsWith('## ')) {
        html += `<h2 style="color: #000000; font-size: 1.25rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">${line.replace('## ', '')}</h2>`;
      } else if (line.startsWith('### ')) {
        html += `<h3 style="color: #000000; font-size: 1.1rem; font-weight: bold; margin: 0.75rem 0 0.25rem 0;">${line.replace('### ', '')}</h3>`;
      } else if (line.startsWith('#### ')) {
        html += `<h4 style="color: #000000; font-size: 1rem; font-weight: bold; margin: 0.5rem 0 0.25rem 0;">${line.replace('#### ', '')}</h4>`;
      } else if (line.match(/^\d+\./)) {
        html += `<p style="margin: 0.25rem 0; padding-left: 1rem; color: #000000;">${line}</p>`;
      } else if (line.startsWith('• ') || line.startsWith('- ')) {
        html += `<p style="margin: 0.25rem 0; padding-left: 1rem; color: #000000;">${line}</p>`;
      } else if (line.includes(': ')) {
        // Handle key-value pairs with bold keys
        const colonIndex = line.indexOf(': ');
        const key = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 2);
        html += `<p style="margin: 0.25rem 0; color: #000000;"><strong style="color: #000000;">${key}:</strong> ${value}</p>`;
      } else {
        html += `<p style="margin: 0.5rem 0; color: #000000;">${line}</p>`;
      }
    }
    
    html += '</div>';
    return html;
  };

  const handleCopyFormattedContent = async (elementId: string) => {
    const contentDisplayElement = document.getElementById(elementId);
    if (!contentDisplayElement) {
      setCopyStatus("Content area not found.");
      setTimeout(() => setCopyStatus(''), 3000);
>>>>>>> de701982 (Implement and fix save logic for all AI features and resolve lint/type errors)
      return;
    }

    setPendingSaveType(type);
    setPendingSaveData(data);
    setShowSavePrompt(true);
  };

  const handleLogout = async () => {
    await logout();
    setActiveView('landing');
  };

  // Show login page
  if (activeView === 'login') {
    return (
      <LoginPage 
        onNavigateToRegister={() => setActiveView('register')}
        onNavigateBack={() => setActiveView('landing')}
      />
    );
  }

  // Show register page
  if (activeView === 'register') {
    return (
      <RegisterPage 
        onNavigateToLogin={() => setActiveView('login')}
        onNavigateBack={() => setActiveView('landing')}
      />
    );
  }

  // Show landing page
  if (activeView === 'landing') {
    return (
      <LandingPage 
        onGetStarted={() => {
          setActiveView('trackGuide');
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-gray-100 p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #FF5722 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      {/* Geometric Elements */}
      <div className="absolute top-10 right-10 w-32 h-32 opacity-10 pointer-events-none">
        <div className="w-full h-full border-2 border-orange-500 transform rotate-12 pointer-events-none"></div>
        <div className="absolute top-2 right-2 w-28 h-28 bg-orange-500 transform rotate-12 pointer-events-none"></div>
      </div>
      
      {/* Header */}
      <header className="text-center mb-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center justify-center space-x-3 flex-1">
            <div className="w-8 h-8 bg-orange-500 transform rotate-45 flex items-center justify-center">
              <div className="w-4 h-4 bg-white transform -rotate-45"></div>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {APP_TITLE}
              </h1>
              <p className="text-gray-400 text-lg">Your Smartest Studio Assistant</p>
            </div>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <UserIcon className="w-4 h-4" />
                  <span>{user?.username}</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleLogout}
                  className="text-xs"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setActiveView('login')}
                leftIcon={<UserIcon className="w-4 h-4" />}
                className="text-xs"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setActiveView('landing')}
          className="mt-2 text-sm text-orange-500 hover:text-orange-400 transition-colors font-medium"
        >
          ← Back to Landing
        </button>
      </header>
      
      {/* Navigation */}
      <nav className="mb-8 flex flex-col justify-center items-center md:flex-row md:justify-center gap-2 border-b border-orange-500/20 pb-3 relative z-10">
        <Button
          size="sm"
          className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
            activeView === 'trackGuide'
              ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
              : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
          }`}
          onClick={() => setActiveView('trackGuide')}
          variant={activeView === 'trackGuide' ? 'primary' : 'secondary'}
          leftIcon={<TrackGuideLogo className="w-4 h-4" />}
        >
          TrackGuide AI
        </Button>

        <Button
          size="sm"
          className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
            activeView === 'mixFeedback'
              ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
              : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
          }`}
          onClick={() => setActiveView('mixFeedback')}
          variant={activeView === 'mixFeedback' ? 'primary' : 'secondary'}
          leftIcon={<span className="w-4 h-4 text-center">🎚️</span>}
        >
          Mix Feedback AI
        </Button>

        <Button
          size="sm"
          className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
            activeView === 'remixGuide'
              ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
              : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
          }`}
          onClick={() => setActiveView('remixGuide')}
          variant={activeView === 'remixGuide' ? 'primary' : 'secondary'}
          leftIcon={<span className="w-4 h-4 text-center">🎛️</span>}
        >
          RemixGuide AI
        </Button>

        <Button
          size="sm"
          className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
            activeView === 'patchGuide'
              ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
              : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
          }`}
          onClick={() => setActiveView('patchGuide')}
          variant={activeView === 'patchGuide' ? 'primary' : 'secondary'}
          leftIcon={<span className="w-4 h-4 text-center">🎹</span>}
        >
          PatchGuide AI
        </Button>

        <Button
          size="sm"
          className={`w-full md:w-auto px-3 py-2 text-xs md:text-sm rounded-md transition-all duration-150 ease-in-out ${
            activeView === 'eqGuide'
              ? 'bg-orange-500 shadow-lg hover:bg-orange-600'
              : 'bg-gray-700/80 hover:bg-gray-600/80 border border-gray-600'
          }`}
          onClick={() => setActiveView('eqGuide')}
          variant={activeView === 'eqGuide' ? 'primary' : 'secondary'}
          leftIcon={<span className="w-4 h-4 text-center">🎛️</span>}
        >
          EQ Guide
        </Button>
      </nav>

      {/* Main Content */}
      {activeView === 'trackGuide' && (
<<<<<<< HEAD
        <TrackGuideView onSavePrompt={handleSavePrompt} />
=======
        <div className="max-w-full mx-auto grid grid-cols-1 lg:grid-cols-7 gap-6 px-4">
          <Card title="Blueprint Your Sound" className="lg:col-span-2 bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
            <p className="text-sm text-gray-400 mb-4">Describe your vision—everything's optional.</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Input label="Song Title / Project Name" name="songTitle" value={inputs.songTitle || ''} onChange={handleInputChange} placeholder="AI will suggest one if left blank" />
                </div>
                
                <div>
                  <Input label="Artist References" name="artistReference" value={inputs.artistReference} onChange={handleInputChange} placeholder="e.g., Daft Punk" />
                </div>

                <div>
                  <Input label="Song Reference" name="referenceTrackLink" value={inputs.referenceTrackLink || ''} onChange={handleInputChange} placeholder="e.g., YouTube, Spotify, SoundCloud link" />
                </div>

                <div className="space-y-2">
                  <div>
                    <label htmlFor="genre-input" className="block text-sm font-medium text-gray-300 mb-1.5">Genre(s)</label>
                    <div className="flex items-center gap-2">
                      <Input 
                        ref={genreInputRef}
                        id="genre-input"
                        name="currentGenreText" 
                        value={currentGenreText} 
                        onChange={handleInputChange}
                        onKeyDown={(e) => handleMultiSelectKeyDown(e, 'genre')}
                        placeholder="Type custom genre..." 
                        list="genre-suggestions" 
                        className="flex-grow"
                      />
                      <Button type="button" onClick={() => handleAddMultiSelectItem('genre')} size="sm" variant="secondary" aria-label="Add Genre" className="px-3">
                        <PlusIcon className="w-4 h-4" />
                      </Button>
                    </div>
                    <datalist id="genre-suggestions">
                        {GENRE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                    </datalist>
                    <SelectedPills selections={inputs.genre} onRemove={(val) => handleMultiSelectToggle('genre', val)} />
                  </div>

                  <div>
                    <label htmlFor="vibe-input" className="block text-sm font-medium text-gray-300 mb-1.5">Vibe / Mood</label>
                    <div className="flex items-center gap-2">
                        <Input 
                        ref={vibeInputRef}
                        id="vibe-input"
                        name="currentVibeText" 
                        value={currentVibeText} 
                        onChange={handleInputChange}
                        onKeyDown={(e) => handleMultiSelectKeyDown(e, 'vibe')}
                        placeholder="Type custom vibe..." 
                        list="vibe-suggestions" 
                        className="flex-grow"
                        />
                        <Button type="button" onClick={() => handleAddMultiSelectItem('vibe')} size="sm" variant="secondary" aria-label="Add Vibe" className="px-3">
                            <PlusIcon className="w-4 h-4" />
                        </Button>
                    </div>
                    <datalist id="vibe-suggestions">
                        {VIBE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                    </datalist>
                    <SelectedPills selections={inputs.vibe} onRemove={(val) => handleMultiSelectToggle('vibe', val)} />
                  </div>
                </div>

                <div>
                    <Input label="Preferred DAW" name="daw" value={inputs.daw} onChange={handleInputChange} placeholder="Type or select DAW..." list="daw-suggestions" />
                    <datalist id="daw-suggestions">
                        {DAW_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                    </datalist>
                    <div className="flex flex-wrap gap-2 mt-2 mb-1">
                        {DAW_SUGGESTIONS.slice(0,5).map(suggestion => (
                            <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleDAWSuggestionClick(suggestion)}
                            className={`px-3 py-1 text-xs rounded-full transition-all duration-150 ease-in-out ${
                                inputs.daw === suggestion 
                                ? 'bg-orange-600 text-white ring-2 ring-orange-400 ring-offset-2 ring-offset-gray-800' 
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-gray-100'
                            }`}
                            >
                            {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div>
                  <Textarea label="Available Plugins" name="plugins" value={inputs.plugins} onChange={handleInputChange} placeholder="e.g., Serum, Valhalla Reverbs, Arturia V Collection, or 'stock only'" rows={2} />
                </div>
                
                <div>
                  <Textarea label="Available Instruments" name="availableInstruments" value={inputs.availableInstruments || ''} onChange={handleInputChange} placeholder="e.g., Electric Guitar, Moog Subsequent 37, Roland TR-808, Vocals" rows={2} />
                </div>

                {/* Advanced Input Toggle */}
                <div className="border-t border-gray-600 pt-4">
                  <Button 
                    type="button" 
                    onClick={() => setShowAdvancedInput(!showAdvancedInput)}
                    variant="outline" 
                    className="mb-4 w-8 h-8 p-0 flex items-center justify-center"
                    title={showAdvancedInput ? 'Hide Advanced Input' : 'Show Advanced Input'}
                  >
                    <span className={`text-lg transition-transform ${showAdvancedInput ? 'rotate-45' : ''}`}>
                      +
                    </span>
                  </Button>

                  {showAdvancedInput && (
                    <div className="space-y-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
                      {/* Key and Scale Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Input label="Key" name="key" value={inputs.key || ''} onChange={handleInputChange} placeholder="e.g., C Major" />
                        </div>
                        <div>
                          <Input label="Scale/Mode" name="scale" value={inputs.scale || ''} onChange={handleInputChange} placeholder="e.g., Dorian, Mixolydian" />
                        </div>
                      </div>

                      {/* Chords and Lyrics Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Input label="Chords" name="chords" value={inputs.chords || ''} onChange={handleInputChange} placeholder="e.g., Am - F - C - G" />
                        </div>
                        <div>
                          <Textarea label="Lyrics" name="lyrics" value={inputs.lyrics || ''} onChange={handleInputChange} placeholder="Paste your lyrics here if you have any..." rows={2} />
                        </div>
                      </div>

                      {/* General Notes for AI */}
                      <div>
                        <Textarea label="General Notes for AI" name="generalNotes" value={inputs.generalNotes || ''} onChange={handleInputChange} placeholder="Any specific instructions, style notes, or creative direction for the AI to consider..." rows={3} />
                      </div>
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={isLoading} className="w-full text-base py-2.5" leftIcon={<TrackGuideLogo className="w-5 h-5"/>}>
                  {isLoading ? (loadingMessage || 'Generating...') : 'Generate TrackGuide'}
                </Button>
                <div className="flex space-x-2 mt-3">
                      <Button type="button" onClick={() => setShowLibraryModal(true)} variant="secondary" className="flex-1" leftIcon={<BookOpenIcon className="w-4 h-4"/>}>View Library</Button>
                      <Button type="button" onClick={resetFormForNewGuidebook} variant="outline" className="flex-1">Clear Form</Button>
                </div>
              </form>
            </Card>

          <div className="lg:col-span-5 space-y-6">
            {/* Main Error */}
            {error && !isLoading && (
              <Card className="border-red-500 bg-red-900/40 shadow-xl">
                <p className="text-red-300 font-semibold text-lg">TrackGuide Error:</p>
                <p className="text-red-300">{error}</p>
              </Card>
            )}

            {/* MIDI Error (from initial generation) - Show if no main error */}
            {midiError && !loadingMessage.toLowerCase().includes('midi') && !error && (
              <Card className="border-yellow-500 bg-yellow-900/40 shadow-xl">
                <p className="text-yellow-300 font-semibold text-lg">MIDI Generation Note:</p>
                <p className="text-yellow-300">{midiError}</p>
              </Card>
            )}

            {/* Render guidebook content as it streams or if fully loaded */}
            {(generatedGuidebook || (isLoading && loadingMessage.includes("TrackGuide is generating"))) && !error && (
              <Card 
                  title={trackGuideCardTitle} 
                  className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 sticky top-8"
                  titleClassName="border-b border-gray-700 text-xl"
              >
                {activeGuidebookDetails && !isLoading && ( // Show buttons only when not loading and details are available
                  <div className="flex flex-wrap gap-3 mb-5 pb-4 border-b border-gray-700 items-center">
                    <Button onClick={() => handleSaveToLibrary('trackGuide')} variant="secondary" leftIcon={<SaveIcon />}>Save to Library</Button>
                    <div className="flex-grow"></div>
                    <Button onClick={resetFormForNewGuidebook} variant="outline" size="sm" className="!border-gray-500 !text-gray-400 hover:!bg-gray-600 hover:!text-white" leftIcon={<CloseIcon />}>Close</Button>
                    {copyStatus && <span className={`ml-3 text-sm ${copyStatus.includes("Failed") || copyStatus.includes("not supported") ? "text-red-400" : "text-green-400"}`}>{copyStatus}</span>}
                  </div>
                )}
      {/* Save to Library for Mix Feedback (single) */}
      {activeView === 'mixFeedback' && mixFeedbackResult && !isGeneratingMixFeedback && mixFeedbackTab === 'single' && (
        <div className="flex justify-end my-4">
          <Button onClick={() => handleSaveToLibrary('mixFeedback')} variant="secondary" leftIcon={<SaveIcon />}>Save to Library</Button>
        </div>
      )}

      {/* Save to Library for Mix Compare */}
      {activeView === 'mixFeedback' && mixCompareResult && !isGeneratingMixComparison && mixFeedbackTab === 'compare' && (
        <div className="flex justify-end my-4">
          <Button onClick={() => handleSaveToLibrary('mixCompare')} variant="secondary" leftIcon={<SaveIcon />}>Save to Library</Button>
        </div>
      )}

      {/* Save to Library for RemixGuide */}
      {activeView === 'remixGuide' && remixGuideContent && (
        <div className="flex justify-end my-4">
          <Button onClick={() => handleSaveToLibrary('remixGuide')} variant="secondary" leftIcon={<SaveIcon />}>Save to Library</Button>
        </div>
      )}

      {/* Save to Library for PatchGuide */}
      {activeView === 'patchGuide' && patchGuideContent && (
        <div className="flex justify-end my-4">
          <Button onClick={() => handleSaveToLibrary('patchGuide')} variant="secondary" leftIcon={<SaveIcon />}>Save to Library</Button>
        </div>
      )}
      {/* Auth Modal for Save to Library */}
      {showAuthModal && <AuthModal onClose={() => { setShowAuthModal(false); setPendingSaveType(null); }} />}
                <div id="guidebook-content-display" className="prose prose-sm md:prose-base prose-invert max-w-none max-h-[calc(100vh-6rem)] overflow-y-auto pr-3 text-gray-300 custom-scrollbar guidebook-content">
                  {activeGuidebookDetails && !isLoading && (
                     <div className="mb-6 p-4 bg-gray-700/50 rounded-lg text-sm shadow-inner border border-gray-600/50 guidebook-section-break"> 
                        <strong className="text-orange-300 block mb-2 text-base">TrackGuide Snapshot:</strong>
                        <p><strong>Project Title:</strong> {activeGuidebookDetails.title}</p>
                        <p><strong>Genre(s):</strong> {Array.isArray(activeGuidebookDetails.genre) ? activeGuidebookDetails.genre.join(', ') : activeGuidebookDetails.genre}</p>
                        <p><strong>Artist/Song Ref:</strong> {activeGuidebookDetails.artistReference || "N/A"}</p>
                        <p><strong>Vibe(s):</strong> {Array.isArray(activeGuidebookDetails.vibe) ? activeGuidebookDetails.vibe.join(', ') : activeGuidebookDetails.vibe}</p>
                        <p><strong>DAW:</strong> {activeGuidebookDetails.daw}</p>
                        <p><strong>Plugins:</strong> {activeGuidebookDetails.plugins || "N/A"}</p>
                        <p><strong>Instruments:</strong> {activeGuidebookDetails.availableInstruments || "N/A"}</p>
                        {activeGuidebookDetails.generatedMidiPatterns && <p className="mt-1 text-green-400"><MusicNoteIcon className="w-4 h-4 inline mr-1"/> Initial MIDI patterns generated.</p>}
                    </div>
                  )}

                  <MarkdownRenderer content={generatedGuidebook} />
                

                  {isLoading && loadingMessage.includes("TrackGuide is generating") && <Spinner size="sm" text="Generating TrackGuide..." />}
                </div>
              </Card>
            )}
            
            {/* Global Loading Spinner for non-text-streaming phases */}
            {isLoading && !error && 
              loadingMessage && !loadingMessage.includes("TrackGuide is generating") && 
              (
                <div className="flex justify-center py-10">
                  <Spinner size="lg" text={loadingMessage || "Processing..."} />
                </div>
              )
            }
            
            {/* MIDI Generator appears after text is complete and activeGuidebookDetails is set and not main error */}
            {activeGuidebookDetails && !isLoading && generatedGuidebook && !error && (
              <MidiGeneratorComponent 
                  currentGuidebookEntry={activeGuidebookDetails}
                  mainAppInputs={inputs}
                  onUpdateGuidebookEntryMidi={handleUpdateGuidebookEntryMidi}
                  parsedGuidebookBpm={parseBpmFromGuidebook(activeGuidebookDetails.content)}
                  parsedGuidebookKey={parseKeyFromGuidebook(activeGuidebookDetails.content)}
                  parsedGuidebookChordProg={parseChordProgressionFromGuidebook(activeGuidebookDetails.content)}
              />
            )}

            {/* Initial Placeholder or if no content and not loading/error */}
            {!isLoading && !generatedGuidebook && !error && !activeGuidebookDetails && ( 
              <Card className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50 flex flex-col items-center justify-center h-96 text-center min-h-[500px]">
                  <div className="flex justify-center mb-6">
                    <TrackGuideLogo className="w-20 h-20 opacity-80 text-orange-500"/>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-200 mb-2">Produce Smarter. Create More.</h3>
                  <p className="text-gray-400 max-w-md mx-auto">Tell us what you’re envisioning—TrackGuide AI will generate a custom production guide and MIDI foundation.</p>
              </Card>
            )}
          </div>


        </div>
>>>>>>> de701982 (Implement and fix save logic for all AI features and resolve lint/type errors)
      )}
      
      {activeView === 'mixFeedback' && (
        <MixFeedbackView onSavePrompt={handleSavePrompt} />
      )}
      
      {activeView === 'remixGuide' && (
        <RemixGuideAI onSavePrompt={handleSavePrompt} />
      )}
      
      {activeView === 'patchGuide' && (
        <PatchGuide onSavePrompt={handleSavePrompt} />
      )}
      
      {activeView === 'eqGuide' && (
        <EQGuide />
      )}

      {/* Save Prompt Modal */}
      {showSavePrompt && (
        <SavePromptModal
          isOpen={showSavePrompt}
          onClose={() => {
            setShowSavePrompt(false);
            setPendingSaveData(null);
            setPendingSaveType(null);
          }}
          onSave={handleSaveToCloud}
          generationType={pendingSaveType || 'trackGuide'}
        />
      )}
    </div>
  );
};

export default App;
