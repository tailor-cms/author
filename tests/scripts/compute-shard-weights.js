// Reads per-shard durations from a previous run and computes
// PWTEST_SHARD_WEIGHTS to balance the next run.
// Usage: node compute-shard-weights.js <durations.json> <shardTotal>
// Output: colon-separated weights string (e.g. "3:2:4:2:3")

import { readFileSync } from 'fs';

const [durationsPath, shardTotalStr] = process.argv.slice(2);
if (!durationsPath || !shardTotalStr) process.exit(0);

const shardTotal = parseInt(shardTotalStr, 10);
let durations;
try {
  durations = JSON.parse(readFileSync(durationsPath, 'utf-8'));
} catch {
  process.exit(0);
}

if (!Array.isArray(durations) || durations.length === 0) process.exit(0);

// Build duration map indexed by shard number
const entries = durations.map(({ shard, duration }) => [shard, duration || 1]);
const durationMap = new Map(entries);
const maxDuration = Math.max(...durationMap.values());

// Inverse of duration: slower shards get lower weight (fewer tests)
const weights = Array.from({ length: shardTotal }, (_, i) => {
  const dur = durationMap.get(i + 1) || maxDuration;
  return Math.max(1, Math.min(10, Math.round((maxDuration / dur) * 3)));
});

process.stdout.write(weights.join(':'));
