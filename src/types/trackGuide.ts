export interface TrackGuideInputs {
  genre: string;
  vibe: string;
  daw?: string;
  additionalContext?: string;
  availableInstruments?: string;
}

export interface TrackGuideSection {
  title: string;
  content: string;
  type: 'arrangement' | 'mixing' | 'sound-design' | 'composition' | 'general';
}

export interface TrackGuideResult {
  id: string;
  title: string;
  genre: string;
  vibe: string;
  daw: string;
  additionalContext: string;
  availableInstruments: string;
  content: string;
  createdAt: string;
  sections?: TrackGuideSection[];
  metadata?: {
    generationTime: number;
    inputHash: string;
    version: string;
  };
}

export interface TrackGuideGenerationOptions {
  includeArrangement?: boolean;
  includeMixing?: boolean;
  includeSoundDesign?: boolean;
  includeComposition?: boolean;
  maxLength?: number;
  detailLevel?: 'basic' | 'intermediate' | 'advanced';
}