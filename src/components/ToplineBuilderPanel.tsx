import React from "react";
import { UploadIcon } from "./icons";
import { Card } from "./Card";

export type ToplineStatus = "idle" | "analyzing" | "done" | "error";

type Props = {
  /** Called when user picks an audio file; parent kicks off background analysis */
  onFileSelected: (file: File) => void;
  /** Parent-managed status of background analysis */
  status: ToplineStatus;
  /** Optional message (e.g., â€œDetecting BPMâ€¦â€) to show while analyzing */
  message?: string;
  /** If analysis finished, show short summary (parent-provided) */
  summary?: React.ReactNode;
  /** Currently selected file name (optional) */
  filename?: string | null;
  /** Optional lyric preview lines to display when provided */
  lyricsPreview?: string[];
  /** Optional one-liner like "90 BPM Â· 4/4 Â· E major" */
  toplineOneLiner?: string;
};

export default function ToplineBuilderPanel({
  onFileSelected,
  status,
  message,
  summary,
  filename,
  lyricsPreview,
  toplineOneLiner,
}: Props) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-200">
        Topline / Vocal (optional)
      </label>

      <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-600 bg-gray-700/30 hover:bg-gray-600 cursor-pointer transition-colors">
        <UploadIcon className="w-4 h-4 text-gray-300" />
        <span className="text-sm text-gray-200">
          {filename || "Choose audio file (WAV, MP3, etc.)"}
        </span>
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileSelected(f);
          }}
        />
      </label>

      {(status !== "idle" ||
        !!summary ||
        (lyricsPreview && lyricsPreview.length > 0) ||
        !!toplineOneLiner) && (
        <Card className="p-3 bg-gray-700/40 border border-gray-600/50 text-sm">
          {status === "analyzing" && (
            <div className="text-gray-300">
              <p>
                {message ||
                  "Analyzing topline (BPM / key / scale / lyrics)â€¦"}
              </p>
              <p className="mt-1 text-yellow-300/90 text-xs">
                Guidebook generation is paused until analysis completes.
              </p>
            </div>
          )}

          {status === "done" &&
            (summary ||
              (lyricsPreview && lyricsPreview.length > 0) ||
              toplineOneLiner) &&
            (summary ?? (
              <div className="text-gray-300 space-y-2">
                {toplineOneLiner && (
                  <div className="text-gray-200">
                    <strong>Detected:</strong> {toplineOneLiner}
                  </div>
                )}
                {lyricsPreview && lyricsPreview.length > 0 && (
                  <div>
                    <div className="text-gray-300 font-medium mb-1">
                      Lyrics (preview):
                    </div>
                    <ul className="list-disc list-inside text-gray-300">
                      {lyricsPreview.slice(0, 6).map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

          {status === "error" && (
            <p className="text-red-400">
              Topline analysis failed. You can still generate a TrackGuide
              without it.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}