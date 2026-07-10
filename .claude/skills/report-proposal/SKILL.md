---
name: report-proposal
description: >-
  Draft a GitHub proposal (feature / enhancement / task) - dedup, classify
  the type, fill the proposal form fields, suggest labels. DRAFT ONLY: it
  never files the issue; it hands you a ready `gh issue create` command to
  run yourself. Use when proposing new capability, an improvement, or a
  unit of work (not a defect - that's /report-bug).
---

# Draft a proposal (feature / enhancement / task)

Produces a polished, de-duplicated proposal matching
`.github/ISSUE_TEMPLATE/proposal.yml`. **Draft only** - never run
`gh issue create`; hand the user the body plus a command to file it
themselves.

## Steps

1. **Classify first.** Verify in the code that nothing is actually broken -
   if the observation is a defect (wrong behavior, error, regression),
   switch to `/report-bug` instead. Then pick the **type**: Feature (new
   capability), Enhancement (improve something that exists), Task
   (chore / refactor / config), or Documentation. Say which you picked
   and why.

2. **Collect the facts** (ask for anything missing):
   - **Summary** in one or two sentences.
   - **Motivation / problem**: what it solves, who is affected, when.
   - **Proposed behavior**: what should happen; sketch the UX/approach.
   - **Current behavior**, if it changes existing behavior - locate the
     relevant code and cite file paths so the scope is concrete.
   - **Affected area** (editor, content elements/containers, repository,
     assets, content-linking, collections, publishing, AI, admin/access,
     backend/API, extensions, infra) and the schema/container involved.
   - **Acceptance criteria** for tasks, if known.

3. **Dedup (read-only).** Search first, and stop if it already exists:
   `gh issue list --search "<key phrase> in:title" --state all
   --json number,title,state`. Show any matches; if it looks like a
   duplicate, link it instead of drafting a new one. Also check the
   deferred-idea notes in memory - some proposals were already built and
   reverted with a recipe saved.

4. **Draft the body.** Write markdown mirroring the form fields - `gh` does
   NOT render the `.yml` form in non-interactive mode, so bake the
   structure into the body. Title: `[Proposal]: <area> - <summary>`
   (matching the form's prefix; the type lives in the Type field and
   labels, not the title). Save it to a scratch file for `--body-file`.
   Include an **Implementation notes** section with the code paths found
   in step 2.

5. **Hand off - do not file.** Give the user the exact command to run
   themselves, and suggest labels:
   `gh issue create --title "[Proposal]: ..." --body-file <path>
   --label "triage"` plus a type label matching step 1 (`enhancement`,
   `task`, `documentation`) and `area:*` suggestions. Offer the
   copy-paste markdown too (no hard-wrapped lines) for filing via the
   web form.

6. **Offer** to implement it directly if the change is small (e.g. a
   config tweak) - sometimes the diff is faster than the issue.
