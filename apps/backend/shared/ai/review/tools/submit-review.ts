// Terminal tool of the feedback review loop. The reviewer model ends
// its run by calling this tool with the complete structured review;
// the parameter schema and validator are built per scoring rubric so
// dimension keys and score bounds are enforced at the tool boundary
// (invalid submissions bounce back as tool errors the model retries).
import type { ScoringRubric } from '@tailor-cms/interfaces/feedback';
import { oneLine, stripIndent } from 'common-tags';
import { SuggestionImpact } from '../schemas/index.ts';
import { z } from 'zod';

export const SUBMIT_TOOL = 'submit_review';

const description = stripIndent`
  Submit the finished review. Call exactly once, after inspecting the
  content - this ends the review. Score every dimension of the scoring
  rubric per its guidance, back scores with evidence, and write all
  text directly to the author (second person, constructive, specific).
`;

export function buildSubmitReviewTool(rubric: ScoringRubric) {
  return {
    type: 'function' as const,
    name: SUBMIT_TOOL,
    description,
    parameters: buildParameters(rubric),
    strict: false,
  };
}

function buildParameters(rubric: ScoringRubric) {
  const keys = rubric.dimensions.map((it) => it.key);
  const bounds = rubric.dimensions
    .map((it) => `${it.key}: 0-${it.maxScore}`)
    .join(', ');
  return {
    type: 'object',
    properties: {
      headline: {
        type: 'string',
        description: oneLine`
          One-sentence overall verdict naming the single change with
          the biggest impact on the score.
        `,
      },
      summary: {
        type: 'string',
        description: oneLine`
          Short paragraph expanding the headline - overall impression
          plus the one or two themes behind the scores.
        `,
      },
      dimensions: {
        type: 'array',
        minItems: keys.length,
        maxItems: keys.length,
        description: oneLine`
          One entry per rubric dimension, every dimension exactly
          once. Score bounds: ${bounds}.
        `,
        items: {
          type: 'object',
          properties: {
            key: { type: 'string', enum: keys },
            score: {
              type: 'integer',
              minimum: 0,
              description: 'Awarded score, within the dimension bounds.',
            },
            rationale: {
              type: 'string',
              description: 'Why this score, written to the author.',
            },
            evidence: {
              type: 'array',
              items: { type: 'string' },
              description: oneLine`
                Short quotes or concrete observations from the content
                backing the score.
              `,
            },
          },
          required: ['key', 'score', 'rationale'],
          additionalProperties: false,
        },
      },
      strengths: {
        type: 'array',
        description: 'Genuine, evidence-tied things the author did well.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            detail: { type: 'string' },
          },
          required: ['title', 'detail'],
          additionalProperties: false,
        },
      },
      suggestions: {
        type: 'array',
        description: oneLine`
          Concrete, implementable improvements ordered by impact.
        `,
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            detail: {
              type: 'string',
              description: 'What to change and why it lifts the score.',
            },
            impact: { type: 'string', enum: [...SuggestionImpact] },
            dimensionKeys: {
              type: 'array',
              items: { type: 'string', enum: keys },
              description: 'Dimensions this suggestion would improve.',
            },
            targetElementId: {
              type: ['integer', 'null'],
              description: oneLine`
                Content element id the suggestion concerns, only when
                it targets one specific element.
              `,
            },
            agentPrompt: {
              type: 'string',
              description: oneLine`
                Self-contained imperative instruction an AI editing
                agent could execute to apply this suggestion.
              `,
            },
          },
          required: ['title', 'detail', 'impact'],
          additionalProperties: false,
        },
      },
    },
    required: ['headline', 'summary', 'dimensions', 'strengths', 'suggestions'],
    additionalProperties: false,
  };
}

/**
 * Zod validator for a submitted review. Enforces what JSON Schema
 * alone cannot: per-dimension score bounds and exactly-once dimension
 * coverage.
 */
export function buildSubmitReviewValidator(rubric: ScoringRubric) {
  const keys = rubric.dimensions.map((it) => it.key) as [string, ...string[]];
  const maxByKey = Object.fromEntries(
    rubric.dimensions.map((it) => [it.key, it.maxScore]),
  );
  return z
    .object({
      headline: z.string().trim().min(1),
      summary: z.string().trim().min(1),
      dimensions: z.array(
        z.object({
          key: z.enum(keys),
          score: z.number().int().min(0),
          rationale: z.string().trim().min(1),
          evidence: z.array(z.string()).default([]),
        }),
      ),
      strengths: z
        .array(z.object({ title: z.string(), detail: z.string() }))
        .default([]),
      suggestions: z
        .array(
          z.object({
            title: z.string(),
            detail: z.string(),
            impact: z.enum(SuggestionImpact),
            dimensionKeys: z.array(z.enum(keys)).default([]),
            targetElementId: z.number().int().positive().nullable().optional(),
            agentPrompt: z.string().optional(),
          }),
        )
        .default([]),
    })
    .superRefine((review, ctx) => {
      const seen = review.dimensions.map((it) => it.key);
      const missing = keys.filter((key) => !seen.includes(key));
      if (missing.length || seen.length !== keys.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['dimensions'],
          message: oneLine`
            Every dimension must appear exactly once. Expected
            [${keys.join(', ')}], got [${seen.join(', ')}].
          `,
        });
      }
      for (const [index, dimension] of review.dimensions.entries()) {
        const max = maxByKey[dimension.key];
        if (max !== undefined && dimension.score > max) {
          ctx.addIssue({
            code: 'custom',
            path: ['dimensions', index, 'score'],
            message: `Score for "${dimension.key}" must be 0-${max}.`,
          });
        }
      }
    });
}

export type SubmittedReview = z.infer<
  ReturnType<typeof buildSubmitReviewValidator>
>;
