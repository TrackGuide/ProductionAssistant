import { generateSynthPatchGuide } from '../../services/patchGuideService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { description, synth, voiceType, descriptor, genre, notes } = req.body || {};

  if (!description || !synth) {
    return res.status(400).json({ error: 'Missing required fields: description and synth' });
  }

  try {
    const result = await generateSynthPatchGuide({
      description,
      synth,
      voiceType,
      descriptor,
      genre,
      notes
    });
    res.status(200).json(result);
  } catch (err) {
    console.error('Gemini error', err, 'Request body:', req.body);
    res.status(500).json({ error: 'Gemini generation failed', details: (err as Error).message });
  }
}