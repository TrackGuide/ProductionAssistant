
import type { SynthConfig } from "./synthConfigs";
import synthConfigs from "./synthConfigs";

export default function loadSynthConfig(synthName: string): SynthConfig {
  const config = synthConfigs[synthName];
  if (!config) throw new Error(\`Synth config not found: \${synthName}\`);
  return config;
}
