import serum from './Serum.json';
import vital from './Vital.json';
import pigments from './Pigments.json';
import massive from './Massive.json';
import massivex from './MassiveX.json';
import diva from './Diva.json';
import hive2 from './Hive2.json';
import sylenth1 from './Sylenth1.json';
import wavestate from './Wavestate.json';
import jupiter8 from './Jupiter8.json';
import juno106 from './Juno106.json';
import sh101 from './SH101.json';
import operator from './Operator.json';
import wavetable from './Wavetable.json';
import retrosynth from './RetroSynth.json';
import alchemy from './Alchemy.json';
import fm8 from './FM8.json';
import phaseplant from './PhasePlant.json';
import omnisphere from './Omnisphere.json';
import analoglab from './AnalogLab.json';
import generic from './Generic.json';

export interface SynthConfig {
  name: string;
  oscillators: Array<{ id: string; name: string; type: string; params: string[] }>;
  filters: Array<{ name: string; types: string[]; params: string[] }>;
  envelopes: { count: number; labels?: string[] };
  LFOs?: { count: number; labels?: string[] };
  modSources: string[];
  modDestinations: Record<string, string[]>;
  effects?: Array<{ name: string; defaultSetting: string }>;
  performanceControls?: Record<string, any>;
}

const synthConfigs: Record<string, SynthConfig> = {
  Serum: serum,
  Vital: vital,
  Pigments: pigments,
  Massive: massive,
  'MassiveX': massivex,
  Diva: diva,
  'Hive2': hive2,
  Sylenth1: sylenth1,
  Wavestate: wavestate,
  'Jupiter8': jupiter8,
  'Juno106': juno106,
  'SH101': sh101,
  Operator: operator,
  Wavetable: wavetable,
  'RetroSynth': retrosynth,
  Alchemy: alchemy,
  FM8: fm8,
  PhasePlant: phaseplant,
  Omnisphere: omnisphere,
  'AnalogLab': analoglab,
  Generic: generic
};

export default synthConfigs;