// Learning design quality rubric, informed by the Quality Matters
// rubric family: alignment, structure, clarity, assessment, support.
import type { ScoringRubric } from '@tailor-cms/interfaces/feedback';

export const LEARNING_DESIGN_RUBRIC: ScoringRubric = {
  id: 'LEARNING_DESIGN',
  name: 'Learning Design Quality',
  description: `
    Instructional-design review of structure and pedagogy - whether
    objectives, content, and assessment line up into a coherent
    learning experience.`,
  lens: `
    Read the content as an instructional designer doing a course
    quality review. Trace the through-line: what is the learner meant
    to achieve, does the material actually build toward it, and would
    the assessments prove it was achieved? Judge the design, not the
    subject matter - assume the author is the content expert.`,
  dimensions: [
    {
      key: 'alignment',
      label: 'Objective Alignment',
      icon: 'mdi-target',
      maxScore: 4,
      guidance: `
        0-1: No discernible objectives, or content and assessments
        drift away from what was promised.
        2-3: Objectives exist and most content supports them; minor
        orphan content or untested objectives.
        4: Clear objectives, every section traceably serves one, and
        assessments measure exactly what the objectives promise.`,
    },
    {
      key: 'structure',
      label: 'Structure & Chunking',
      icon: 'mdi-format-list-group',
      maxScore: 4,
      guidance: `
        0-1: Monolithic blocks or erratic ordering; no visible
        progression.
        2-3: Mostly logical sequence with reasonable chunk sizes;
        occasional overlong sections or abrupt jumps.
        4: Consistent, digestible chunks in a deliberate progression -
        simple to complex, known to unknown - with clear transitions.`,
    },
    {
      key: 'clarity',
      label: 'Instructional Clarity',
      icon: 'mdi-lightbulb-on-outline',
      maxScore: 4,
      guidance: `
        0-1: Dense prose, undefined terms, no examples; the learner is
        left to decode the material alone.
        2-3: Generally clear explanations with some examples; a few
        passages assume too much or explain too little.
        4: Concepts introduced before use, consistently illustrated
        with examples or analogies, written at a level matched to the
        audience.`,
    },
    {
      key: 'assessment',
      label: 'Assessment Quality',
      icon: 'mdi-clipboard-check-outline',
      maxScore: 4,
      guidance: `
        0-1: No assessment, or trivial questions answerable without
        the content.
        2-3: Assessments cover the main points but lean on recall;
        distractors or feedback could work harder.
        4: Varied question types targeting understanding and
        application, plausible distractors, and feedback that teaches
        rather than just marks.`,
    },
    {
      key: 'support',
      label: 'Learner Support',
      icon: 'mdi-lifebuoy',
      maxScore: 4,
      guidance: `
        0-1: Learner is dropped into content with no orientation,
        summaries, or pointers for help.
        2-3: Some orientation and wrap-up; support materials present
        but inconsistent.
        4: Each unit orients the learner up front, closes with a
        summary or takeaways, and offers resources for going deeper or
        getting unstuck.`,
    },
  ],
};
