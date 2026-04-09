// Merges Playwright JSON reports from each shard into a single
// file-duration map. Uses exponential moving average to smooth
// measurements across runs.
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

// Sums test durations per spec file from a suite tree.
// Playwright JSON nests suites as project > file, so we walk
// recursively until we find suites with a `file` property.
function sumSuiteDurations(suite, durations) {
  if (suite.file) {
    let total = 0;
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        for (const result of test.results || []) {
          total += result.duration || 0;
        }
      }
    }
    durations[suite.file] = (durations[suite.file] || 0) + total;
  }
  // Recurse into nested suites (project > file nesting)
  for (const child of suite.suites || []) {
    sumSuiteDurations(child, durations);
  }
}

function extractDurations(reportsDir) {
  const durations = {};
  const files = readdirSync(reportsDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const report = loadJSON(join(reportsDir, file));
    if (!report?.suites) continue;
    for (const suite of report.suites) {
      sumSuiteDurations(suite, durations);
    }
  }
  return durations;
}

// Only keeps files present in the current run - stale entries
// from renamed/deleted specs are automatically pruned.
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
