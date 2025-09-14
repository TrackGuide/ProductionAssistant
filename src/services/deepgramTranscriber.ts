// src/services/deepgramTranscriber.ts
export async function transcribeTopline(file: File): Promise<string | null> {
  const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
  if (!apiKey) {
    console.warn("Deepgram API key not set");
    return null;
  }

  const formData = new FormData();
  formData.append("audio", file);

  const response = await fetch("https://api.deepgram.com/v1/listen", {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
    },
    body: file,
  });

  if (!response.ok) {
    console.error("Deepgram transcription failed:", await response.text());
    return null;
  }

  const result = await response.json();
  const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
  return transcript || null;
}
