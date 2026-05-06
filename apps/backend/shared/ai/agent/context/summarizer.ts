// Summary generation for the agent's outline context.
// Produces per-activity leaf summaries from raw content elements
import OpenAI from 'openai';
import { stripIndent } from 'common-tags';
import { ai as aiConfig } from '#config';
import { createAiLogger } from '../../logger.ts';

const logger = createAiLogger('agent.context.summarizer');

let openaiClient: OpenAI | null = null;
function getClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: aiConfig.secretKey });
  }
  return openaiClient;
}

/**
 * AI-based summary. Concise, factual, framing.
 * Bounded output keeps the result under ~150 tokens.
 *
 * Returns null on transient failure (AI call threw, empty input).
 * Callers should treat null as "no summary available" - do NOT
 * cache the absence; the next attempt should retry.
 *
 * @param content - Raw content to summarize.
 * @param hint - Optional context hint prepended as
 *   "Context: {hint}" (e.g. the activity name).
 *
 * @example
 * const summary = await aiSummary(rawContent, 'JavaScript Variables');
 * if (!summary) return null; // skip; don't cache
 */
export async function aiSummary(
  content: string,
  hint?: string,
): Promise<string | null> {
  if (!content.trim()) return null;
  const system = stripIndent`
    You summarize instructional material into a concise
    factual paragraph capturing the key concepts covered.
    Rules:
    - Bare facts. No phrases like "this section" or "this lesson".
    - No restatement of the prompt. No preamble. Just the summary.
    - Name specific concepts, skills, and topics covered.
    - Ignore administrative metadata (workflow status, priority, due
      dates, ownership, timestamps, linked-copy provenance,
      identifiers). Summarize content only.
    - 3-6 sentences, up to 150 words.
  `;
  const user = hint ? `Context: ${hint}\n\n---\n${content}` : content;
  try {
    const response = await getClient().responses.create({
      model: (aiConfig as any).modelId,
      input: [
        { role: 'developer', content: system },
        { role: 'user', content: user },
      ],
      max_output_tokens: 400,
    } as any);
    const text = (response as any).output_text?.trim?.() || '';
    return text || null;
  } catch (error: any) {
    logger.warn(
      { err: error.message, len: content.length },
      'aiSummary failed - caller will skip the summary slot',
    );
    return null;
  }
}
