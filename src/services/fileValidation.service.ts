import { MAX_AUDIO_FILE_SIZE_BYTES, MAX_AUDIO_FILE_SIZE_MB } from '../constants/initialStates';

export class FileValidationService {
  static validateAudioFile(file: File): string | null {
    if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
      return `File is too large. Maximum size is ${MAX_AUDIO_FILE_SIZE_MB}MB.`;
    }
    
    if (!file.type.startsWith('audio/')) {
      return 'Invalid file type. Please upload an audio file (e.g., MP3, WAV).';
    }
    
    return null;
  }

  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}