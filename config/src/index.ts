import { getWorkflowApi, processSchemas } from '@tailor-cms/config-parser';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';

import { createRegistry } from './lib/registry';
import { getFeedbackApi, RUBRICS, validateRubricRefs } from './rubrics';
import { SCHEMA as CourseSchema } from './schemas/course.schema';
import { DEFAULT_WORKFLOW as DefaultWorkflow } from './workflows/default.workflow';
import { exampleCollection } from './collections/example.collection';
import { SCHEMA as FeedSchema } from './schemas/feed.schema';
import { SCHEMA as KnowledgeBase } from './schemas/knowledge-base.schema';
import { SCHEMA as QASchema } from './schemas/q&a.schema';
import { SCHEMA as HeasSchema } from './schemas/heas.schema';
import { SCHEMA as TestSchema } from './schemas/test.schema';
import { SCHEMA as PartnerTrainingSchema } from './schemas/partner-training.schema';
import { SCHEMA as ContentLibrarySchema } from './schemas/content-library.schema';
import { SCHEMA as VideoCourseSchema } from './schemas/video-course.schema';
import { SCHEMA as PartnerTrainingV2Schema } from './schemas/partner-training-v2.schema';

export type { Snapshot } from './lib/registry';
export { processElementConfig } from '@tailor-cms/config-parser';

export const SCHEMAS = processSchemas([
  CourseSchema,
  HeasSchema,
  PartnerTrainingSchema,
  PartnerTrainingV2Schema,
  FeedSchema,
  KnowledgeBase,
  QASchema,
  TestSchema,
  ContentLibrarySchema,
  VideoCourseSchema,
  exampleCollection.toSchema(),
]);

const contentElementTypes: string[] = Object.values(ContentElementType);

export const { schema, register, refreshSnapshot, adoptSchema } =
  createRegistry(SCHEMAS, contentElementTypes);

export const workflow = getWorkflowApi([DefaultWorkflow], schema);

validateRubricRefs(SCHEMAS, RUBRICS);

export const feedback = getFeedbackApi(RUBRICS, schema);
