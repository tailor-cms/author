import {
  getSchemaApi,
  getWorkflowApi,
  processSchemas,
} from '@tailor-cms/config-parser';

import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';
import { SCHEMA as CourseSchema } from './schemas/course.schema';
import { DEFAULT_WORKFLOW as DefaultWorkflow } from './workflows/default.workflow';
import { SCHEMA as FeedSchema } from './schemas/feed.schema';
import { SCHEMA as KnowledgeBase } from './schemas/knowledge-base.schema';
import { SCHEMA as QASchema } from './schemas/q&a.schema';
import { SCHEMA as HeasSchema } from './schemas/heas.schema';
import { SCHEMA as TestSchema } from './schemas/test.schema';
import { SCHEMA as PartnerTrainingSchema } from './schemas/partner-training.schema';
import { SCHEMA as VideoCourseSchema } from './schemas/video-course.schema';
import { SCHEMA as PartnerTrainingV2Schema } from './schemas/partner-training-v2.schema';

export const WORKFLOWS = [DefaultWorkflow];
export const SCHEMAS = processSchemas([
  CourseSchema,
  HeasSchema,
  PartnerTrainingSchema,
  PartnerTrainingV2Schema,
  FeedSchema,
  KnowledgeBase,
  QASchema,
  TestSchema,
  VideoCourseSchema,
]);

export const schema = getSchemaApi(SCHEMAS, Object.values(ContentElementType));
export const workflow = getWorkflowApi(WORKFLOWS, schema);

export default {
  SCHEMAS,
  WORKFLOWS,
  schema,
  workflow,
};
