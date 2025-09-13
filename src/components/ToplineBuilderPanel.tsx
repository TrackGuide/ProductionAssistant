import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  analyzeTopline,
  generateGuidebookFromToplineStream,
  generateMidiFromTopline,
} from "../services/geminiService";
import {
  UserInputs,
  MidiFromToplineSettings,
  ToplineAnalysis,
  GeneratedMidiPatterns,
} from "../constants/types";
import { MarkdownRenderer } from "./MarkdownRenderer";


type Props = {
  inputs: UserInputs;
  defaultMidi?: Partial<MidiFromToplineSettings>;
  onGuideDone?: (fullText: string, analysis?: ToplineAnalysis) => void;
  onMidiReady?: (midi: GeneratedMidiPatterns) => void;
};

const ACCEPT = "audio/wav,audio/mpeg,audio/x-m4a,audio/mp4,audio/aac,audio/flac";

export default function ToplineBuilderPanel({
  inputs,
  defaultMidi,
  onGuideDone,
  onMidiReady,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ToplineAnalysis | null>(null);
  const [guide, setGuide] = useState<string>("");
  const [busy, setBusy] = useState<null | "analyzing" | "guiding" | "midi">(null);
  const [error, setError] = useState<string | null>(null);
  const guideRef = useRef<string>("");

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setAnalysis(null);
    setGuide("");
    setError(null);
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!file) return;
    try {
      setBusy("analyzing");
      setError(null);
      const result = await analyzeTopline(file);
      setAnalysis(result);
    } catch (err: any) {
      setError(err?.message || "Topline analysis failed.");
    } finally {
      setBusy(null);
    }
  }, [file]);

  const streamGuide = useCallback(async () => {
    if (!analysis) return;
    try {
      setBusy("guiding");
      setError(null);
      guideRef.current = "";
      setGuide("");

      const stream = await generateGuidebookFromToplineStream(inputs, analysis);
      for await (const { text } of stream) {
        if (text) {
          guideRef.current += text;
          setGuide(prev => prev + text);
        }
      }
      onGuideDone?.(guideRef.current, analysis);
    } catch (err: any) {
      setError(err?.message || "Guide streaming failed.");
    } finally {
      setBusy(null);
    }
  }, [analysis, inputs, onGuideDone]);

  async function collectJsonFromStream(stream: AsyncIterable<any>): Promise<string> {
    let buf = "";
    for await (const chunk of stream) {
      const t = chunk?.text ?? "";
      if (t) buf += t;
    }
    const fenced = /^```(?:json)?\s*\n([\s\S]*?)\n```$/m;
    const m = buf.match(fenced);
    return m ? m[1].trim() : buf.trim();
  }

  const generateMidi = useCallback(async () => {
    if (!analysis) return;
    try {
      setBusy("midi");
      setError(null);

      const midiSettings: MidiFromToplineSettings = {
        key: inputs.key || (typeof analysis.key === "string" ? analysis.key : "C major"),
        scale: inputs.scale || (typeof analysis.scale === "string" ? analysis.scale : undefined),
        tempo: defaultMidi?.tempo ?? 120,
        timeSignature: defaultMidi?.timeSignature ?? [4, 4],
        chordProgression: inputs.chords || (analysis.chordCandidates?.[0]?.chords ?? "C - G - Am - F"),
        genre: Array.isArray(inputs.genre) ? inputs.genre.join(", ") : (inputs.genre as any),
        bars: defaultMidi?.bars ?? 8,
        targetInstruments: defaultMidi?.targetInstruments ?? ["chords", "bassline", "melody", "drums"],
        guidebookContext: defaultMidi?.guidebookContext ?? "Topline-driven MIDI",
        songSection: defaultMidi?.songSection ?? "Verse",
        topline: analysis,
        avoidDoublingMelody: true,
      };

      const stream = await generateMidiFromTopline(midiSettings);
      const jsonStr = await collectJsonFromStream(stream);
      const parsed: GeneratedMidiPatterns = JSON.parse(jsonStr);
      onMidiReady?.(parsed);
    } catch (err: any) {
      setError(err?.message || "MIDI generation failed.");
    } finally {
      setBusy(null);
    }
  }, [analysis, defaultMidi, inputs, onMidiReady]);

  const disabled = useMemo(() => busy !== null, [busy]);
  const canGuide = !!analysis;
  const canMidi = !!analysis;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input type="file" accept={ACCEPT} onChange={handleFileChange} disabled={disabled} />
        <button className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                onClick={runAnalysis} disabled={!file || disabled}>
          {busy === "analyzing" ? "Analyzing…" : "Analyze Topline"}
        </button>
        <button className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                onClick={streamGuide} disabled={!canGuide || disabled}>
          {busy === "guiding" ? "Generating Guide…" : "Generate Vocal-First Guide"}
        </button>
        <button className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                onClick={generateMidi} disabled={!canMidi || disabled}>
          {busy === "midi" ? "Generating MIDI…" : "Generate MIDI From Topline"}
        </button>
      </div>

      {analysis && (
        <div className="text-sm p-3 rounded bg-gray-50 border">
          <div><strong>Detected:</strong></div>
          <div>BPM: {typeof analysis.bpm === "number" ? analysis.bpm : analysis.bpm}</div>
          <div>Key/Scale: {analysis.key} / {analysis.scale}</div>
          <div>Phrases: {analysis.phrases.length} • Sections: {analysis.sections.length}</div>
          <div>Motif: {analysis.motifSummary || "—"}</div>
        </div>
      )}

      {guide && (
        <div className="p-3 rounded border bg-white">
          <MarkdownRenderer markdown={guide} />
        </div>
      )}

      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}
