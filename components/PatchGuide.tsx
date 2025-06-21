/* ===== components/PatchGuide.tsx ===== */
import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Spinner } from './Spinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnimatedWaveformPreview } from './AnimatedWaveformPreview';
import { EnvelopeChart } from './EnvelopeChart';
import { Knob } from './Knob';
import { ModulationMatrix, ModRouting } from './ModulationMatrix';
import { generateSynthPatchGuide } from '../services/patchGuideService';

const SYNTH_OPTIONS = ['Serum','Vital','Pigments','Massive','Massive X','Diva','Hive 2','Sylenth1','Wavestate','Jupiter-8','Juno-106','SH-101','Operator','Wavetable','Retro Synth','Alchemy','FM8','Phase Plant','Omnisphere','Analog Lab','Generic'];
const VOICE_TYPES = ['Soft Lead', 'Hard Lead', 'Evolving Pad', 'Bass', 'Pluck', 'Ambient Texture', 'Arpeggio', 'Drone', 'FX', 'Keys'];
const DESCRIPTORS = ['Warm', 'Bright', 'Gritty', 'Smooth', 'Distorted', 'Clean', 'Vintage', 'Modern', 'Aggressive', 'Subtle'];
const GENRES = ['Ambient', 'EDM', 'Rock', 'Pop', 'Hip-Hop', 'Jazz', 'Classical', 'Experimental', 'Techno', 'House'];

