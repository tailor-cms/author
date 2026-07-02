---
name: repro-spec
description: >-
  Turn a bug (GitHub issue number or description) into a failing Playwright
  spec that reproduces it - POM-based, tagged @bug, linked to the issue,
  and marked test.fail() so CI stays green until a fix flips it red. Use to
  capture a known bug as a regression-first test.
---

# Repro spec (bug -> failing test)

Builds on `/new-e2e` and `tests/CLAUDE.md`. The spec asserts the CORRECT
behaviour and is expected to fail while the bug is live.

## Steps

1. **Get context.** Given an issue number, read it: `gh issue view <n>`.
   Otherwise take the repro steps from the user.

2. **Page Object.** Identify the area and reuse/extend the POM in
   `tests/pom/<area>/` (never inline selectors). Use `/new-e2e` if a POM
   must be created first.

3. **Write the spec** under `tests/specs/functional/<area>/<name>.spec.ts`.
   Assert the expected (currently-failing) behaviour and mark it:

   ```ts
   test('order total reflects discount', {
     tag: '@bug',
     annotation: { type: 'issue', description: '<issue url>' },
   }, async ({ page }) => {
     test.fail(); // remove with @bug when #<n> is fixed
     // drive via the POM, then assert the CORRECT result
   });
   ```

4. **Keep it in the main suite.** `test.fail()` runs in CI and stays green
   (expected failure); do NOT exclude `@bug` with `--grep-invert`. Keep the
   repro deterministic - a flaky `test.fail()` will randomly redden CI.

5. **Confirm it reproduces.**
   `cd tests && pnpm playwright test specs/functional/<area>/<name>.spec.ts
   --project=chrome-admin` (setup-admin runs first). Expect an
   "expected failure".

6. **Lifecycle.** When a dev fixes the bug the test passes, Playwright
   reports "expected to fail but passed", and the build goes red - the
   signal to delete `test.fail()` + `@bug` and close the issue. Use
   `test.fixme()` instead only if the repro crashes/hangs.
