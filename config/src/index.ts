import {
  getSchemaApi,
  getWorkflowApi,
  processSchemas,
} from '@tailor-cms/config-parser';

import { SCHEMA as CourseSchema } from './course-schema';
import { DEFAULT_WORKFLOW } from './default-workflow';
import { SCHEMA as FeedSchema } from './feed-schema';
import { SCHEMA as KnowledgeBase } from './knowledge-base';
import { SCHEMA as QASchema } from './q&a-schema';

export const SCHEMAS = processSchemas([
  CourseSchema,
  FeedSchema,
  KnowledgeBase,
  QASchema,
]);

export const WORKFLOWS = [DEFAULT_WORKFLOW];

export const schema = getSchemaApi(SCHEMAS);
export const workflow = getWorkflowApi(WORKFLOWS, schema);

export default {
  SCHEMAS,
  WORKFLOWS,
  schema,
  workflow,
};
