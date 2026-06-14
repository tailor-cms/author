// Publish readiness rubric; operational pre-publish QA. Evidence is
// concrete (empty containers, unset meta, placeholder text), making
// this the lowest-hallucination-risk lens; it complements the
// pedagogical rubrics with a "is this actually finished?" pass.
import type { ScoringRubric } from '@tailor-cms/interfaces/feedback';

export const READINESS_RUBRIC: ScoringRubric = {
  id: 'READINESS',
  name: 'Publish Readiness',
  description: `
    Pre-publish review; whether the content is complete, polished,
    and ready to ship to learners.`,
  lens: `
    Read the content as a meticulous editor doing the final pass
    before publication. Hunt for anything unfinished: empty or stub
    sections, unset metadata (the content tree lists missingMeta per
    node), placeholder text, drafts that end mid-thought. Judge
    doneness, not quality of ideas - other rubrics cover those.`,
  dimensions: [
    {
      key: 'structure',
      label: 'Structural Completeness',
      icon: 'mdi-package-variant-closed',
      maxScore: 4,
      guidance: `
        0-1: Empty containers or stub subcontainers with no elements;
        sections promised by the structure but never filled.
        2-3: Structure is filled with occasional thin spots - a
        section with a single token element, or visibly unbalanced
        coverage.
        4: Every container carries real content proportional to its
        role; nothing is an empty shell.`,
    },
    {
      key: 'metadata',
      label: 'Metadata Completeness',
      icon: 'mdi-form-textbox',
      maxScore: 4,
      guidance: `
        0-1: Most schema-defined meta fields are unset (check
        missingMeta on the content tree) - objectives, descriptions,
        takeaways missing where the schema expects them.
        2-3: Key meta present with some gaps on secondary fields.
        4: Every schema-defined meta field that authors are expected
        to fill is filled with real values, not filler.`,
    },
    {
      key: 'polish',
      label: 'Polish',
      icon: 'mdi-broom',
      maxScore: 4,
      guidance: `
        0-1: Placeholder text (TODO, lorem ipsum, "add later", draft
        notes), broken-looking references, or untitled elements left
        in the content.
        2-3: Clean overall with a few rough spots - an unfinished
        sentence, an inconsistent heading, leftover author notes.
        4: No placeholders, no author debris; everything reads as
        intentionally published.`,
    },
    {
      key: 'framing',
      label: 'Opening & Closure',
      icon: 'mdi-book-open-page-variant-outline',
      maxScore: 4,
      guidance: `
        0-1: Content starts mid-topic with no orientation and stops
        abruptly with no wrap-up.
        2-3: Has an opening or a closing, but not both, or they are
        perfunctory one-liners.
        4: Opens by orienting the reader (what this is, why it
        matters) and closes deliberately (summary, takeaways, or next
        steps).`,
    },
  ],
};
