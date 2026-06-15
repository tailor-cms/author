import * as schemas from '../schemas/index.ts';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { mapRubricError } from './helpers.ts';
import { reviewService } from '../review.service.ts';

async function handler({
  body,
  user,
  req,
}: Ctx<{
  params: typeof schemas.ReviewItemParams;
  body: typeof schemas.RequestInput;
}>) {
  try {
    // Awaited so service domain errors reject here and
    // reach the catch for HTTP mapping.
    const status = await reviewService.requestAnalysis(
      req.repository!,
      req.activity!,
      user.id,
      body.rubricId,
      body.force ?? false,
    );
    return status;
  } catch (err) {
    return mapRubricError(err);
  }
}

export default defineAction({
  name: 'requestReview',
  params: schemas.ReviewItemParams,
  body: schemas.RequestInput,
  openapi: {
    authenticated: true,
    summary: 'Request a review analysis',
    description: oneLine`
      Triggers a background review unless one is already running or
      the cached result matches the current content signature - safe
      to call from deferred triggers (idle-after-save, page-leave)
      without re-running on unchanged content. Returns the immediate
      status; poll the GET endpoint for completion.
    `,
    responses: {
      200: {
        description: oneLine`
          Immediate review state, typically \`running\` when a new
          analysis was started.
        `,
        schema: dataEnvelope(schemas.FeedbackStatus),
      },
    },
  },
  handler,
});
