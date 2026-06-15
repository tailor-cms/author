import * as schemas from '../schemas/index.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { mapRubricError } from './helpers.ts';
import { oneLine } from 'common-tags';
import { reviewService } from '../review.service.ts';

async function handler({
  query,
  req,
}: Ctx<{
  params: typeof schemas.ReviewItemParams;
  query: typeof schemas.ReviewFilter;
}>) {
  try {
    // Awaited inside the try so service domain errors
    // reject here and reach the catch for HTTP mapping.
    const status = await reviewService.getStatus(
      req.repository!,
      req.activity!,
      query.rubricId,
    );
    return status;
  } catch (err) {
    return mapRubricError(err);
  }
}

export default defineAction({
  name: 'getReview',
  params: schemas.ReviewItemParams,
  query: schemas.ReviewFilter,
  openapi: {
    authenticated: true,
    summary: 'Get cached review for an activity',
    description: oneLine`
      Returns the cached review for an (activity, scoring rubric)
      pair, including staleness and in-flight run state.
    `,
    responses: {
      200: {
        description: oneLine`
          Cached review state - status, staleness flag, last result,
          and recent score trend.
        `,
        schema: dataEnvelope(schemas.FeedbackStatus),
      },
    },
  },
  handler,
});
