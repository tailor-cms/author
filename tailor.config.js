import { DEFAULT_WORKFLOW } from './schemas/default-workflow.js';
import { SCHEMA as CourseSchema } from './schemas/course-schema.js';
import { SCHEMA as KnowledgeBase } from './schemas/knowledge-base.js';
import { SCHEMA as QASchema } from './schemas/q&a-schema.js';
import { SCHEMA as FeedSchema } from './schemas/feed-schema.js';

export const SCHEMAS = [CourseSchema, KnowledgeBase, QASchema, FeedSchema];
export const WORKFLOWS = [DEFAULT_WORKFLOW];

export default {
  SCHEMAS,
  WORKFLOWS,
};
