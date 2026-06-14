// High Engagement at Scale - Studion's learning engagement rubric.
// Dimension keys and score ranges mirror the HE@S rating meta input
// (packages/core-extensions/meta-inputs/meta-heas-rating)
import type { ScoringRubric } from '@tailor-cms/interfaces/feedback';

export const HEAS_RUBRIC: ScoringRubric = {
  id: 'HEAS',
  name: 'High Engagement at Scale',
  description: `
    Studion's engagement rubric for digital learning - measures how well
    content keeps learners actively engaged when delivered at scale.`,
  lens: `
    Read the content as a learner who has no instructor in the room.
    Engagement at scale means the content itself must do the work an
    instructor would: orient the learner, involve them, include them,
    connect them, and tie learning to their world. Reward design that
    actively involves the learner; flag long passive stretches.`,
  dimensions: [
    {
      key: 'learnerCenteredContent',
      label: 'Learner-Centered Content',
      icon: 'mdi-account-school',
      maxScore: 4,
      guidance: `
        0-1: No stated objectives or orientation; content is a wall of
        material with no sense of who it is for or why it matters.
        2-3: Objectives or purpose stated for most units; content
        addresses the learner directly and sequences from their
        perspective; some related resources or pointers for going deeper.
        4: Every unit opens with clear, learner-framed objectives,
        content consistently speaks to the learner ("you"), and related
        resources extend the path for curious learners.`,
    },
    {
      key: 'activeLearning',
      label: 'Active Learning',
      icon: 'mdi-gesture-tap',
      maxScore: 3,
      guidance: `
        0: Purely passive - reading or watching with nothing to do.
        1-2: Occasional knowledge checks or interactive elements, but
        long passive stretches remain; interactions test recall only.
        3: Regular, well-placed interactions (questions, activities,
        reflection prompts) that make the learner apply or retrieve
        what they just learned.`,
    },
    {
      key: 'unboundedInclusion',
      label: 'Unbounded Inclusion',
      icon: 'mdi-human-greeting-proximity',
      maxScore: 3,
      guidance: `
        0: Content assumes one kind of learner - single modality, missing
        transcripts or alt text, culturally narrow examples, or unexplained
        jargon that locks out newcomers.
        1-2: Some accommodation - partial transcripts/alt text, occasional
        modality variety - but gaps remain.
        3: Multiple means of representation throughout (text alongside
        media, transcripts and alt text present), plain language with
        terms introduced before use, and examples a diverse audience can
        see themselves in.`,
    },
    {
      key: 'communityConnections',
      label: 'Community Connections',
      icon: 'mdi-account-group',
      maxScore: 2,
      guidance: `
        0: Learning is framed as a solo activity; no prompts to discuss,
        share, or relate the material to others.
        1: Occasional nods to peers or practice communities.
        2: Content deliberately connects learners outward - discussion
        prompts, "share with a colleague" moments, references to the
        professional community or real practitioners.`,
    },
    {
      key: 'realWorldOutcomes',
      label: 'Real-World Outcomes',
      icon: 'mdi-rocket-launch',
      maxScore: 3,
      guidance: `
        0: Abstract material with no bridge to application; the learner
        finishes without knowing what to do differently.
        1-2: Some examples or scenarios ground the material, but key
        takeaways or applications are implicit.
        3: Concrete scenarios and examples throughout, explicit key
        takeaways, and the learner leaves knowing exactly how the
        material applies to their work or life.`,
    },
  ],
};
