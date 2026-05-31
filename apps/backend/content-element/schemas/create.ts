// Wire shape for creating a content element under a repository.
import { z } from 'zod';

import { ContentElement } from './entity.ts';

export const CreateInput = z
  .object({
    uid: ContentElement.shape.uid.optional(),
    activityId: ContentElement.shape.activityId,
    type: ContentElement.shape.type,
    data: ContentElement.shape.data.optional(),
    meta: ContentElement.shape.meta.optional(),
    position: ContentElement.shape.position,
    refs: ContentElement.shape.refs.optional(),
    // Linked-content fields. Populated when this element is created as a
    // linked copy of a source element; left at defaults otherwise.
    isLinkedCopy: ContentElement.shape.isLinkedCopy.optional(),
    sourceId: ContentElement.shape.sourceId,
    sourceModifiedAt: ContentElement.shape.sourceModifiedAt,
    contentId: ContentElement.shape.contentId.optional(),
  })
  .describe('Create content-element payload.');

export type CreateInput = z.infer<typeof CreateInput>;
