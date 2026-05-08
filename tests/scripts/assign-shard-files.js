// Assigns test files to a specific shard using greedy bin-packing.
//
// Playwright's native --shard distributes files alphabetically, which
// clusters heavy specs that sort adjacently. This script replaces --shard
// with duration-aware assignment: each shard gets a balanced mix of heavy
// and light files, minimizing the slowest shard's total runtime.
//
// How it works:
// 1. Load per-file durations from the cached duration map (built by
//    merge-file-durations.js after each CI run).
// 2. Sort files by duration, heaviest first.
// 3. Greedily assign each file to whichever shard currently has the
//    least total work — classic "Longest Processing Time" (LPT)
//    heuristic for makespan minimization.
// 4. Output the file paths assigned to the requested shard index.
//
// On first run (no cache), the script exits silently and the workflow
// falls back to Playwright's default distribution.
//
// Usage: node assign-shard-files.js <durations.json> <shardIndex> <shardTotal>
// Output (stdout): space-separated file paths for this shard
// Report (stderr): full distribution table
import { formatDuration, loadFileDurations } from './lib.js';

// Greedy bin-packing using LPT (Longest Processing Time first).
// Sorts files heaviest-first, then assigns each to the shard with
// the smallest accumulated duration. This guarantees the makespan
// (slowest shard) is at most 4/3 of the optimal for 2 shards, and
// converges toward optimal as shard count increases.
function binPack(files, shardTotal) {
  const sorted = [...files].sort((a, b) => b.duration - a.duration);
  const shards = Array.from({ length: shardTotal }, () => ({
    files: [],
    duration: 0,
  }));
  for (const file of sorted) {
    const lightest = findLightestShard(shards);
    shards[lightest].files.push(file);
    shards[lightest].duration += file.duration;
  }
  return shards;
}

// Returns the index of the shard with the smallest total duration.
function findLightestShard(shards) {
  return shards.reduce(
    (min, shard, i) => (shard.duration < shards[min].duration ? i : min),
    0,
  );
}

// Diagnostic report via stderr — keeps stdout clean for the file
// paths captured by the CI workflow (FILES=$(node ...)).
function logReport(shards, shardIndex) {
  const max = Math.max(...shards.map((s) => s.duration));
  const min = Math.min(...shards.map((s) => s.duration));

  const log = (...args) => console.error(...args);
  log('--- Shard file assignment (bin-packing) ---');
  log(`  Spread: ${formatDuration(max - min)}`);
  log('');
  log('  Shard  Duration  Files  Specs');
  for (let i = 0; i < shards.length; i++) {
    const { files, duration } = shards[i];
    const marker = i === shardIndex - 1 ? ' <-' : '';
    const specs = files
      .map((f) => f.file.split('/').pop().replace('.spec.ts', ''))
      .join(', ');
    log(
      `  ${String(i + 1).padStart(5)}`
      + `  ${formatDuration(duration).padStart(8)}`
      + `  ${String(files.length).padStart(5)}`
      + `  ${specs}${marker}`,
    );
  }
  log('-------------------------------------------');
}

// Main
const [durationsPath, shardIndexStr, shardTotalStr] = process.argv.slice(2);
if (!durationsPath || !shardIndexStr || !shardTotalStr) process.exit(0);

const shardIndex = parseInt(shardIndexStr, 10);
const shardTotal = parseInt(shardTotalStr, 10);
const files = loadFileDurations(durationsPath);
// No durations cached yet — let the workflow fall back to --shard
if (!files?.length) process.exit(0);

const shards = binPack(files, shardTotal);
logReport(shards, shardIndex);

// Output file paths relative to the tests directory
const paths = shards[shardIndex - 1].files.map((f) => `specs/${f.file}`);
process.stdout.write(paths.join(' '));
