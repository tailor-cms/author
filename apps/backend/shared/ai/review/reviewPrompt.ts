// Developer-role preamble for the feedback review loop. Composes the
// reviewer role, repository grounding, the scoring rubric (lens +
// per-dimension guidance), and the feedback voice the sidebar relies on.
import { stripIndent } from 'common-tags';
import type { ScoringRubric } from '@tailor-cms/interfaces/feedback';

import { SUBMIT_TOOL } from './tools/submit-review.ts';

interface ReviewPromptContext {
  repository: { name: string; description?: string; schemaId: string };
  activity: { id: number; name: string };
  rubric: ScoringRubric;
}

export function buildReviewPrompt(context: ReviewPromptContext): string {
  const { repository, activity, rubric } = context;
  return [
    role(),
    repositorySection(repository),
    rubricSection(rubric),
    processSection(activity),
    voiceSection(),
  ].join('\n\n');
}

function role(): string {
  return stripIndent`
    You are an expert content reviewer embedded in Tailor, an authoring
    platform for structured content. Authors see your review in a
    feedback sidebar next to the editor: per-dimension scores on a
    radar chart, strengths, and actionable suggestions. Your single
    goal is to help the author make this content better.
  `;
}

function repositorySection(
  repository: ReviewPromptContext['repository'],
): string {
  return stripIndent`
    ## Repository

    Name: ${repository.name}
    Schema: ${repository.schemaId}
    ${repository.description ? `Description: ${repository.description}` : ''}
  `.trim();
}

function rubricSection(rubric: ScoringRubric): string {
  const dimensions = rubric.dimensions
    .map(
      (it) => stripIndent`
        ### ${it.label} (key: ${it.key}, score 0-${it.maxScore})

        ${it.guidance}
      `,
    )
    .join('\n\n');
  return stripIndent`
    ## Scoring rubric: ${rubric.name}

    ${rubric.description}

    ${rubric.lens}

    ## Dimensions

    ${dimensions}
  `;
}

function processSection(activity: ReviewPromptContext['activity']): string {
  return stripIndent`
    ## Process

    You are reviewing outline activity #${activity.id} ("${activity.name}").

    1. Call get_activity_subtree(${activity.id}) to read the full
       authored content - containers, subcontainers, and elements.
    2. Call get_schema_info if you need the meta field vocabulary, and
       get_outline if surrounding-structure context would change a
       score (e.g. whether objectives live on a parent).
    3. Evaluate the content against each dimension's guidance. Anchor
       every score in concrete evidence from the content.
    4. Call ${SUBMIT_TOOL} exactly once with the complete review. Do
       not narrate the review as plain text - the submission is the
       deliverable.
  `;
}

function voiceSection(): string {
  return stripIndent`
    ## Feedback voice

    - Address the author directly ("you"), never "the author".
    - Score honestly against the guidance; an inflated score helps no
      one. Missing content scores low - say what is missing.
    - The headline names the single highest-impact improvement.
    - Strengths are genuine and tied to evidence, never filler praise.
    - Suggestions are concrete and implementable as written; impact
      reflects the expected score lift. Set targetElementId only when
      a suggestion concerns one specific element. Write agentPrompt as
      a self-contained instruction that works without this review as
      context.
    - Keep rationale and details tight - two or three sentences each.
  `;
}
