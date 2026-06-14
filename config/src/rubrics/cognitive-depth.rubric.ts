// Cognitive depth rubric, informed by Bloom's taxonomy - catches
// content where everything targets remember/understand and nothing
// asks the learner to apply, analyze, or create.
import type { ScoringRubric } from '@tailor-cms/interfaces/feedback';

export const COGNITIVE_DEPTH_RUBRIC: ScoringRubric = {
  id: 'COGNITIVE_DEPTH',
  name: 'Cognitive Depth',
  description: `
    Bloom's-taxonomy review - whether the content pushes learners
    beyond recall into application, analysis, and creation.`,
  lens: `
    Classify what the content demands of the learner using Bloom's
    levels: remember, understand, apply, analyze, evaluate, create.
    Look at the verbs in objectives, the depth of explanations, and
    what the practice actually asks learners to do. Content can be
    perfectly structured and still uniformly shallow - that is
    exactly what this rubric exists to catch.`,
  dimensions: [
    {
      key: 'objectiveDepth',
      label: 'Objective Depth',
      icon: 'mdi-stairs-up',
      maxScore: 4,
      guidance: `
        0-1: Objectives absent or all at remember/understand level
        ("list", "define", "describe").
        2-3: A mix of levels, with at least some apply-level verbs
        ("use", "demonstrate", "solve").
        4: Objectives deliberately climb the taxonomy - application
        and analysis verbs dominate, matched to the content's intent.`,
    },
    {
      key: 'explanationDepth',
      label: 'Explanation Depth',
      icon: 'mdi-head-cog-outline',
      maxScore: 4,
      guidance: `
        0-1: Definitions and facts only; the "why" and "how" are never
        explained.
        2-3: Mechanisms and reasoning explained for the main concepts;
        some areas remain surface-level.
        4: Concepts are explained causally (why it works, when it
        fails), with worked examples that expose the reasoning, not
        just the result.`,
    },
    {
      key: 'practiceDepth',
      label: 'Practice Depth',
      icon: 'mdi-dumbbell',
      maxScore: 4,
      guidance: `
        0-1: No practice, or questions answerable by matching words
        back to the text (pure recall).
        2-3: Practice requires understanding in the learner's own
        terms; occasional application items.
        4: Practice puts learners in scenarios where they apply,
        analyze, or evaluate - recall alone cannot answer them.`,
    },
    {
      key: 'transfer',
      label: 'Transfer',
      icon: 'mdi-shuffle-variant',
      maxScore: 4,
      guidance: `
        0-1: Concepts appear only in the single context they were
        taught in.
        2-3: A second context or variation appears for key concepts.
        4: Content deliberately varies contexts and prompts learners
        to carry concepts into novel situations ("how would this
        change if...", "apply this to your own...").`,
    },
  ],
};
