import React, { useState, useEffect, useRef } from 'react';
import {
  UserInputs,
  GuidebookEntry,
  MixFeedbackInputs,
  ActiveView
} from './types.ts';
import {
  generateGuidebookContent,
  generateMixFeedback
} from './services/geminiService.ts';
import { Input } from './components/Input.tsx';
import { Textarea } from './components/Textarea.tsx';
import { Button } from './components/Button.tsx';
import { Card } from './components/Card.tsx';
import { Spinner } from './components/Spinner.tsx';
import {
  SparklesIcon,
  SaveIcon,
  BookOpenIcon,
  AdjustmentsHorizontalIcon,
  UploadIcon,
  ExclamationTriangleIcon
} from './components/icons.tsx';
import { MarkdownRenderer } from './components/MarkdownRenderer.tsx';
import { AIAssistant } from './components/AIAssistant.tsx';
import MixComparator from './components/MixComparator.tsx';
import './index.css';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('trackGuide');
  const [inputs, setInputs] = useState<UserInputs>({ genre: [], artist: '', vibe: [], daw: '', plugins: [] });
  const [generatedGuidebook, setGeneratedGuidebook] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [library, setLibrary] = useState<GuidebookEntry[]>([]);
  const [mixFeedbackInputs, setMixFeedbackInputs] = useState<MixFeedbackInputs>({ audioFile: null, userNotes: '' });
  const [mixFeedbackResult, setMixFeedbackResult] = useState<string | null>(null);
  const [isGeneratingMixFeedback, setIsGeneratingMixFeedback] = useState<boolean>(false);
  const [mixFeedbackError, setMixFeedbackError] = useState<string | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('library');
    if (saved) setLibrary(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('library', JSON.stringify(library));
  }, [library]);

  const handleGenerateGuidebook = async () => {
    setIsLoading(true);
    try {
      const content = await generateGuidebookContent(inputs);
      setGeneratedGuidebook(content);
      setActiveView('trackGuide');
    } catch {
      setGeneratedGuidebook('Error generating guidebook. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGuidebook = () => {
    const entry: GuidebookEntry = {
      id: Date.now().toString(),
      title: inputs.artist || 'Untitled',
      date: new Date().toISOString(),
      content: generatedGuidebook
    };
    setLibrary([entry, ...library]);
  };

  const handleGetMixFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mixFeedbackInputs.audioFile) return;
    setIsGeneratingMixFeedback(true);
    setMixFeedbackError(null);
    try {
      const feedback = await generateMixFeedback(mixFeedbackInputs);
      setMixFeedbackResult(feedback);
    } catch {
      setMixFeedbackError('Failed to get feedback. Please try again.');
    } finally {
      setIsGeneratingMixFeedback(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-900 text-gray-100">
      <aside className="w-full md:w-1/3 p-6 border-r border-gray-700 space-y-6 overflow-auto">
        <fieldset className="space-y-4">
          <legend className="text-xl font-semibold">🎧 Project Details</legend>
          <Input label="Genre" value={inputs.genre.join(', ')} onChange={(v) => setInputs({ ...inputs, genre: v.split(',') })} />
          <Input label="Artist" value={inputs.artist} onChange={(v) => setInputs({ ...inputs, artist: v })} />
          <Input label="Vibe" value={inputs.vibe.join(', ')} onChange={(v) => setInputs({ ...inputs, vibe: v.split(',') })} />
        </fieldset>
        <fieldset className="space-y-4">
          <legend className="text-xl font-semibold">🖥 Production Setup</legend>
          <Input label="DAW" value={inputs.daw} onChange={(v) => setInputs({ ...inputs, daw: v })} />
          <Input label="Plugins" value={inputs.plugins.join(', ')} onChange={(v) => setInputs({ ...inputs, plugins: v.split(',') })} />
        </fieldset>
        <div className="flex space-x-3">
          <Button onClick={handleGenerateGuidebook} leftIcon={<SparklesIcon />}>Generate</Button>
          <Button onClick={handleSaveGuidebook} leftIcon={<SaveIcon />} disabled={!generatedGuidebook}>Save</Button>
          <Button onClick={() => navigator.clipboard.writeText(generatedGuidebook)} leftIcon={<BookOpenIcon />} disabled={!generatedGuidebook}>Export</Button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        {activeView === 'trackGuide' && (
          <div>
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-6 bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-700 rounded w-2/3" />
              </div>
            ) : (
              <MarkdownRenderer content={generatedGuidebook} />
            )}
          </div>
        )}

        {activeView === 'mixFeedback' && (
          <div className="space-y-6">
            <Card title="Upload Your Mix">
              <form onSubmit={handleGetMixFeedback} className="space-y-4">
                <div>
                  <Button variant="outline" leftIcon={<UploadIcon />} onClick={() => audioFileInputRef.current?.click()}>
                    Choose File
                  </Button>
                  <input type="file" accept="audio/*" className="hidden" ref={audioFileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setMixFeedbackInputs({ ...mixFeedbackInputs, audioFile: file });
                    }}
                  />
                </div>
                <Textarea label="Notes for AI" value={mixFeedbackInputs.userNotes} onChange={(v) => setMixFeedbackInputs({ ...mixFeedbackInputs, userNotes: v })} />
                <div>
                  <Button type="submit" leftIcon={<SparklesIcon />}>Get Feedback</Button>
                </div>
                {isGeneratingMixFeedback && <Spinner />}
                {mixFeedbackError && (
                  <div className="flex items-center space-x-2 text-red-400">
                    <ExclamationTriangleIcon />
                    <span>{mixFeedbackError}</span>
                  </div>
                )}
              </form>
            </Card>

            {mixFeedbackResult && (
              <Card title="Mix Feedback">
                <MarkdownRenderer content={mixFeedbackResult} />
              </Card>
            )}

            {mixFeedbackInputs.audioFile && (
              <Card title="Mix Comparator">
                <MixComparator audioFile={mixFeedbackInputs.audioFile} />
              </Card>
            )}
          </div>
        )}

        {activeView === 'library' && (
          library.length === 0 ? (
            <div className="text-center text-gray-500">No saved guidebooks yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {library.map(entry => (
                <Card key={entry.id} title={entry.title} subtitle={new Date(entry.date).toLocaleString()}>
                  <div className="text-sm text-gray-300 truncate">{entry.content}</div>
                  <div className="mt-2 flex space-x-2">
                    <Button size="sm">View</Button>
                    <Button size="sm" variant="outline">Edit</Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </main>

      <div className="fixed bottom-4 right-4">
        <button onClick={() => setShowAIAssistant(true)} className="p-3 bg-teal-500 rounded-full shadow-lg hover:bg-teal-600 transition">
          <SparklesIcon className="w-6 h-6 text-white" />
        </button>
      </div>
      <AIAssistant isOpen={showAIAssistant} onClose={() => setShowAIAssistant(false)} />
    </div>
);

export default App;
