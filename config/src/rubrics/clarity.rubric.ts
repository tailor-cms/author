// Clarity and cognitive load rubric - readability-first review for
// content where comprehension speed matters more than pedagogy
// (knowledge bases, reference material, articles).
import type { ScoringRubric } from '@tailor-cms/interfaces/feedback';

export const CLARITY_RUBRIC: ScoringRubric = {
  id: 'CLARITY',
  name: 'Clarity & Cognitive Load',
  description: `
    Readability review - whether the content transfers its message
    with minimal effort from the reader.`,
  lens: `
    Read the content as a busy reader encountering it for the first
    time. Every extra pass a sentence needs, every unexplained term,
    and every wall of text is friction. Judge how hard the reader has
    to work, not whether the material is correct.`,
  dimensions: [
    {
      key: 'readability',
      label: 'Readability',
      icon: 'mdi-glasses',
      maxScore: 4,
      guidance: `
        0-1: Long winding sentences, passive constructions, abstract
        nouns; paragraphs demand rereading.
        2-3: Mostly direct prose with occasional dense passages.
        4: Short active sentences, one idea per paragraph, concrete
        wording throughout.`,
    },
    {
      key: 'terminology',
      label: 'Terminology & Jargon',
      icon: 'mdi-book-alphabet',
      maxScore: 4,
      guidance: `
        0-1: Specialist terms and acronyms used without introduction;
        the reader needs outside knowledge to follow.
        2-3: Most terms introduced, a few slip through unexplained or
        are used inconsistently.
        4: Every term defined at first use, acronyms expanded,
        vocabulary consistent across the whole activity.`,
    },
    {
      key: 'flow',
      label: 'Chunking & Flow',
      icon: 'mdi-waves',
      maxScore: 4,
      guidance: `
        0-1: Unbroken text blocks; ideas arrive in arbitrary order.
        2-3: Reasonable sectioning with headings; some chunks overlong
        or transitions abrupt.
        4: Scannable structure - headings, lists, and short sections -
        where each chunk sets up the next.`,
    },
    {
      key: 'mediaBalance',
      label: 'Media & Text Balance',
      icon: 'mdi-image-text',
      maxScore: 4,
      guidance: `
        0-1: Text-only walls, or decorative media that adds load
        without adding meaning.
        2-3: Some supporting visuals or media, not always where the
        text needs them most.
        4: Visuals and media placed exactly where words struggle -
        diagrams for structure, examples for abstraction - each one
        carrying real informational weight.`,
    },
  ],
};
