export async function loadSynthConfig(synthName: string): Promise<any> {
  try {
    const formattedName = synthName.replace(/\s+/g, '');
    const module = await import(`./${formattedName}.json`);
    return module.default || {};
  } catch (err) {
    console.warn(`No config found for synth "${synthName}". Returning empty config.`);
    return {};
  }
}
