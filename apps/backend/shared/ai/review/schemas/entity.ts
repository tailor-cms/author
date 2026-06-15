// Shared wire entities for the review slice.
import {
  Int,
  IntParam,
  RepositoryScopedParams,
  UInt,
} from '#shared/request/schemas.ts';
import type * as interfaces from '@tailor-cms/interfaces/feedback';
import { feedback } from '@tailor-cms/config';
import { oneLine } from 'common-tags';
import { z } from 'zod';

export const SuggestionImpact = ['high', 'medium', 'low'] as const;

// Registered rubric ids
const RUBRIC_IDS = feedback.rubrics.map((it) => it.id) as [string, ...string[]];

export const RubricId = () =>
  z.enum(RUBRIC_IDS).describe(oneLine`
    Scoring rubric; defaults to the schema default. Must also be
    enabled by the repository's schema.
  `);

// The `getActivity` param middleware validates and loads `:activityId`
// at runtime; the schema exists so the OpenAPI doc shows the full
// path-param chain.
export const ReviewItemParams = RepositoryScopedParams.extend({
  activityId: IntParam().describe('Outline activity the review targets.'),
});

const DimensionScore = z
  .object({
    key: z.string().describe('Dimension key from the scoring rubric.'),
    score: UInt().describe('Awarded score.'),
    maxScore: UInt().describe('Upper bound from the rubric definition.'),
    rationale: z.string().describe('Why this score, written to the author.'),
    evidence: z
      .array(z.string())
      .describe('Short quotes or observations backing the score.'),
  })
  .meta({ id: 'FeedbackDimensionScore' });

const Strength = z
  .object({
    title: z.string().describe('What the author did well, in one line.'),
    detail: z.string().describe('Evidence-backed elaboration.'),
  })
  .meta({ id: 'FeedbackStrength' });

const Suggestion = z
  .object({
    title: z.string().describe('Actionable improvement, in one line.'),
    detail: z.string().describe('What to change and why it lifts the score.'),
    impact: z
      .enum(SuggestionImpact)
      .describe('Expected score impact if applied.'),
    dimensionKeys: z
      .array(z.string())
      .describe('Dimensions this suggestion would improve.'),
    targetElementId: Int().nullable().optional().describe(oneLine`
      Content element the suggestion concerns, when it targets one
      specific element; lets the editor scroll to it.
    `),
    agentPrompt: z.string().optional().describe(oneLine`
      Self-contained instruction the author can hand to the authoring
      agent to apply this suggestion.
    `),
  })
  .meta({ id: 'FeedbackSuggestion' });

export const FeedbackResult = z
  .object({
    rubricId: z.string().describe('Scoring rubric that produced the review.'),
    activityId: Int().describe('Reviewed outline activity.'),
    overall: z.object({
      score: UInt().describe('Sum of dimension scores.'),
      maxScore: UInt().describe('Sum of dimension maximums.'),
      headline: z.string().describe(oneLine`
        One-sentence verdict naming the highest-impact improvement.
      `),
      summary: z.string().describe('Short paragraph expanding the headline.'),
    }),
    dimensions: z.array(DimensionScore),
    strengths: z.array(Strength),
    suggestions: z.array(Suggestion),
    contentSignature: z.string().describe(oneLine`
      Content freshness key (activity \`modifiedAt\`) the review was
      computed against; compared against the live value to detect
      staleness.
    `),
    computedAt: UInt().describe('Unix ms when the review completed.'),
  })
  .meta({ id: 'FeedbackResult' })
  .describe('A complete review of one activity against one rubric.');

export const TrendPoint = z
  .object({
    score: UInt().describe('Overall score at that point.'),
    maxScore: UInt().describe('Overall maximum at that point.'),
    dimensions: z
      .record(z.string(), UInt())
      .describe('Per-dimension scores keyed by dimension key.'),
    computedAt: UInt().describe('Unix ms when the snapshot was taken.'),
  })
  .meta({ id: 'FeedbackTrendPoint' });

export const FeedbackStatus = z
  .object({
    result: FeedbackResult.nullable(),
    status: z.enum(['empty', 'running', 'ready', 'failed']).describe(oneLine`
      \`empty\` = never analyzed, \`running\` = analysis in flight,
      \`ready\` = result available, \`failed\` = last attempt errored
      (a previous result may still be present).
    `),
    isStale: z.boolean().describe(oneLine`
      True when the content changed since the result was computed.
    `),
    trend: z
      .array(TrendPoint)
      .describe('Recent score snapshots, oldest first, current included.'),
    error: z.string().nullable().describe('Failure message, when failed.'),
  })
  .meta({ id: 'FeedbackStatus' })
  .describe('Cached review state for one (activity, rubric) pair.');

// The exported TYPES are the shared interfaces, so the whole backend
// and frontend speak one definition; the Zod consts above are their
// runtime counterparts - keep both in sync when the wire shape
// changes (the Zod side feeds the OpenAPI doc and generated client).
export type FeedbackResult = interfaces.FeedbackResult;
export type FeedbackStatus = interfaces.FeedbackStatus;
export type TrendPoint = interfaces.FeedbackTrendPoint;
