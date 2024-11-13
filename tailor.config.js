import { DEFAULT_WORKFLOW } from './schemas/default-workflow';
import { SCHEMA as CourseSchema } from './schemas/course-schema';
import { SCHEMA as KnowledgeBase } from './schemas/knowledge-base';
import { SCHEMA as QASchema } from './schemas/q&a-schema';
import { SCHEMA as FeedSchema } from './schemas/feed-schema';

export const SCHEMAS = [CourseSchema, KnowledgeBase, QASchema, FeedSchema];
export const WORKFLOWS = [DEFAULT_WORKFLOW];

export default {
  SCHEMAS,
  WORKFLOWS,
};
