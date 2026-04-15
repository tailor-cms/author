// Re-export from the ESM bundle directly.
// The package's CJS entry (main) is broken - its toStringTag is set
// before exports, so Node's ESM named-import resolution fails.
export {
  YoutubeTranscript,
  fetchTranscript,
} from 'youtube-transcript/dist/youtube-transcript.esm.js';
