// Shared utilities for shard optimization scripts.

import { existsSync, readFileSync } from 'fs';

// Safely reads and parses a JSON file. Returns null if the file
// doesn't exist or contains invalid JSON.
export function loadJSON(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

// Loads the file-duration map and returns an array of { file, duration }
// entries for spec files (functional tests and setup specs).
export function loadFileDurations(path) {
  const data = loadJSON(path);
  if (!data || typeof data !== 'object') return null;
  const isSpecFile = (f) => f.startsWith('functional/') || f.endsWith('.setup.spec.ts');
  const entries = Object.entries(data)
    .filter(([f]) => isSpecFile(f))
    .map(([file, duration]) => ({ file, duration }));
  return entries.length > 0 ? entries : null;
}

// Formats milliseconds as a human-readable duration string (e.g. "2m15s").
export function formatDuration(ms) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m${seconds}s` : `${seconds}s`;
}
