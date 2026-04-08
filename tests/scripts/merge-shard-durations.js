// Merges per-shard duration reports into a rolling history file.
// Prepends the current run and keeps the last N runs.
//
// Usage: node merge-shard-durations.js <reports-dir> <history-file>
// - reports-dir: directory containing shard-*.json files from current run
// - history-file: path to read/write the rolling history
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';

const MAX_HISTORY = 5;

function loadHistory(path) {
  if (!existsSync(path)) return [];
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8'));
    if (!Array.isArray(raw)) return [];
    return Array.isArray(raw[0]) ? raw : [raw];
  } catch {
    return [];
  }
}

function loadCurrentRun(directory) {
  const files = readdirSync(directory).filter((f) => f.endsWith('.json'));
  return files.map((f) => JSON.parse(readFileSync(`${directory}/${f}`, 'utf-8')));
}

const [reportsDir, historyFile] = process.argv.slice(2);
if (!reportsDir || !historyFile) {
  console.error('Usage: merge-shard-durations.js <reports-dir> <history-file>');
  process.exit(1);
}

const history = loadHistory(historyFile);
const current = loadCurrentRun(reportsDir);
const updated = [current, ...history].slice(0, MAX_HISTORY);

writeFileSync(historyFile, JSON.stringify(updated));
