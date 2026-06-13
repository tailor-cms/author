/**
 * Reads the JSON output of `pulumi preview --json` and fails the job if any
 * resource would be deleted or replaced - the destructive ops that can cause
 * data loss. A readable table is written to the GitHub step summary so the
 * outcome is visible at the top of the run, not buried in the preview diff.
 */
import { readFileSync, appendFileSync } from 'node:fs';

const DESTRUCTIVE = new Set([
  'delete',
  'replace',
  'create-replacement',
  'delete-replaced',
]);

const [, , file] = process.argv;
const preview = JSON.parse(readFileSync(file, 'utf8'));
const steps = preview.steps ?? [];
const hits = steps.filter((step) => DESTRUCTIVE.has(step.op));

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
const report = (line) => summaryPath && appendFileSync(summaryPath, `${line}\n`);
const resourceName = (urn) => (urn ? urn.split('::').pop() : urn);

if (!hits.length) {
  report('### ✅ Infra preview: no destructive changes');
  console.log('No destructive changes detected.');
  process.exit(0);
}

report('### ⛔ Infra preview: destructive changes detected');
report('');
report('| Op | Resource |');
report('| --- | --- |');
for (const step of hits) report(`| \`${step.op}\` | \`${resourceName(step.urn)}\` |`);
report('');
report('These **replace or delete** resources (possible data loss).');
report('Review carefully before merging.');

console.error(`Destructive changes detected: ${hits.length}`);
for (const step of hits) console.error(`  ${step.op}  ${step.urn}`);
process.exit(1);
