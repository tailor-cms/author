// Computes PWTEST_SHARD_WEIGHTS from per-file duration data.
//
// Simulates Playwright's sequential file distribution for candidate
// weight vectors and picks the one that minimizes the slowest shard.
//
// Usage: node compute-shard-weights.js <file-durations.json> <shardTotal>
// Output (stdout): colon-separated weight string, e.g. "3:4:3:5:2"
// Report (stderr): per-shard breakdown
import { readFileSync } from 'fs';

const MIN_WEIGHT = 1;
const MAX_WEIGHT = 6;
const MAX_ITERATIONS = 200;

function loadFileDurations(path) {
  try {
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    if (!data || typeof data !== 'object') return null;
    return Object.entries(data)
      .filter(([f]) => f.includes('functional'))
      .map(([file, duration]) => ({ file, duration }))
      .sort((a, b) => a.file.localeCompare(b.file));
  } catch {
    return null;
  }
}

// Replicates Playwright's sequential shard distribution:
// 1. Compute shard sizes proportional to weights
// 2. Distribute remainder round-robin from shard 1
// 3. Assign sorted files left-to-right
function simulate(files, shardTotal, weights) {
  const sizes = computeShardSizes(files.length, shardTotal, weights);
  return assignFiles(files, sizes);
}

function computeShardSizes(fileCount, shardTotal, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const sizes = weights.map(
    (w) => Math.floor((w * fileCount) / totalWeight),
  );
  let remainder = fileCount - sizes.reduce((a, b) => a + b, 0);
  for (let i = 0; remainder > 0; i++, remainder--) {
    sizes[i % shardTotal]++;
  }
  return sizes;
}

function assignFiles(files, sizes) {
  const shards = [];
  let idx = 0;
  for (const size of sizes) {
    const assigned = files.slice(idx, idx + size);
    shards.push({
      files: assigned,
      duration: assigned.reduce((sum, f) => sum + f.duration, 0),
      count: size,
    });
    idx += size;
  }
  return shards;
}

// Optimizer
// Hill-climbing with single-shard adjustments and pair swaps.
// Converges when no single move reduces the max shard duration.
function optimize(files, shardTotal) {
  const weights = new Array(shardTotal).fill(3);
  let bestScore = worstShard(files, shardTotal, weights);

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let improved = false;

    improved = trySingleAdjustments(files, shardTotal, weights, bestScore)
      || improved;
    bestScore = worstShard(files, shardTotal, weights);

    improved = tryPairSwaps(files, shardTotal, weights, bestScore)
      || improved;
    bestScore = worstShard(files, shardTotal, weights);

    if (!improved) break;
  }
  return weights;
}

function trySingleAdjustments(files, shardTotal, weights, bestScore) {
  let improved = false;
  for (let s = 0; s < shardTotal; s++) {
    for (const delta of [1, -1, 2, -2]) {
      const w = clamp(weights[s] + delta, MIN_WEIGHT, MAX_WEIGHT);
      if (w === weights[s]) continue;
      const candidate = [...weights];
      candidate[s] = w;
      const score = worstShard(files, shardTotal, candidate);
      if (score < bestScore) {
        weights[s] = w;
        bestScore = score;
        improved = true;
      }
    }
  }
  return improved;
}

function tryPairSwaps(files, shardTotal, weights, bestScore) {
  let improved = false;
  for (let a = 0; a < shardTotal; a++) {
    for (let b = a + 1; b < shardTotal; b++) {
      for (const [da, db] of [[1, -1], [-1, 1]]) {
        const wa = clamp(weights[a] + da, MIN_WEIGHT, MAX_WEIGHT);
        const wb = clamp(weights[b] + db, MIN_WEIGHT, MAX_WEIGHT);
        if (wa === weights[a] && wb === weights[b]) continue;
        const candidate = [...weights];
        candidate[a] = wa;
        candidate[b] = wb;
        const score = worstShard(files, shardTotal, candidate);
        if (score < bestScore) {
          weights[a] = wa;
          weights[b] = wb;
          bestScore = score;
          improved = true;
        }
      }
    }
  }
  return improved;
}

function worstShard(files, shardTotal, weights) {
  return Math.max(...simulate(files, shardTotal, weights).map((s) => s.duration));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Reporting and output formatting
function formatDuration(ms) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m${r}s` : `${s}s`;
}

// Diagnostic report via stderr — keeps stdout clean for the weights
// value captured by the CI workflow ($WEIGHTS=$(node ...)).
function logReport(files, weights, shardTotal) {
  const shards = simulate(files, shardTotal, weights);
  const max = worstShard(files, shardTotal, weights);
  const min = Math.min(...shards.map((s) => s.duration));

  const log = (...args) => console.error(...args);
  log('--- Shard weight optimizer ---');
  log(`  Files: ${files.length}, Spread: ${formatDuration(max - min)}`);
  log('');
  log('  Shard  Duration  Files  Weight  Specs');
  for (let i = 0; i < shardTotal; i++) {
    const { duration, count, files: sf } = shards[i];
    const specs = sf
      .map((f) => f.file.split('/').pop().replace('.spec.ts', ''))
      .join(', ');
    log(
      `  ${String(i + 1).padStart(5)}`
      + `  ${formatDuration(duration).padStart(8)}`
      + `  ${String(count).padStart(5)}`
      + `  ${String(weights[i]).padStart(6)}`
      + `  ${specs}`,
    );
  }
  log('');
  log(`  Weights: ${weights.join(':')}`);
  log('-----------------------------');
}

// Main
const [durationsPath, shardTotalStr] = process.argv.slice(2);
if (!durationsPath || !shardTotalStr) process.exit(0);

const shardTotal = parseInt(shardTotalStr, 10);
const files = loadFileDurations(durationsPath);
if (!files?.length) process.exit(0);

const weights = optimize(files, shardTotal);
logReport(files, weights, shardTotal);
process.stdout.write(weights.join(':'));
