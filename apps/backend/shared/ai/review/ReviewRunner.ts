// Bounded loop for AI review feature. A constrained sibling of the
// agent loop (AgentRunner): no session, read-only tools, and a single
// terminal tool (submit_review) whose validated payload IS the result.
import { ai as aiConfig } from '#config';
import { oneLine } from 'common-tags';
import OpenAI from 'openai';

import {
  buildSubmitReviewTool,
  buildSubmitReviewValidator,
  SUBMIT_TOOL,
  type SubmittedReview,
} from './tools/submit-review.ts';
import { TOOL_DEFS, type ToolContext } from '../agent/tools/index.ts';
import { buildReviewPrompt } from './reviewPrompt.ts';
import { createAiLogger } from '../logger.ts';
import type { FeedbackResult } from './schemas/index.ts';
import type { ScoringRubric } from '@tailor-cms/interfaces/feedback';

const logger = createAiLogger('review.runner');

const openaiClient = aiConfig.isEnabled
  ? new OpenAI({ apiKey: aiConfig.secretKey })
  : null;

// Generous enough for validation retries.
const MAX_TURNS = 16;

// Read-scope agent tools the reviewer may use to inspect content.
// Deliberately excludes get_outline_context (triggers AI summary
// generation - too heavy for a review pass) and every write tool.
const READ_TOOL_NAMES = [
  'get_schema_info',
  'get_outline',
  'get_activity',
  'get_activity_subtree',
  'get_element',
];

type ApiItem = Record<string, any>;

type FunctionCall = {
  type: 'function_call';
  call_id: string;
  name: string;
  arguments?: string;
};

export interface ReviewRunInput {
  // Sequelize Repository instance; the ACL boundary for tool reads
  repository: any;
  // Activity row being reviewed (ownership already verified upstream)
  activity: any;
  rubric: ScoringRubric;
  // Content signature the review is computed against
  freshnessKey: string;
  userId: number;
}

export class ReviewRunner {
  async run(input: ReviewRunInput): Promise<FeedbackResult> {
    if (!openaiClient) {
      throw new Error(
        'AI is not configured (AI_SECRET_KEY or AI_MODEL_ID missing).',
      );
    }
    const { repository, activity, rubric } = input;
    const systemPrompt = buildReviewPrompt({
      repository: {
        name: repository.name,
        description: repository.description,
        schemaId: repository.schema,
      },
      activity: { id: activity.id, name: activity.data?.name ?? '' },
      rubric,
    });
    const tools = buildReviewTools(rubric);
    const validate = buildSubmitReviewValidator(rubric);
    const ctx: ToolContext = {
      userId: input.userId,
      repository,
      transactionLog: [],
    };
    const history: ApiItem[] = [
      {
        role: 'user',
        content: oneLine`
          Review activity #${activity.id} ("${activity.data?.name ?? ''}")
          against the ${rubric.name} scoring rubric, then submit the review.
        `,
      },
    ];

    let review: SubmittedReview | null = null;
    for (let turn = 1; turn <= MAX_TURNS && !review; turn++) {
      logger.debug({ turn, activityId: activity.id }, 'review loop iteration');
      const output = await this.callModel(systemPrompt, history, tools);
      history.push(...output);
      const calls = output.filter(isFunctionCall);
      if (!calls.length) {
        // The model stopped without submitting - nudge it back to the
        // terminal tool instead of accepting prose as a result.
        history.push({
          role: 'user',
          content: `Call ${SUBMIT_TOOL} with the complete review to finish.`,
        });
        continue;
      }
      for (const call of calls) {
        if (call.name === SUBMIT_TOOL) {
          const submission = parseSubmission(call, validate);
          if ('review' in submission) {
            review = submission.review;
            history.push(toolResult(call.call_id, { ok: true }));
          } else {
            logger.info(
              { activityId: activity.id, error: submission.error },
              'invalid review submission, bouncing back',
            );
            history.push(toolResult(call.call_id, submission));
          }
          continue;
        }
        history.push(await this.dispatchReadTool(call, ctx));
      }
    }

    if (!review) {
      throw new Error(`Review did not complete within ${MAX_TURNS} turns.`);
    }
    return assembleResult(review, input);
  }

