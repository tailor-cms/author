---
name: document-pr
description: >-
  Draft a clear, reviewer-ready pull request description for the current
  branch (or an existing PR) - feature-first summary, motivation, test
  plan, linked issues - verified against the real diff. DRAFT ONLY: it
  never creates, edits, or pushes; it hands you a ready `gh pr
  create`/`gh pr edit` command to run yourself. Use when writing up a PR.
---

# Document a pull request

Produces a polished PR description that answers the three questions every
reviewer needs - **what** changed, **why**, and **how to verify** - in this
repo's house style (concise, feature-first bullets, user-facing framing).
**Draft only** - never run `gh pr create`/`gh pr edit`/`git push`; hand the
user the body plus a command to apply it themselves.

## Steps

1. **Read the real diff (read-only).** Never describe from memory - every
   claim must trace to the diff. Establish the base branch (usually `main`)
   and inspect:
   - `git log main..HEAD --oneline` - commits on the branch.
   - `git diff --stat main...HEAD` - files and scope touched.
   - `git diff main...HEAD` - the actual change; skim for behaviour.
   - Existing PR? `gh pr view <n> --json title,body,url` and
     `gh pr diff <n>`.
   Note any issue the branch/commits reference (for `Closes #<n>`).

2. **Separate features from plumbing.** Lead with the user-facing change,
   not the enabling tech (e.g. "Deleting a record honors its relationship
   policy", not "Added an onDelete hook"). Group internal
   refactors/chores under a lower "Internal" bullet so reviewers spend
   their attention on behaviour.

3. **Draft the body** (save to a scratch file for `--body-file`). Keep it
   tight - about 5 sections, ~200-400 words, tradeoffs surfaced early.
   Drop any section that does not apply rather than padding it:
   - **Summary** - 1-2 sentences: what this PR delivers and why now.
   - **Changes** - feature-first bullets of user-facing behaviour;
     internal changes grouped last.
   - **Why / context** - the problem solved and, if the approach is
     non-obvious, why this over the alternatives. Link issues:
     `Closes #<n>`.
   - **How to test** - deterministic steps a reviewer can follow:
     commands (`pnpm e2e:functional`, single-spec run, `pnpm seed`),
     env/feature flags (e.g. `aiUiEnabled`), fixtures/URLs, edge cases -
     never just "tested locally".
   - **Screenshots / visual** - for any UI change, leave a placeholder
     for before/after images or a GIF; note Percy coverage if added.
   - **Risk / rollback & follow-ups** - migrations, breaking changes,
     what to watch after merge, and anything deliberately out of scope.

4. **Title.** Concise and specific, feature-first (`<area>: <what
   changed>`). Verify it matches what the diff actually does.

5. **Hand off - do not create, edit, or push.** Give the exact command:
   - New PR: `gh pr create --title "..." --body-file <path>` (add
     `--base main --draft` as needed).
   - Existing PR: `gh pr edit <n> --body-file <path>`.
   Suggest labels/reviewers, but let the user run it.
