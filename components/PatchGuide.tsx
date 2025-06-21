/* ===== PatchGuide.tsx ===== */
import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnimatedWaveformPreview } from './AnimatedWaveformPreview';
import { EnvelopeChart } from './EnvelopeChart';
import { Knob } from './Knob';
import { ModulationMatrix } from './ModulationMatrix';
import { generateSynthPatchGuide } from '../services/patchGuideService';

const SYNTH_OPTIONS = [
  'Serum', 'Vital', 'Pigments', 'Massive', 'Massive X', 'Diva', 'Hive 2', 'Sylenth1',
  'Wavestate', 'Jupiter-8', 'Juno-106', 'SH-101', 'Operator', 'Wavetable', 'Retro Synth', 'Alchemy',
  'FM8', 'Phase Plant', 'Omnisphere', 'Analog Lab', 'Generic'
];

export const PatchGuide: React.FC = () => {
  const [desc, setDesc] = useState('');
  const [synth, setSynth] = useState('Generic');
  const [guide, setGuide] = useState<string | null>(null);
  const [wave, setWave] = useState<string>('sawtooth');
  const [adsr, setAdsr] = useState({ attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 });
  const [knobs, setKnobs] = useState<Record<string, number>>({
    Cutoff: 0.3, Resonance: 0.4, Drive: 0.1, Mix: 0.5
  });
  const [mods, setMods] = useState<Array<{ source: string; target: string; amount: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setGuide(null); setError('');
    try {
      const result = await generateSynthPatchGuide({ description: desc, synth });
      setGuide(result.text || '');
      if (result.waveform) setWave(result.waveform);
      if (result.adsr) setAdsr(result.adsr);
      if (result.knobs) setKnobs(result.knobs);
      if (result.modMatrix) setMods(result.modMatrix.filter(m => m.amount > 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate guide');
    } finally { setLoading(false); }
  };

  const reset = () => {
    setDesc(''); setSynth('Generic'); setGuide(null); setError('');
    setWave('sawtooth'); setAdsr({ attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 });
    setKnobs({ Cutoff: 0.3, Resonance: 0.4, Drive: 0.1, Mix: 0.5 }); setMods([]);
  }

  // Helper to build synth graph for waveform rendering
  const renderGraph = (ctx: OfflineAudioContext) => {
    const osc1 = ctx.createOscillator(); osc1.type = wave as OscillatorType;
    const osc2 = ctx.createOscillator(); osc2.type = wave as OscillatorType;
    osc2.detune.value = 5;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass';
    filter.frequency.value = knobs.Cutoff * ctx.sampleRate / 2;
    filter.Q.value = knobs.Resonance * 20;
    const gain = ctx.createGain();
    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc1.start(0); osc2.start(0);
    // schedule ADSR on gain.gain
    const now = 0;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + adsr.attack);
    gain.gain.linearRampToValueAtTime(adsr.sustain, now + adsr.attack + adsr.decay);
    gain.gain.setValueAtTime(adsr.sustain, now + duration);
    gain.gain.linearRampToValueAtTime(0, now + duration + adsr.release);
    return gain;
  };

  const duration = 1; // sec for preview

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <Card>
        <h1 className="text-2xl font-bold text-white mb-2">🎹 PatchGuide AI</h1>
        <p className="text-gray-400">Describe your target sound and select a synth:</p>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <textarea
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="warm analog bass..."
            className="w-full h-24 p-3 bg-gray-700 rounded-lg text-white" />
          <select
            value={synth} onChange={e => setSynth(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded-lg text-white">
            {SYNTH_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
          </select>
          {error && <div className="text-red-400">{error}</div>}
          <div className="flex space-x-3">
            <Button type="submit" disabled={loading||!desc.trim()} className="flex-1">
              {loading ? <><Spinner size="sm" /> Generating...</> : 'Generate Guide'}
            </Button>
            <Button variant="outline" onClick={reset}>Reset</Button>
          </div>
        </form>
      </Card>

      {guide && (
        <div className="space-y-6">
          {/* Oscillator Section */}
          <Card>
            <h2 className="text-xl font-semibold text-white mb-3">1. Oscillator Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <table className="w-full text-left text-gray-200">
                <thead><tr><th>Param</th><th>Value</th><th>Notes</th></tr></thead>
                <tbody>
                  <tr><td>Osc 1</td><td>{wave}</td><td>Primary waveform</td></tr>
                  <tr><td>Osc 2</td><td>{wave} +5¢</td><td>Detune for width</td></tr>
                </tbody>
              </table>
              <AnimatedWaveformPreview
                renderAudioGraph={renderGraph}
                width={400} height={120} duration={duration} fps={20}
              />
            </div>
          </Card>

          {/* Filter Section */}
          <Card>
            <h2 className="text-xl font-semibold text-white mb-3">2. Filter Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <table className="w-full text-gray-200">
                <thead><tr><th>Param</th><th>Value</th><th>Notes</th></tr></thead>
                <tbody>
                  <tr><td>Type</td><td>Low-pass</td><td>Shapes tone</td></tr>
                  <tr><td>Cutoff</td><td>{Math.round(knobs.Cutoff*100)}%</td><td>Sweep range</td></tr>
                  <tr><td>Resonance</td><td>{Math.round(knobs.Resonance*100)}%</td><td>Sharpness</td></tr>
                  <tr><td>Drive</td><td>{Math.round(knobs.Drive*100)}%</td><td>Warmth</td></tr>
                </tbody>
              </table>
              <Knob label="Cutoff" value={knobs.Cutoff} />
            </div>
          </Card>

          {/* Envelope Section */}
          <Card>
            <h2 className="text-xl font-semibold text-white mb-3">3. ADSR Envelope</h2>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <table className="text-gray-200">
                <thead><tr><th>Env</th><th>A</th><th>D</th><th>S</th><th>R</th></tr></thead>
                <tbody>
                  <tr>
                    <td>Amp</td>
                    <td>{adsr.attack}</td>
                    <td>{adsr.decay}</td>
                    <td>{adsr.sustain}</td>
                    <td>{adsr.release}</td>
                  </tr>
                </tbody>
              </table>
              <EnvelopeChart {...adsr} width={300} height={150} />
            </div>
          </Card>

          {/* Modulation Section */}
          {mods.length > 0 && (
            <Card>
              <h2 className="text-xl font-semibold text-white mb-3">4. Modulation Matrix</h2>
              <ModulationMatrix routings={mods} />
            </Card>
          )}

          {/* Effects & Performance Section */}
          <Card>
            <h2 className="text-xl font-semibold text-white mb-3">5. Effects & Tips</h2>
            <ReactMarkdown className="prose prose-invert text-gray-200">
{`- **Reverb**: Large hall, 3–5s decay
- **Chorus**: Subtle width boost
- **Delay**: Long, low feedback

**Performance**: Use mod wheel for live sweeps; layer pads for depth.`}
            </ReactMarkdown>
          </Card>
        </div>
      )}
    </div>
  );
};
