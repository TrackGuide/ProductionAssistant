import React, { useState } from 'react';
import { TrackInputForm } from './components/TrackInputForm';
import { MidiGeneratorComponent } from './components/MidiGeneratorComponent';
import { MixComparator } from './components/MixComparator';
import { EQCheatSheet }  from './components/EQCheatSheet';
import { LibraryModal } from './components/LibraryModal';
import { AIAssistant } from './components/AIAssistant';
import { TabSystem } from './components/TabSystem';
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

  const tabs = [
    {
      id: 'trackguide',
      label: '🎵 TrackGuide',
      content: (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            <TrackInputForm onSubmit={handleTrackInputSubmit} />
          </div>
          <div className="space-y-6">
            <MidiGeneratorComponent 
              currentGuidebookEntry={currentGuidebookEntry}
              mainAppInputs={currentInputs}
              onUpdateGuidebookEntryMidi={handleUpdateMidi}
              parsedGuidebookBpm={null}
              parsedGuidebookKey={null}
              parsedGuidebookChordProg={null}
            />
          </div>
        </div>
      )
    },
    {
      id: 'mixfeedback',
      label: '🎛️ Mix Feedback',
      content: (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            <EQCheatSheet />
          </div>
          <div className="space-y-6">
            <MixComparator />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight text-center">🎛️ TrackGuide AI</h1>
          <p className="text-gray-400 text-sm text-center mt-1">Your smart studio assistant — never your replacement.</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Tab System */}
          <div className="lg:col-span-3">
            <TabSystem tabs={tabs} defaultTab="trackguide" />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <LibraryModal />
          </div>
        </div>
      </main>

      {/* Floating AI Assistant */}
      <div className="fixed bottom-6 right-6 z-50">
        <AIAssistant />
      </div>
    </div>
  );
};

export default App;
