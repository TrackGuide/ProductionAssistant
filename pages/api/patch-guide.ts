import { generateSynthPatchGuide } from '../../services/patchGuideService';

export default async function handler(req: any, res: any) {
  const { description, synth } = req.body;
  try {
    const result = await generateSynthPatchGuide({ description, synth });
    res.status(200).json(result);
  } catch (err) {
    console.error('Gemini error', err);
    res.status(500).json({ error: 'Gemini generation failed' });
  }
}