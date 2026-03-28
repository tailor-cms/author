import type {
  AiRepositoryContext,
  AssetReference,
} from '@tailor-cms/interfaces/ai.ts';
import { schema as schemaAPI } from '@tailor-cms/config';
import pick from 'lodash/pick.js';

import db from '#shared/database/index.js';
import { createAiLogger } from '../logger.ts';

const logger = createAiLogger('context');

export default class RepositoryContext {
  schemaId: string;
  name: string;
  description: string;
  outlineActivityType?: string;
  containerType?: string;
  topic?: string;
  tags?: string[];
  vectorStoreId?: string;
  assets: AssetReference[] = [];
  // Resolved outline: ancestors + current activity
  private outlineLocation: any[] = [];

  constructor(context: AiRepositoryContext) {
    this.schemaId = context.schemaId;
    this.name = context.name;
    this.description = context.description;
    this.outlineActivityType = context.outlineActivityType;
    this.containerType = context.containerType;
    this.topic = context.topic;
    // Fallback tags from frontend (e.g. outline generation before repo exists)
    this.tags = context.tags;
    this.vectorStoreId = context.vectorStoreId;
  }

  async resolve(context: AiRepositoryContext) {
    const { repositoryId, activityId } = context;
    if (!repositoryId) return;
    await Promise.all([
      this.resolveOutlineContext(activityId),
      this.resolveRepository(repositoryId),
      this.resolveAssets(repositoryId),
    ]);
  }

  private async resolveOutlineContext(activityId?: number) {
    if (!activityId) return;
    try {
      const { Activity } = db;
      const activity = await Activity.findByPk(activityId);
      if (!activity) return;
      const ancestors = await activity.predecessors();
      this.outlineLocation = [...ancestors, activity];
    } catch (err) {
      logger.warn(err, 'Failed to resolve outline context');
    }
  }

  private async resolveRepository(repositoryId: number) {
    try {
      const { Repository } = db;
      const repo = await Repository.findByPk(repositoryId);
      if (!repo) return;
      // Vector store ID
      if (!this.vectorStoreId) {
        this.vectorStoreId = repo.getVectorStoreId() || undefined;
      }
      // Tags from AI meta
      const aiMeta = repo.data?.$$?.ai;
      if (!aiMeta) return;
      const tags = [
        ...(aiMeta.topicTags || []),
        ...(aiMeta.styleTags || []),
      ].filter(Boolean);
      if (tags.length) this.tags = tags;
    } catch (err) {
      logger.warn(err, 'Failed to resolve repository');
    }
  }

  private async resolveAssets(repositoryId: number) {
    try {
      const { Asset } = db;
      const rows = await Asset.findAll({ where: { repositoryId } });
      await Asset.resolvePublicUrls(rows);
      this.assets = rows.map((a: any) => ({
        ...pick(a, ['id', 'name', 'type', 'storageKey', 'publicUrl']),
        meta: {
          ...pick(a.meta || {}, ['contentType', 'url', 'description', 'tags']),
          isCoreSource: !!a.meta?.isCoreSource,
        },
      }));
      logger.info(
        { repositoryId, count: this.assets.length },
        'Loaded repository assets',
      );
    } catch (err) {
      logger.warn(err, 'Failed to load assets');
    }
  }

  get schema() {
    const { schemaId } = this;
    if (!schemaId) return null;
    return schemaAPI.getSchema(schemaId) || null;
  }

  get baseContext() {
    const { name, description } = this;
    if (!this.schema || !name || !description) return '';
    const intro = `User is working on "${this.schema.name}" named "${name}".`;
    const desc = `It is described by user as: "${description}".`;
    return `${intro} ${desc}`;
  }

  get locationContext() {
    const location = this.outlineLocation
      .slice(0, -1)
      .map((a: any) => a.data?.name)
      .filter(Boolean)
      .join(', ');
    if (!location) return '';
    return `The content is located in "${location}".`;
  }

  get contentContainerDescription() {
    const { outlineActivityType, containerType } = this;
    if (!outlineActivityType || !containerType) return '';
    const container = schemaAPI
      .getSupportedContainers(outlineActivityType)
      .find((c: any) => c.type === containerType);
    return container?.ai?.definition || '';
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

  get instructionContext() {
    const instructions = this.outlineLocation
      .map((a: any) => a.data?.aiPrompt?.trim())
      .filter(Boolean)
      .join('\n');
    if (!instructions) return '';
    return `Author instructions:\n${instructions}`;
  }

  toString() {
    return `
      ${this.baseContext}
      ${this.topicContext}
      ${this.locationContext}
      ${this.contentContainerDescription}
      ${this.tagContext}
      ${this.instructionContext}`.trim();
  }
}
