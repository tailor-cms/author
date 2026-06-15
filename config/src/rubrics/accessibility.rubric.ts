// Accessibility and inclusion rubric, informed by UDL and WCAG
// principles as they apply to authored content.
import type { ScoringRubric } from '@tailor-cms/interfaces/feedback';

export const ACCESSIBILITY_RUBRIC: ScoringRubric = {
  id: 'ACCESSIBILITY',
  name: 'Accessibility & Inclusion',
  description: `
    Inclusion review - whether every learner, regardless of ability or
    background, can perceive and use the content.`,
  lens: `
    Read the content on behalf of learners the author may not have
    pictured: screen-reader users, non-native speakers, learners on
    slow connections or small screens, and people whose lives look
    nothing like the examples. Judge the authored content only - the
    platform's own UI is out of scope.`,
  dimensions: [
    {
      key: 'alternatives',
      label: 'Media Alternatives',
      icon: 'mdi-closed-caption-outline',
      maxScore: 4,
      guidance: `
        0-1: Images without alt text or captions, videos without
        transcripts; media-only content with no text fallback.
        2-3: Alternatives exist for most media; some are missing or
        perfunctory ("image.png").
        4: Every image carries meaningful alt text or captions, every
        video a transcript, and no information lives only in media.`,
    },
    {
      key: 'representation',
      label: 'Multiple Representations',
      icon: 'mdi-shape-outline',
      maxScore: 4,
      guidance: `
        0-1: One modality carries everything - all prose or all video.
        2-3: Key concepts get a second representation now and then.
        4: Important ideas are expressed at least two ways - text plus
        diagram, example plus definition - so learners can take the
        path that works for them.`,
    },
    {
      key: 'language',
      label: 'Inclusive Language',
      icon: 'mdi-hand-heart-outline',
      maxScore: 4,
      guidance: `
        0-1: Idioms and cultural references that exclude outsiders,
        gendered defaults, or examples drawn from one narrow context.
        2-3: Mostly neutral, accessible language with occasional
        slips.
        4: Plain language a non-native speaker can follow, idiom-free
        or idiom-explained, with examples spanning varied people and
        contexts.`,
    },
    {
      key: 'structure',
      label: 'Navigable Structure',
      icon: 'mdi-sitemap-outline',
      maxScore: 4,
      guidance: `
        0-1: No heading hierarchy; meaning encoded in visual styling
        alone (color, bold) that assistive tech cannot convey.
        2-3: Headings and lists used, with occasional skipped levels
        or styling-as-meaning.
        4: Clean heading hierarchy, real lists and tables, descriptive
        link text - content a screen reader can walk as comfortably as
        the eye can scan.`,
    },
  ],
};
