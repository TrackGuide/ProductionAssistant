import { UserInputs, MixFeedbackInputs } from '../constants/types';

export const initialInputsState: UserInputs = {
  genre: '',
  mood: '',
  tempo: 120,
  key: 'C',
  scale: 'major',
  instruments: [],
  description: ''
};

export const initialMixFeedbackInputsState: MixFeedbackInputs = {
  description: '',
  focusAreas: []
};

export const MAX_AUDIO_FILE_SIZE_MB = 100;
export const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;
