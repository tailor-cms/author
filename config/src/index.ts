import {
  getSchemaApi,
  getWorkflowApi,
  processSchemas,
} from '@tailor-cms/config-parser';
import { ContentElementType } from '@tailor-cms/content-element-collection/types.js';

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
  ContentLibrarySchema,
  VideoCourseSchema,
  exampleCollection.toSchema(),
]);

const contentElementTypes: string[] = Object.values(ContentElementType);
export const schema = getSchemaApi(SCHEMAS, contentElementTypes);
export const workflow = getWorkflowApi(WORKFLOWS, schema);

// Rebuild the schema API with additional schema configs merged in
// (e.g. snapshots stored in `Repository.data.$$.schema.config` for repos
// whose schema id has been removed from the registry). Registry-bundled
// schemas take precedence: extras with an id already in the registry
// are dropped, so a snapshot can never shadow a live schema.
export function createAugmentedSchema(extras: ReadonlyArray<any>) {
  if (!extras?.length) return schema;
  const registryIds = new Set(SCHEMAS.map((s: any) => s.id));
  const augment = extras.filter((s) => !registryIds.has(s.id));
  if (!augment.length) return schema;
  return getSchemaApi([...SCHEMAS, ...augment] as any, contentElementTypes);
}

export default {
  SCHEMAS,
  WORKFLOWS,
  schema,
  workflow,
};
