import React, { useState } from 'react';
import { TrackInputForm } from './components/TrackInputForm';
import { MidiGeneratorComponent } from './components/MidiGeneratorComponent';
import { MixComparator } from './components/MixComparator';
import { MixFeedback } from './components/MixFeedback';
import { EQCheatSheet }  from './components/EQCheatSheet';
import { LibraryModal } from './components/LibraryModal';
import { AIAssistant } from './components/AIAssistant';
import { Card } from './components/Card';
import { UserInputs, GuidebookEntry, MidiSettings, GeneratedMidiPatterns } from './types';
import './index.css';

const App: React.FC = () => {
  const [currentInputs, setCurrentInputs] = useState<UserInputs>({
    genre: [],
    artistReference: '',
    vibe: [],
    daw: '',
    plugins: '',
    availableInstruments: ''
  });

  const [currentGuidebookEntry, setCurrentGuidebookEntry] = useState<GuidebookEntry>({
    id: 'demo',
    title: 'Demo Track',
    genre: [],
    artistReference: '',
    vibe: [],
    daw: '',
    plugins: '',
    availableInstruments: '',
    content: 'This is a demo track guide. Use the form above to create your own track guide with AI assistance.',
    createdAt: new Date().toISOString(),
    midiSettings: undefined,
    generatedMidiPatterns: undefined
  });

  const handleTrackInputSubmit = (inputs: UserInputs) => {
    setCurrentInputs(inputs);
    
    // Update the guidebook entry with new inputs
    setCurrentGuidebookEntry(prev => ({
      ...prev,
      title: inputs.songTitle || 'Untitled Track',
      genre: inputs.genre,
      artistReference: inputs.artistReference,
      vibe: inputs.vibe,
      daw: inputs.daw,
      plugins: inputs.plugins,
      availableInstruments: inputs.availableInstruments || '',
      content: generateTrackGuideContent(inputs)
    }));
  };

  const generateTrackGuideContent = (inputs: UserInputs): string => {
    const sections = [];
    
    sections.push(`# ${inputs.songTitle || 'Track Guide'}\n`);
    
    if (inputs.artistReference) {
      sections.push(`**Reference Artist:** ${inputs.artistReference}\n`);
    }
    
    if (inputs.genre.length > 0) {
      sections.push(`**Genre:** ${inputs.genre.join(', ')}\n`);
    }
    
    if (inputs.vibe.length > 0) {
      sections.push(`**Vibe/Mood:** ${inputs.vibe.join(', ')}\n`);
    }
    
    sections.push(`## Production Notes\n`);
    
    if (inputs.daw) {
      sections.push(`**DAW:** ${inputs.daw}\n`);
    }
    
    if (inputs.plugins) {
      sections.push(`**Available Plugins:** ${inputs.plugins}\n`);
    }
    
    if (inputs.availableInstruments) {
      sections.push(`**Available Instruments:** ${inputs.availableInstruments}\n`);
    }
    
    // Add some basic guidance based on genre
    if (inputs.genre.length > 0) {
      const primaryGenre = inputs.genre[0];
      sections.push(`\n## ${primaryGenre} Production Tips\n`);
      
      if (primaryGenre.toLowerCase().includes('house')) {
        sections.push(`- Focus on a solid 4/4 kick pattern\n- Use sidechain compression for that pumping effect\n- Layer percussion elements for groove\n- Keep the bassline simple but effective\n`);
      } else if (primaryGenre.toLowerCase().includes('pop')) {
        sections.push(`- Strong vocal melody is key\n- Use catchy chord progressions (try I-V-vi-IV)\n- Layer harmonies and backing vocals\n- Focus on clear, punchy drums\n`);
      } else if (primaryGenre.toLowerCase().includes('rock')) {
        sections.push(`- Guitar-driven arrangement\n- Powerful drum sound with emphasis on snare\n- Bass should lock with kick drum\n- Consider guitar layering for fullness\n`);
      } else {
        sections.push(`- Research reference tracks in this genre\n- Pay attention to typical song structure\n- Focus on genre-appropriate sound selection\n- Consider the target audience and context\n`);
      }
    }
    
    sections.push(`\n## Next Steps\n- Use the MIDI generator to create musical patterns\n- Experiment with the EQ guide for mixing tips\n- Compare different mix versions with the Mix Comparator\n- Ask the AI Assistant for specific production advice\n`);
    
    return sections.join('');
  };

  const handleUpdateMidi = (midiSettings: MidiSettings, generatedMidiPatterns: GeneratedMidiPatterns) => {
    setCurrentGuidebookEntry(prev => ({
      ...prev,
      midiSettings,
      generatedMidiPatterns
    }));
  };

  const [showEQCheatSheet, setShowEQCheatSheet] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showMixFeedback, setShowMixFeedback] = useState(false);

  return (
    <div className="min-h-screen text-white font-sans">
      {/* Header */}
      <header className="text-center py-8 px-6">
        <h1 className="text-4xl font-bold neon-text mb-2">TrackGuide</h1>
        <p className="text-gray-400 text-lg">Your AI Music Production Assistant</p>
      </header>

      {/* Tool Navigation */}
      <div className="flex justify-center mb-8 px-6">
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setShowMixFeedback(true)}
            className="px-4 py-2 rounded-full bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 transition-all duration-300 border border-purple-500/30 hover:border-purple-500/50"
          >
            🎛️ Mix Feedback AI
          </button>
          <button
            onClick={() => setShowEQCheatSheet(true)}
            className="px-4 py-2 rounded-full bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition-all duration-300 border border-blue-500/30 hover:border-blue-500/50"
          >
            📊 EQ Cheat Sheet
          </button>
          <button
            onClick={() => setShowAIAssistant(true)}
            className="px-4 py-2 rounded-full bg-green-600/20 text-green-300 hover:bg-green-600/30 transition-all duration-300 border border-green-500/30 hover:border-green-500/50"
          >
            ⭐ AI Assistant
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Blueprint Your Sound */}
          <div className="space-y-6">
            <TrackInputForm onSubmit={handleTrackInputSubmit} />
            <LibraryModal />
          </div>

          {/* Right Side - Generated Content */}
          <div className="space-y-6">
            {currentGuidebookEntry.content ? (
              <div className="space-y-6">
                {/* TrackGuide Results */}
                <Card title="🎵 Your TrackGuide" className="glass neon-border">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-200">
                      {currentGuidebookEntry.content}
                    </div>
                  </div>
                </Card>

                {/* MIDI Generator */}
                <MidiGeneratorComponent 
                  currentGuidebookEntry={currentGuidebookEntry}
                  mainAppInputs={currentInputs}
                  onUpdateGuidebookEntryMidi={handleUpdateMidi}
                  parsedGuidebookBpm={null}
                  parsedGuidebookKey={null}
                  parsedGuidebookChordProg={null}
                />
              </div>
            ) : (
              <Card title="🎵 Produce Smarter. Create More." className="glass neon-border">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⭐</div>
                  <p className="text-gray-300 text-lg mb-2">
                    Tell us what you're envisioning—TrackGuide AI will generate a custom production guide and MIDI foundation.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Modal Overlays */}
      {showEQCheatSheet && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">📊 EQ Cheat Sheet</h2>
              <button
                onClick={() => setShowEQCheatSheet(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <EQCheatSheet />
            </div>
          </div>
        </div>
      )}



      {showMixFeedback && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">🎛️ Mix Feedback & Comparator</h2>
              <button
                onClick={() => setShowMixFeedback(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <MixFeedback />
                </div>
                <div className="space-y-6">
                  <MixComparator />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAIAssistant && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">⭐ AI Assistant</h2>
              <button
                onClick={() => setShowAIAssistant(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <AIAssistant />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
