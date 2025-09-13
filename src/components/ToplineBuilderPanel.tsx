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
import { Button } from "./Button";
import { Card } from "./Card";
import { UploadIcon } from "./icons";
import { MarkdownRenderer } from "./MarkdownRenderer";

type Props = {
  inputs: UserInputs;
  defaultMidi?: Partial<MidiFromToplineSettings>;
  onGuideDone?: (fullText: string, analysis?: ToplineAnalysis) => void;
  onMidiReady?: (midi: GeneratedMidiPatterns) => void;
};

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
          setGuide((prev) => prev + text);
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

  return (
    <div className="space-y-4">
      {/* File upload */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Upload Topline / Vocal
        </label>
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-600 bg-gray-700/30 hover:bg-gray-600 cursor-pointer transition-colors">
          <UploadIcon className="w-4 h-4 text-gray-300" />
          <span className="text-sm text-gray-200">
            {file ? file.name : "Choose File"}
          </span>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={runAnalysis}
          disabled={!file || disabled}
        >
          {busy === "analyzing" ? "Analyzing…" : "Analyze Topline"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={streamGuide}
          disabled={!analysis || disabled}
        >
          {busy === "guiding" ? "Generating Guide…" : "Generate Vocal-First Guide"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={generateMidi}
          disabled={!analysis || disabled}
        >
          {busy === "midi" ? "Generating MIDI…" : "Generate MIDI From Topline"}
        </Button>
      </div>

      {/* Analysis summary */}
      {analysis && (
        <Card className="p-3 bg-gray-700/40 border border-gray-600/50 text-sm">
          <div className="text-gray-200 font-semibold mb-1">Detected Topline</div>
          <p>BPM: {typeof analysis.bpm === "number" ? analysis.bpm : analysis.bpm}</p>
          <p>Key / Scale: {analysis.key} / {analysis.scale}</p>
          <p>Phrases: {analysis.phrases.length} • Sections: {analysis.sections.length}</p>
          <p>Motif: {analysis.motifSummary || "—"}</p>
        </Card>
      )}

      {/* Streamed guide */}
      {guide && (
        <Card className="p-3 bg-gray-700/40 border border-gray-600/50">
          <MarkdownRenderer markdown={guide} />
        </Card>
      )}

      {/* Errors */}
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
