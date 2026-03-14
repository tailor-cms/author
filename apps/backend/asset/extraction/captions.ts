/**
 * Caption/subtitle file parser.
 *
 * Extracts plain text from VTT and SRT caption files by stripping
 * timestamps, cue identifiers, and formatting tags. Used by the
 * indexing pipeline to make video/audio content searchable.
 */
const CAPTION_EXTENSIONS = ['.vtt', '.srt'];

// VTT header, cue timestamps (00:00:00.000 --> 00:00:05.000), numeric
// cue IDs (SRT), position/alignment settings, and HTML-like tags
const NOISE = /^(WEBVTT.*|STYLE\b.*|NOTE\b.*|\d+$|[\d:.]+\s*-->.*|.+:.+)/;
const TAGS = /<[^>]+>/g;

export function isCaptionFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return CAPTION_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** Extracts plain text from VTT/SRT content. */
export function parseCaptions(raw: string): string {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !NOISE.test(line))
    .map((line) => line.replace(TAGS, ''))
    .filter(Boolean)
    .join(' ');
}
