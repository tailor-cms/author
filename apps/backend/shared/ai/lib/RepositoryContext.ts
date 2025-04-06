import type { AiRepositoryContext } from '@tailor-cms/interfaces/ai.ts';
import { schema as schemaAPI } from '@tailor-cms/config';

export default class RepositoryContext {
  schemaId: string;
  name: string;
  description: string;
  outlineLocation?: string;
  containerRules?: any;
  topic?: string;
  tags?: string[];

  constructor(context: AiRepositoryContext) {
    this.schemaId = context.schemaId;
    this.name = context.name;
    this.description = context.description;
    this.outlineLocation = context.outlineLocation;
    this.topic = context.topic;
    this.containerRules = context.containerRules;
    this.tags = context.tags;
  }

  get schema() {
    const { schemaId } = this;
    if (!schemaId) return null;
    const schema = schemaAPI.getSchema(schemaId);
    if (!schema) return null;
    return schema;
  }

  get baseContext() {
    const { name, description } = this;
    if (!this.schema || !name || !description) return '';
    const intro = `User is working on "${schema.name}" named "${name}".`;
    const details = `It is described by user as: "${description}".`;
    return `${intro} ${details}`;
  }

  get locationContext() {
    const { outlineLocation } = this;
    if (!outlineLocation) return '';
    return `The content is located in "${outlineLocation}".`;
  }

  get contentContainerDescription() {
    return this.containerRules?.definition || '';
  }

  get topicContext() {
    const { topic } = this;
    if (!topic) return '';
    return `User is currently creating content about "${topic}".`;
  }

  get tagContext() {
    const { tags } = this;
    if (!tags?.length) return '';
    const base = 'The following tags were provided to inform the context:';
    return `${base} ${tags.join(', ')}.`;
  }

  toString() {
    return `
      ${this.baseContext}
      ${this.topicContext}
      ${this.locationContext}
      ${this.contentContainerDescription}
      ${this.tagContext}`.trim();
  }
}
