/**
 * Utility functions for parsing AI-generated JSON responses.
 * - Handles markdown code fences found anywhere in the text
 * - Extracts a balanced JSON object if extra prose is present
 * - Repairs common JSON quirks (trailing commas, single quotes, NaN/Infinity, smart quotes, BOM)
 */

/* ---------------------------------- Core helpers ---------------------------------- */

/** Try to pull a JSON object out of a text blob (handles fences, prose, etc.) */
export function extractJsonObject(text: string): string | null {
  if (!text) return null;
  let s = text.trim();

  // 1) Strip markdown code fences if present (match anywhere)
  const fence = s.match(/```(?:json|json5)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) s = fence[1].trim();

  // 2) Find first balanced { ... }
  const start = s.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

/** Light repair for common model JSON issues (trailing commas, single quotes, NaN/Infinity, smart quotes, BOM) */
export function lightJsonRepair(jsonish: string): string {
  let s = jsonish ?? "";

  // Remove BOM
  s = s.replace(/^\uFEFF/, "");

  // Replace smart quotes with straight quotes
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // Remove stray backticks
  s = s.replace(/`+/g, "");

  // Trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, "$1");

  // Very conservative single->double quotes for keys and string values
  s = s.replace(/([{,\s])'([^'\n\r]+?)'\s*:/g, '$1"$2":');
  s = s.replace(/:\s*'([^'\n\r]*?)'/g, ': "$1"');

  // NaN/Infinity → null
  s = s.replace(/\bNaN\b/g, "null").replace(/\bInfinity\b/g, "null");

  return s.trim();
}

/**
 * Extracts and cleans JSON from AI responses that may contain markdown formatting.
 * Returns a repaired JSON string ready for parsing.
 * Throws if no valid JSON structure is found.
 */
export const extractJsonFromAiResponse = (
  rawResponse: string,
  contextName: string = "AI response"
): string => {
  let jsonStr = (rawResponse ?? "").trim();
  if (!jsonStr) {
    throw new Error(`Empty ${contextName} received`);
  }

  // 1) Handle markdown code fences found ANYWHERE in the string
  const fenceAnywhere = rawResponse.match(/```(?:json|json5)?\s*([\s\S]*?)```/i);
  if (fenceAnywhere && fenceAnywhere[1]) {
    jsonStr = fenceAnywhere[1].trim();
  }

  // 2) Remove markdown artifacts + language labels + BOM + smart quotes
  jsonStr = jsonStr
    .replace(/^\uFEFF/, "") // BOM
    .replace(/^`+|`+$/g, "") // stray backticks
    .replace(/^json5?\s*/i, "") // 'json' / 'json5' labels
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();

  // 3) If not clearly a single JSON object, attempt balanced extraction
  const looksObject = jsonStr.startsWith("{") && jsonStr.endsWith("}");
  if (!looksObject) {
    const balanced = extractJsonObject(jsonStr);
    if (balanced) {
      jsonStr = balanced;
    } else {
      throw new Error(
        `${contextName} doesn't contain valid JSON structure. Got: ${jsonStr.substring(
          0,
          100
        )}...`
      );
    }
  }

  // 4) Final light repair for common JSON quirks
  jsonStr = lightJsonRepair(jsonStr);
  return jsonStr;
};

/* ------------------------------ Generic safe parsing ------------------------------ */

export function parseJsonSafe<T = any>(
  raw: string,
  opts?: { label?: string; requiredKeys?: string[]; coerce?: (obj: any) => any }
): { ok: true; data: T } | { ok: false; error: string; raw: string } {
  const label = opts?.label || "AI JSON";
  const required = opts?.requiredKeys || [];
  const coerce = opts?.coerce;

  const candidates: string[] = [];
  candidates.push(raw);

  const extracted = extractJsonObject(raw);
  if (extracted) candidates.push(extracted);

  for (const candidate of candidates) {
    for (const version of [candidate, lightJsonRepair(candidate)]) {
      try {
        let obj = JSON.parse(version) as T;

        // Minimal structural check + required keys
        if (required.length) {
          if (obj == null || typeof obj !== "object") continue;
          const missing = required.filter((k) => !(k in (obj as any)));
          if (missing.length) continue;
        }

        // Optional coercion (e.g., string numbers -> numbers)
        if (coerce) obj = coerce(obj);

        return { ok: true, data: obj };
      } catch {
        // try next
      }
    }
  }
  return { ok: false, error: `Unable to parse ${label}`, raw };
}

/* ------------------------------ MIDI-specific helper ----------------------------- */

/**
 * Parses AI-generated MIDI patterns with enhanced error handling and fallback.
 * Returns parsed T (or fallback if provided), otherwise throws a descriptive error.
 */
export const parseAiMidiResponse = <T = any>(
  rawResponse: string,
  contextName: string = "MIDI generation",
  fallback?: T
): T => {
  try {
    const cleanedJson = extractJsonFromAiResponse(rawResponse, contextName);
    return JSON.parse(cleanedJson) as T;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown parsing error";

    // Last resort: try balanced extractor directly on the raw text + repair
    const balanced = extractJsonObject(rawResponse);
    if (balanced) {
      try {
        return JSON.parse(lightJsonRepair(balanced)) as T;
      } catch {
        /* fall through */
      }
    }

    if (fallback !== undefined) {
      return fallback;
    }

    // Provide more specific messages for common issues
    if (errorMessage.includes("Unexpected token")) {
      if (errorMessage.includes("`")) {
        throw new Error(
          `AI returned invalid JSON for ${contextName}. (${errorMessage}) The response likely contains markdown formatting that wasn't properly cleaned.`
        );
      } else {
        throw new Error(`AI returned malformed JSON for ${contextName}. (${errorMessage})`);
      }
    }
    throw new Error(`Failed to parse ${contextName} response: ${errorMessage}`);
  }
};

/* ---------------------------- Topline-specific helper ---------------------------- */

/** Small helper to coerce common numeric fields returned as strings. */
function coerceToplineNumbers(obj: any) {
  const toNum = (v: any) =>
    typeof v === "string" && /^\d+(\.\d+)?$/.test(v) ? Number(v) : v;
  if (obj && typeof obj === "object") {
    if ("bpm" in obj) (obj as any).bpm = toNum((obj as any).bpm);
    if ("confidence" in obj) (obj as any).confidence = toNum((obj as any).confidence);
  }
  return obj;
}

/**
 * Topline-specific wrapper using parseJsonSafe
 * Ensures core fields exist and lightly coerces numeric strings.
 */
export function parseAiToplineResponse<T = any>(raw: string) {
  return parseJsonSafe<T>(raw, {
    label: "Topline JSON",
    requiredKeys: ["bpm", "timeSignature", "key", "scale"], // soft but useful
    coerce: coerceToplineNumbers,
  });
}
