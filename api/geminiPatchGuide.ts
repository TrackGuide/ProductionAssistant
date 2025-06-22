import { GoogleGenerativeAI } from "@google/genai";
import { GEMINI_MODEL_NAME } from "../constants";
import { loadSynthConfig } from "../config/loadSynthConfig";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { synth, description } = req.body;
  try {
    const synthConfig = await loadSynthConfig(synth);
    const oscDescriptions = synthConfig?.oscillators?.map((o) => `- ${o.name} (${o.type})`) || [];
    const filterDescriptions = synthConfig?.filters?.map((f) => `- ${f.name} (${f.types?.join(", ")})`) || [];
    const prompt = `
You are an expert sound designer. The user has selected the synth: "${synth}".

**Synth Description:** ${description}

**Synth Capabilities:**

### Oscillators:
${oscDescriptions.length ? oscDescriptions.join("\n") : "- No details provided"}

### Filters:
${filterDescriptions.length ? filterDescriptions.join("\n") : "- No details provided"}

### Envelopes:
${synthConfig?.envelopes?.count || 2} envelopes available.

### Modulation Sources:
${synthConfig?.modSources?.join(", ") || "Unknown"}

### Modulation Destinations:
${Object.keys(synthConfig?.modDestinations || {}).join(", ") || "Unknown"}

---

**Your task: Generate a patch guide that includes:**

1️⃣ Detailed written patch instructions in Markdown  
2️⃣ Oscillator settings → "oscSettings" object  
3️⃣ Filter knobs → "knobs" object  
4️⃣ ADSR envelopes → "adsrVCF" and "adsrVCA"  
5️⃣ Modulation matrix → "modMatrix" array  

**REQUIRED JSON STRUCTURE:**

{
  "text": "### PATCH INSTRUCTIONS IN MARKDOWN",
  "oscSettings": { "osc1_param": value, ... },
  "knobs": { "filter_cutoff": value, ... },
  "adsrVCF": { "attack": X, "decay": X, "sustain": X, "release": X },
  "adsrVCA": { "attack": X, "decay": X, "sustain": X, "release": X },
  "modMatrix": [
    { "source": "sourceName", "target": "targetName", "amount": number },
    ...
  ]
}

⚠️ Respond ONLY with this JSON object. Do not include explanations or extra text.`;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);
    const result = await genAI.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
    });
    const text = result.text() || '';
    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      const jsonString = text.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonString);
      res.status(200).json(parsed);
    } catch (err) {
      res.status(200).json({ text });
    }
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error generating patch guide' });
  }
}
