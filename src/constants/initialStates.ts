import { UserInputs, MixFeedbackInputs } from '../types/appTypes';

export const initialInputsState: UserInputs = {
  songTitle: '',
  genre: [],
  artistReference: '',
  referenceTrackLink: '',
  lyrics: '',
  key: '',
  scale: '',
  chords: '',
  generalNotes: '',
  vibe: [],
  daw: '',
  plugins: '',
  availableInstruments: '',
};

export const initialMixFeedbackInputsState: MixFeedbackInputs = {
  audioFile: null,
  userNotes: '',
  trackName: '',
  dawName: '',
};

export const MAX_AUDIO_FILE_SIZE_MB = 100;
export const MAX_AUDIO_FILE_SIZE_BYTES = MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024;
