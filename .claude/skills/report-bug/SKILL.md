---
name: report-bug
description: >-
  Draft a high-quality GitHub bug report from a QA observation - dedup,
  fill the bug_report form fields, suggest labels. DRAFT ONLY: it never
  files the issue; it hands you a ready `gh issue create` command to run
  yourself. Use when QA finds a defect to report.
---

# Draft a bug report (QA)

Produces a polished, de-duplicated bug report matching
`.github/ISSUE_TEMPLATE/bug_report.yml`. **Draft only** - never run
`gh issue create`; hand the user the body plus a command to file it
themselves.

## Steps

1. **Verify it's a defect.** Check the code: if nothing is broken (works
   as designed, missing affordance, "should allow X") it's a proposal,
   not a bug - switch to `/report-proposal` and draft against
   `proposal.yml` instead. Then collect the facts (ask for anything
   missing):
   - Symptom in one line; deterministic **steps to reproduce** (with test
     data / URLs); **expected** vs **actual**.
   - **Affected area** (editor, content elements/containers, repository,
     assets, content-linking, collections, publishing, AI, admin/access,
     backend/API, extensions, infra) and the schema/container involved.
   - **Severity** = impact if shipped, not urgency: S1 critical, S2 major,
     S3 minor (workaround), S4 cosmetic.
   - **Environment**: browser / Playwright project, OS, app commit
     (`git rev-parse --short HEAD`), env (local/staging/prod).
   - **Evidence**: point to a Playwright `trace.zip` / screenshot under
     `tests/test-results/` if one exists.

2. **Dedup (read-only).** Search first, and stop if it already exists:
   `gh issue list --search "<key phrase> in:title" --state all
   --json number,title,state`. Show any matches; if it looks like a
   duplicate, link it instead of drafting a new one.

3. **Draft the body.** Write markdown mirroring the form fields - `gh` does
   NOT render the `.yml` form in non-interactive mode, so bake the
   structure into the body. Title: `[Bug]: <area> - <symptom>`. Save it to
   a scratch file for `--body-file`.

4. **Hand off - do not file.** Give the user the exact command to run
   themselves, and suggest labels:
   `gh issue create --title "[Bug]: ..." --body-file <path>
   --label "bug,triage" --type Bug` (add `area:*` / severity labels as
   suggestions; `--type` is needed because non-interactive `gh` bypasses
   the form's auto-assigned issue type).

5. **Offer** to capture it as a failing spec via `/repro-spec`.
