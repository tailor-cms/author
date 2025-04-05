import { schema as schemaAPI } from '@tailor-cms/config';
import type { AiRepositoryContext } from '../interfaces.ts';

export class RepositoryContext {
  schemaId: string;
  name: string;
  description: string;
  outlineLocation?: string;
  topic?: string;
  tags?: string[];

  constructor(context: AiRepositoryContext) {
    this.schemaId = context.schemaId;
    this.name = context.name;
    this.description = context.description;
    this.outlineLocation = context.outlineLocation;
    this.topic = context.topic;
    this.tags = context.tags;
  }

  get baseContext() {
    const { schemaId, name, description } = this;
    if (!schemaId || !name || !description) return '';
    const schema = schemaAPI.getSchema(schemaId);
    if (!schema) return '';
    const repoName = `User is working on "${schema.name}" named "${name}".`;
    const repoDescription = `It is described by user as: "${description}".`;
    return `${repoName} ${repoDescription}`;
  }

  get tagContext() {
    const { tags } = this;
    if (!tags?.length) return '';
    const base = 'The following tags were provided to inform the context:';
    return `${base} ${tags.join(', ')}.`;
  }

  get locationContext() {
    const { outlineLocation } = this;
    if (!outlineLocation) return '';
    return `The content is located in "${outlineLocation}".`;
  }

  get topicContext() {
    const { topic } = this;
    if (!topic) return '';
    return `User is currently creating content about "${topic}".`;
  }

  toString() {
    return `
      ${this.baseContext}
      ${this.topicContext}
      ${this.locationContext}
      ${this.tagContext}`.trim();
  }
}
