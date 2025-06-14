import React from 'react';
import { Input } from './components/Input';
import { MidiGeneratorComponent } from './components/MidiGeneratorComponent';
import { MixComparator } from './components/MixComparator';
import { EQCheatSheet } from './components/EQCheatSheet';
import { LibraryModal } from './components/LibraryModal';
import { AIAssistant } from './components/AIAssistant';
import './index.css';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <header className="p-6 text-center border-b border-gray-800">
        <h1 className="text-3xl font-bold tracking-tight">🎛️ TrackGuide AI</h1>
        <p className="text-gray-400 mt-2">Your smart studio assistant — never your replacement.</p>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <section className="space-y-4">
          <Input />
          <MidiGeneratorComponent />
          <MixComparator />
        </section>
        <section className="space-y-4">
          <EQCheatSheet />
          <LibraryModal />
        </section>
      </main>
      <div className="fixed bottom-4 right-4 z-50">
        <AIAssistant />
      </div>
    </div>
  );
};

export default App;