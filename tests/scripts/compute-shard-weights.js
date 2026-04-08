// Computes PWTEST_SHARD_WEIGHTS from historical shard durations.
//
// Uses exponentially-decayed averaging across recent runs and damps
// the result toward equal distribution to prevent oscillation.
//
// Usage: node compute-shard-weights.js <durations.json> <shardTotal>
// Output: colon-separated weight string, e.g. "3:4:3:5:2"
//
// Input format — array of runs (newest first):
//   [[{"shard":1,"duration":200}, ...], [{"shard":1,"duration":180}, ...]]
// Also accepts a flat single-run array for bootstrapping:
//   [{"shard":1,"duration":200}, ...]
import { readFileSync } from 'fs';

const MAX_HISTORY = 5;
const NEUTRAL_WEIGHT = 3;
const MIN_WEIGHT = 1;
const MAX_WEIGHT = 10;
const DAMPING_FACTOR = 0.6; // 0 = always equal, 1 = fully computed (no damping)

function loadHistory(path) {
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8'));
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const isNested = Array.isArray(raw[0]);
    return isNested ? raw.slice(0, MAX_HISTORY) : [raw];
  } catch {
    return null;
  }
}

function averageDurations(runs, shardTotal) {
  const durations = new Map();

  for (let shard = 1; shard <= shardTotal; shard++) {
    let weightedSum = 0;
    let totalWeight = 0;
    for (let i = 0; i < runs.length; i++) {
      // Exponential decay: 1, 1/2, 1/3, ...
      const recency = 1 / (i + 1);
      const entry = runs[i].find((e) => e.shard === shard);
      if (entry?.duration) {
        weightedSum += entry.duration * recency;
        totalWeight += recency;
      }
    }
    durations.set(shard, totalWeight > 0 ? weightedSum / totalWeight : 0);
  }
  return durations;
}

function computeWeights(durations, shardTotal) {
  const maxDuration = Math.max(...durations.values());
  if (maxDuration === 0) return null;
  return Array.from({ length: shardTotal }, (_, i) => {
    const duration = durations.get(i + 1) || maxDuration;
    // Inverse ratio: fast shards get higher weight (more tests)
    const ideal = (maxDuration / duration) * NEUTRAL_WEIGHT;
    // Blend toward neutral to prevent over-correction
    const damped = NEUTRAL_WEIGHT + DAMPING_FACTOR * (ideal - NEUTRAL_WEIGHT);
    return clamp(Math.round(damped), MIN_WEIGHT, MAX_WEIGHT);
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const [durationsPath, shardTotalStr] = process.argv.slice(2);
if (!durationsPath || !shardTotalStr) process.exit(0);

const shardTotal = parseInt(shardTotalStr, 10);
const runs = loadHistory(durationsPath);
if (!runs) process.exit(0);

const durations = averageDurations(runs, shardTotal);
const weights = computeWeights(durations, shardTotal);
if (!weights) process.exit(0);

process.stdout.write(weights.join(':'));
