// Shared utilities for shard optimization scripts.

import { existsSync, readFileSync } from 'fs';

export function loadJSON(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

export function loadFileDurations(path) {
  const data = loadJSON(path);
  if (!data || typeof data !== 'object') return null;
  return Object.entries(data)
    .filter(([f]) => f.includes('functional') || f.includes('.setup'))
    .map(([file, duration]) => ({ file, duration }));
}

export function formatDuration(ms) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m${r}s` : `${s}s`;
}
