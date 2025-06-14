import React from 'react';
import { Input } from './components/Input';
import { MidiGeneratorComponent } from './components/MidiGeneratorComponent';
import MixComparator from './components/MixComparator';
import EQCheatSheet from './components/EQCheatSheet';
import LibraryModal from './components/LibraryModal';
import AIAssistant from './components/AIAssistant';
import './index.css'; // assumes global styles are here

const App: React.FC = () => {
  const dummyGuidebookEntry = {
    content: '',
    title: 'Untitled Track',
    midiSettings: null,
    generatedMidiPatterns: null,
    genre: []
  };

  const dummyAppInputs = {
    genre: []
  };

  const handleUpdateMidi = () => {};

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="p-6 text-center border-b border-gray-800">
        <h1 className="text-3xl font-bold tracking-tight">🎛️ TrackGuide AI</h1>
        <p className="text-gray-400 mt-2">Your smart studio assistant — never your replacement.</p>
      </header>

      {/* Main UI Layout */}
      <main className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <section className="space-y-4">
          <Input />
          <MidiGeneratorComponent 
            currentGuidebookEntry={dummyGuidebookEntry}
            mainAppInputs={dummyAppInputs}
            onUpdateGuidebookEntryMidi={handleUpdateMidi}
            parsedGuidebookBpm={null}
            parsedGuidebookKey={null}
            parsedGuidebookChordProg={null}
          />
          <MixComparator />
        </section>

        <section className="space-y-4">
          <EQCheatSheet />
          <LibraryModal />
        </section>
      </main>

      {/* Floating AI Assistant */}
      <div className="fixed bottom-4 right-4 z-50">
        <AIAssistant />
      </div>
    </div>
  );
};

export default App;