export const PatchGuide: React.FC = () => {
  const [voiceType, setVoiceType] = useState('Soft Lead');
  const [descriptor, setDescriptor] = useState('Warm');
  const [genre, setGenre] = useState('Ambient');
  const [notes, setNotes] = useState('');
  const [synth, setSynth] = useState('Generic');
  const [guide, setGuide] = useState<string | null>(null);
  const [wave, setWave] = useState<string>('sawtooth');
  const [octaves, setOctaves] = useState({ osc1: 0, osc2: 0 });
  const [tunings, setTunings] = useState({ osc1Fine: 0, osc2Fine: 0, osc1Coarse: 0, osc2Coarse: 0 });
  const [adsr, setAdsr] = useState({ attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 });
  const [knobs, setKnobs] = useState<Record<string, number>>({ 
    Cutoff: 0.3, 
    Resonance: 0.4, 
    Drive: 0.1, 
    Mix: 0.5, 
    'Filter Drive': 0.2 
  });
  const [mods, setMods] = useState<ModRouting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const duration = 1;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true); 
    setGuide(null); 
    setError('');
    
    // Combine all inputs into a description
    const description = `${voiceType} with ${descriptor} character for ${genre} music${notes ? '. Additional notes: ' + notes : ''}`;
    
    try {
      const res = await generateSynthPatchGuide({ 
        description, 
        synth, 
        voiceType, 
        descriptor, 
        genre, 
        notes 
      });
      
      setGuide(res.text || '');
      setWave(res.waveform || wave);
      if (res.adsr) setAdsr(res.adsr);
      if (res.knobs) setKnobs(res.knobs);
      if (res.modMatrix) setMods(res.modMatrix.filter(m => m.amount > 0));
      if (res.oscSettings) {
        setOctaves({ osc1: res.oscSettings.osc1Oct||0, osc2: res.oscSettings.osc2Oct||0 });
        setTunings({ 
          osc1Fine: res.oscSettings.osc1Fine||0, 
          osc2Fine: res.oscSettings.osc2Fine||0, 
          osc1Coarse: res.oscSettings.osc1Coarse||0, 
          osc2Coarse: res.oscSettings.osc2Coarse||0 
        });
      }
    } catch (err) { 
      setError(err instanceof Error ? err.message : 'Error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const reset = () => {
    setVoiceType('Soft Lead');
    setDescriptor('Warm');
    setGenre('Ambient');
    setNotes('');
    setSynth('Generic'); 
    setGuide(null); 
    setError('');
    setWave('sawtooth'); 
    setOctaves({ osc1: 0, osc2: 0 }); 
    setTunings({ osc1Fine: 0, osc2Fine: 0, osc1Coarse: 0, osc2Coarse: 0 });
    setAdsr({ attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 }); 
    setKnobs({ Cutoff: 0.3, Resonance: 0.4, Drive: 0.1, Mix: 0.5, 'Filter Drive': 0.2 }); 
    setMods([]);
  };

  const renderAudioGraph = (ctx: OfflineAudioContext) => {
    const osc1 = ctx.createOscillator(); 
    osc1.type = wave as OscillatorType;
    const osc2 = ctx.createOscillator(); 
    osc2.type = wave as OscillatorType; 
    osc2.detune.value = tunings.osc2Fine;
    
    const filter = ctx.createBiquadFilter(); 
    filter.type = 'lowpass'; 
    filter.frequency.value = knobs.Cutoff * ctx.sampleRate / 2; 
    filter.Q.value = knobs.Resonance * 20;
    
    const gain = ctx.createGain();
    osc1.connect(filter); 
    osc2.connect(filter); 
    filter.connect(gain); 
    gain.connect(ctx.destination);
    
    osc1.start(); 
    osc2.start();
    
    const now = 0;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + adsr.attack);
    gain.gain.linearRampToValueAtTime(adsr.sustain, now + adsr.attack + adsr.decay);
    gain.gain.setValueAtTime(adsr.sustain, now + duration);
    gain.gain.linearRampToValueAtTime(0, now + duration + adsr.release);
    
    return gain;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <Card>
        <h1 className="text-2xl font-bold text-white">PatchGuide AI</h1>
        <p className="text-gray-300 mt-2">
          Tell PatchGuide what your voice style, genre, and vibe for a complete sound-design walkthrough.
        </p>
        
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Voice Type</label>
              <select 
                value={voiceType} 
                onChange={e => setVoiceType(e.target.value)} 
                className="w-full p-2 bg-gray-700 rounded text-white"
              >
                {VOICE_TYPES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Descriptor</label>
              <select 
                value={descriptor} 
                onChange={e => setDescriptor(e.target.value)} 
                className="w-full p-2 bg-gray-700 rounded text-white"
              >
                {DESCRIPTORS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Genre</label>
              <select 
                value={genre} 
                onChange={e => setGenre(e.target.value)} 
                className="w-full p-2 bg-gray-700 rounded text-white"
              >
                {GENRES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Optional Notes</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional details..."
              className="w-full p-2 bg-gray-700 rounded text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Synthesizer</label>
            <select 
              value={synth} 
              onChange={e => setSynth(e.target.value)} 
              className="w-full p-2 bg-gray-700 rounded text-white"
            >
              {SYNTH_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          
          {error && <div className="text-red-400">{error}</div>}
          
          <div className="flex space-x-3">
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1"
            >
              {loading ? <><Spinner size="sm"/>Generating...</> : "Generate Guide"}
            </Button>
            <Button variant="outline" onClick={reset}>Reset</Button>
          </div>
        </form>
      </Card>

      {guide && <>        
        <Card>
          <h2 className="text-xl font-semibold text-white mb-2">1. Oscillator Settings</h2>
          <table className="w-full text-gray-200 border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-2 text-left">Osc</th>
                <th className="p-2 text-left">Shape/Wave</th>
                <th className="p-2 text-left">Octave</th>
                <th className="p-2 text-left">Coarse Tune</th>
                <th className="p-2 text-left">Fine Tune</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-700">
                <td className="p-2">Osc 1</td>
                <td className="p-2">{wave}</td>
                <td className="p-2">{octaves.osc1}</td>
                <td className="p-2">{tunings.osc1Coarse}</td>
                <td className="p-2">{tunings.osc1Fine}</td>
              </tr>
              <tr className="border-t border-gray-700">
                <td className="p-2">Osc 2</td>
                <td className="p-2">{wave}</td>
                <td className="p-2">{octaves.osc2}</td>
                <td className="p-2">{tunings.osc2Coarse}</td>
                <td className="p-2">{tunings.osc2Fine}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-white mb-2">2. Filter Settings</h2>
          <table className="w-full text-gray-200 border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-2 text-left">Param</th>
                <th className="p-2 text-left">Value</th>
                <th className="p-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-700">
                <td className="p-2">Type</td>
                <td className="p-2">Low-pass</td>
                <td className="p-2">Shapes tone</td>
              </tr>
              <tr className="border-t border-gray-700">
                <td className="p-2">Cutoff</td>
                <td className="p-2">{Math.round(knobs.Cutoff*100)}%</td>
                <td className="p-2">Sweep range</td>
              </tr>
              <tr className="border-t border-gray-700">
                <td className="p-2">Resonance</td>
                <td className="p-2">{Math.round(knobs.Resonance*100)}%</td>
                <td className="p-2">Sharpness</td>
              </tr>
              <tr className="border-t border-gray-700">
                <td className="p-2">Drive</td>
                <td className="p-2">{Math.round(knobs['Filter Drive']*100)}%</td>
                <td className="p-2">Warmth</td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-white mb-2">3. ADSR Envelope</h2>
          <div className="flex items-center gap-6">
            <table className="text-gray-200 border-collapse">
              <thead>
                <tr className="bg-gray-800">
                  <th className="p-2">Env</th>
                  <th className="p-2">A</th>
                  <th className="p-2">D</th>
                  <th className="p-2">S</th>
                  <th className="p-2">R</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-700">
                  <td className="p-2">Amp</td>
                  <td className="p-2">{adsr.attack}</td>
                  <td className="p-2">{adsr.decay}</td>
                  <td className="p-2">{adsr.sustain}</td>
                  <td className="p-2">{adsr.release}</td>
                </tr>
              </tbody>
            </table>
            <EnvelopeChart {...adsr} width={300} height={150} />
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-white mb-2">4. Effects & Performance Tips</h2>
          <ReactMarkdown className="prose prose-invert text-gray-200" remarkPlugins={[remarkGfm]}>``` 
- **Reverb**: Large hall (3–5s decay)
- **Chorus**: Subtle ensemble width
- **Delay**: Long delay, low feedback

**Performance**: Use mod wheel to sweep live; layer pads for depth
```</ReactMarkdown>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-white mb-2">5. Visual Aids</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[150px]">
              <AnimatedWaveformPreview 
                renderAudioGraph={renderAudioGraph} 
                width={400} 
                height={120} 
                duration={duration} 
                fps={20} 
              />
            </div>
            <EnvelopeChart {...adsr} width={300} height={150} />
            <div className="flex flex-wrap gap-4">
              {Object.entries(knobs).map(([l,v])=> <Knob key={l} label={l} value={v}/> )}
            </div>
            {mods.length>0 && <ModulationMatrix routings={mods} />}
          </div>
        </Card>
      </>}
    </div>
  );
};
