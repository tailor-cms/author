// Psychometric item-writing review, drawn
// from classic item-writing flaw catalogs (implausible distractors,
// cue leakage, negative stems, feedback that marks instead of
// teaches). Intended for assessment-bearing schemas; narrow it out of
// schemas without question elements.
import type { ScoringRubric } from '@tailor-cms/interfaces/feedback';

export const ASSESSMENT_CRAFT_RUBRIC: ScoringRubric = {
  id: 'ASSESSMENT_CRAFT',
  name: 'Assessment Craft',
  description: `
    Item-writing review - whether questions measure understanding
    cleanly, with plausible distractors and feedback that teaches.`,
  lens: `
    Review every assessment item as a psychometrician. Hunt the
    classic item-writing flaws: stems that cannot be understood
    without reading the options, double negatives, distractors that
    are obviously wrong or grammatically mismatched with the stem,
    cue leakage (the longest or most detailed option is correct,
    "all/none of the above"), and feedback that says "incorrect"
    without teaching why. If the content contains no assessment items
    at all, score every dimension 0 and make adding assessment the
    headline.`,
  dimensions: [
    {
      key: 'stemQuality',
      label: 'Stem Quality',
      icon: 'mdi-comment-question-outline',
      maxScore: 4,
      guidance: `
        0-1: Stems are ambiguous, contain double negatives, or only
        make sense after reading the options.
        2-3: Stems are mostly clear and self-contained; a few lean on
        the options or carry surplus wording.
        4: Every stem poses one clear, answerable question on its own,
        in the simplest language the content allows.`,
    },
    {
      key: 'distractors',
      label: 'Distractor Plausibility',
      icon: 'mdi-call-split',
      maxScore: 4,
      guidance: `
        0-1: Distractors are obviously wrong, jokey, or grammatically
        inconsistent with the stem; the correct answer is the longest
        or most detailed option; "all/none of the above" appears.
        2-3: Distractors are mostly plausible; occasional cue leakage
        or a throwaway option.
        4: Every distractor reflects a real misconception a learner
        might hold, options are homogeneous in length and grammar, and
        nothing cues the answer.`,
    },
    {
      key: 'feedbackQuality',
      label: 'Feedback Quality',
      icon: 'mdi-message-reply-text-outline',
      maxScore: 4,
      guidance: `
        0-1: No feedback, or bare "correct/incorrect" marking.
        2-3: Feedback explains the correct answer; wrong-answer
        feedback is generic.
        4: Feedback teaches - it explains why the right answer is
        right AND why each tempting distractor is wrong, turning every
        miss into a lesson.`,
    },
    {
      key: 'coverage',
      label: 'Coverage & Variety',
      icon: 'mdi-view-grid-outline',
      maxScore: 4,
      guidance: `
        0-1: Items cluster on one narrow slice of the content, or one
        question type repeats throughout.
        2-3: Items span most of the key concepts with some variety in
        type or difficulty.
        4: Items deliberately sample all key concepts, mix question
        types, and range from comprehension checks to application
        scenarios.`,
    },
  ],
};
