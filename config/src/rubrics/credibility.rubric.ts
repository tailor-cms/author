// Credibility and sourcing rubric; epistemic hygiene for reference
// and analytical content. Deliberately judges evidence PRACTICES
// (attribution, currency markers, precision), never ground truth: an
// LLM reviewer cannot reliably fact-check, but it can reliably see
// whether the content earns trust.
import type { ScoringRubric } from '@tailor-cms/interfaces/feedback';

export const CREDIBILITY_RUBRIC: ScoringRubric = {
  id: 'CREDIBILITY',
  name: 'Credibility & Sourcing',
  description: `
    Evidence-practice review - whether claims are attributed, current,
    precise, and honestly bounded.`,
  lens: `
    Read the content as a careful skeptic. Do NOT fact-check claims
    against your own knowledge - judge whether the content practices
    good evidence hygiene: are claims attributed, is time-sensitive
    information dated, are numbers consistent with each other, are
    limitations acknowledged? A wrong-but-sourced claim scores higher
    here than a right-but-bare assertion; truth is the author's
    responsibility, trustworthiness signals are this rubric's.`,
  dimensions: [
    {
      key: 'attribution',
      label: 'Attribution & Evidence',
      icon: 'mdi-format-quote-close',
      maxScore: 4,
      guidance: `
        0-1: Strong factual claims, statistics, or quotes presented
        bare, with no source, attribution, or evidence.
        2-3: Major claims attributed; smaller assertions float free.
        4: Every load-bearing claim points at its source or evidence;
        opinions are framed as opinions.`,
    },
    {
      key: 'currency',
      label: 'Currency',
      icon: 'mdi-update',
      maxScore: 4,
      guidance: `
        0-1: Time-sensitive material (versions, prices, regulations,
        statistics) presented as timeless; no dates anywhere.
        2-3: Key time-sensitive facts dated or versioned; some
        undated perishables remain.
        4: Perishable information consistently carries "as of" markers
        or versions, and the content distinguishes durable principles
        from snapshot facts.`,
    },
    {
      key: 'precision',
      label: 'Precision & Consistency',
      icon: 'mdi-numeric',
      maxScore: 4,
      guidance: `
        0-1: Numbers contradict each other across sections, vague
        quantifiers stand in for figures ("most", "huge"), or
        unwarranted absolutes ("always", "never") abound.
        2-3: Mostly precise with isolated vagueness or one
        inconsistency.
        4: Figures are exact, internally consistent, and hedged
        exactly as much as the evidence warrants - no more, no less.`,
    },
    {
      key: 'balance',
      label: 'Balance & Limitations',
      icon: 'mdi-scale-balance',
      maxScore: 4,
      guidance: `
        0-1: One-sided advocacy; trade-offs, exceptions, and
        counterarguments never appear.
        2-3: Some limitations acknowledged, but the strongest
        counterpoints are missing.
        4: Trade-offs and limitations are addressed head-on; the
        reader leaves knowing when the advice does NOT apply.`,
    },
  ],
};
