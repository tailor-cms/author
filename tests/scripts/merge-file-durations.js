// Merges Playwright JSON reports from each shard into a single
// file-duration map. Uses exponential moving average (EMA) to smooth
// measurements across runs.
//
// Playwright's JSON reporter nests suites as project > file, so we
// walk the tree recursively to find file-level durations regardless
// of nesting depth.
//
// Usage: node merge-file-durations.js <reports-dir> <output> [previous]
//   reports-dir — directory with test-durations-*.json from each shard
//   output      — path to write the merged duration map
//   previous    — optional path to a previous duration map (for EMA)
import { readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import { loadJSON } from './lib.js';

// Blend factor: 0 = ignore history, 1 = ignore current
const EMA_DECAY = 0.3;

// Yields every suite in a Playwright JSON report. The suite tree
// is nested as project > file > spec, so we walk recursively to
// surface file-level suites regardless of depth.
function* walkSuites(suite) {
  yield suite;
  for (const child of suite.suites || []) yield* walkSuites(child);
}

// Sums all test result durations within a single suite.
function sumSuiteDuration(suite) {
  return (suite.specs || [])
    .flatMap((spec) => spec.tests || [])
    .flatMap((test) => test.results || [])
    .reduce((total, result) => total + (result.duration || 0), 0);
}

// Reads all JSON reports from a directory and extracts per-file durations.
function extractDurations(reportsDir) {
  const durations = {};
  const reports = readdirSync(reportsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => loadJSON(join(reportsDir, f)))
    .filter((report) => report?.suites);

  for (const report of reports) {
    for (const root of report.suites) {
      for (const suite of walkSuites(root)) {
        if (!suite.file) continue;
        // Multiple shards/projects may report the same file
        durations[suite.file] = (durations[suite.file] || 0) + sumSuiteDuration(suite);
      }
    }
  }
  return durations;
}

// Blends previous and current durations using EMA. Only keeps files
// present in the current run — stale entries from renamed/deleted
// specs are automatically pruned.
function applyEMA(previous, current) {
  const merged = {};
  for (const [file, duration] of Object.entries(current)) {
    merged[file] = file in previous
      ? Math.round(previous[file] * EMA_DECAY + duration * (1 - EMA_DECAY))
      : duration;
  }
  return merged;
}

// Main
const [reportsDir, outputPath, previousPath] = process.argv.slice(2);
if (!reportsDir || !outputPath) {
  console.error(
    'Usage: merge-file-durations.js <reports-dir> <output> [previous]',
  );
  process.exit(1);
}

const previous = loadJSON(previousPath || outputPath) || {};
const current = extractDurations(reportsDir);
const merged = applyEMA(previous, current);

writeFileSync(outputPath, JSON.stringify(merged, null, 2));

const count = Object.keys(merged).length;
const totalSeconds = Object.values(merged).reduce((a, b) => a + b, 0) / 1000;
console.error(`Merged ${count} files, total: ${Math.round(totalSeconds)}s`);