  private async callModel(
    systemPrompt: string,
    history: ApiItem[],
    tools: any[],
  ): Promise<ApiItem[]> {
    const response = await openaiClient!.responses.create({
      model: aiConfig.modelId!,
      input: [
        { role: 'developer', content: systemPrompt },
        ...history,
      ] as any,
      tools,
    });
    return response.output || [];
  }

  private async dispatchReadTool(
    call: FunctionCall,
    ctx: ToolContext,
  ): Promise<ApiItem> {
    const tool = TOOL_DEFS.find(
      (t) => t.name === call.name && READ_TOOL_NAMES.includes(t.name),
    );
    if (!tool) {
      return toolResult(call.call_id, {
        error: 'unknown_tool',
        message: `No tool named "${call.name}" in the review toolset.`,
      });
    }
    const input = parseArgs(call);
    if ('error' in input) return toolResult(call.call_id, input);
    logger.info({ tool: call.name, input: input.value }, '> review tool call');
    try {
      const result = await tool.execute(input.value, ctx);
      return toolResult(call.call_id, result);
    } catch (err: any) {
      logger.error({ err, tool: call.name }, 'review tool threw');
      return toolResult(call.call_id, {
        error: 'tool_threw',
        message: err.message,
      });
    }
  }
}

function buildReviewTools(rubric: ScoringRubric) {
  const reads = TOOL_DEFS.filter((t) => READ_TOOL_NAMES.includes(t.name)).map(
    (t) => ({
      type: 'function' as const,
      name: t.name,
      description: t.description,
      parameters: t.parameters,
      strict: false,
    }),
  );
  return [...reads, buildSubmitReviewTool(rubric)];
}

type ParsedArgs = { value: any } | { error: string; message: string };

function parseArgs(call: FunctionCall): ParsedArgs {
  if (!call.arguments) return { value: {} };
  try {
    return { value: JSON.parse(call.arguments) };
  } catch (err: any) {
    return { error: 'invalid_json', message: err.message };
  }
}

type ParsedSubmission =
  | { review: SubmittedReview }
  | { error: string; message: string };

function parseSubmission(
  call: FunctionCall,
  validate: ReturnType<typeof buildSubmitReviewValidator>,
): ParsedSubmission {
  const args = parseArgs(call);
  if ('error' in args) return args;
  const parsed = validate.safeParse(args.value);
  if (!parsed.success) {
    return {
      error: 'invalid_review',
      message: parsed.error.issues
        .map((it) => `${it.path.join('.')}: ${it.message}`)
        .join('; '),
    };
  }
  return { review: parsed.data };
}

/**
 * Project the validated submission onto the wire result: dimensions in
 * rubric order with their maximums attached, overall as the sum of
 * both.
 */
function assembleResult(
  review: SubmittedReview,
  input: ReviewRunInput,
): FeedbackResult {
  const { rubric, activity, freshnessKey } = input;
  const scoreByKey = Object.fromEntries(
    review.dimensions.map((it) => [it.key, it]),
  );
  const dimensions = rubric.dimensions.map((dimension) => {
    const scored = scoreByKey[dimension.key];
    return {
      key: dimension.key,
      score: scored.score,
      maxScore: dimension.maxScore,
      rationale: scored.rationale,
      evidence: scored.evidence,
    };
  });
  const score = dimensions.reduce((acc, it) => acc + it.score, 0);
  const maxScore = dimensions.reduce((acc, it) => acc + it.maxScore, 0);
  return {
    rubricId: rubric.id,
    activityId: activity.id,
    contentSignature: freshnessKey,
    computedAt: Date.now(),
    overall: {
      score,
      maxScore,
      headline: review.headline,
      summary: review.summary,
    },
    dimensions,
    strengths: review.strengths,
    suggestions: review.suggestions,
  };
}

function isFunctionCall(item: ApiItem): item is FunctionCall {
  return item.type === 'function_call';
}

function toolResult(callId: string, result: unknown): ApiItem {
  return {
    type: 'function_call_output',
    call_id: callId,
    output: typeof result === 'string' ? result : JSON.stringify(result),
  };
}

export const reviewRunner = new ReviewRunner();
