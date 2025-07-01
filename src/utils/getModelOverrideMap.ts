import synthsConfig from '../components/synthconfigs.json';
import { MODEL_OVERRIDES, SynthesisType } from '../synthesisTypes';

/**
 * Maps synth models to their synthesis types based on the MODEL_OVERRIDES
 * @returns A record mapping each synth model to its corresponding synthesis type (or 'unknown')
 */
export function getModelOverrideMap(): Record<string, SynthesisType | 'unknown'> {
  const map: Record<string, SynthesisType | 'unknown'> = {};
  
  // Get all model names from synthsConfig
  const models: string[] = Object.keys(synthsConfig);

  models.forEach(model => {
    const found = (Object.keys(MODEL_OVERRIDES) as SynthesisType[])
      .find(type => MODEL_OVERRIDES[type].includes(model));
    map[model] = found ?? 'unknown';
  });

  return map;
}

/**
 * Gets a list of synth models that support a specific synthesis type
 * @param synthesisType The synthesis type to filter by
 * @returns Array of synth models that support the given synthesis type
 */
export function getModelsByType(synthesisType: SynthesisType): string[] {
  return MODEL_OVERRIDES[synthesisType] || [];
}
