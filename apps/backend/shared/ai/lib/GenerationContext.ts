import type {
  AiRepositoryContext,
  AssetReference,
} from '@tailor-cms/interfaces/ai.ts';
import { schema as schemaAPI } from '@tailor-cms/config';
import pick from 'lodash/pick.js';

import db from '#shared/database/index.js';
import { createAiLogger } from '../logger.ts';

const logger = createAiLogger('context');

export default class GenerationContext implements AiRepositoryContext {
  repositoryId: number;
  schemaId: string;
  name: string;
  description: string;
  outlineActivityId?: number;
  outlineActivityType?: string;
  containerType?: string;
  topic?: string;
  // Vector store id is resolved from the repository record
  vectorStoreId?: string;
  assets: AssetReference[] = [];
  // Resolved outline: ancestors + current activity
  private outlineLocation: any[] = [];

  constructor(context: AiRepositoryContext) {
    this.repositoryId = context.repositoryId;
    this.schemaId = context.schemaId;
    this.name = context.name;
    this.description = context.description;
    this.outlineActivityId = context.outlineActivityId;
    this.outlineActivityType = context.outlineActivityType;
    this.containerType = context.containerType;
    this.topic = context.topic;
  }

  async resolve() {
    const { repositoryId, outlineActivityId } = this;
    if (!repositoryId) return;
    await Promise.all([
      this.resolveOutlineContext(repositoryId, outlineActivityId),
      this.resolveVectorStore(repositoryId),
      this.resolveAssets(repositoryId),
    ]);
  }

  private async resolveOutlineContext(
    repositoryId: number,
    activityId?: number,
  ) {
    if (!activityId) return;
    try {
      const { Activity } = db;
      const activity = await Activity.findOne({
        where: { id: activityId, repositoryId },
      });
      if (!activity) {
        logger.warn(
          { repositoryId, activityId },
          'Outline activity not found in repository',
        );
        return;
      }
      const ancestors = await activity.predecessors();
      this.outlineLocation = [...ancestors, activity];
    } catch (err) {
      logger.warn(err, 'Failed to resolve outline context');
    }
  }

  private async resolveVectorStore(repositoryId: number) {
    try {
      const { Repository } = db;
      const repo = await Repository.findByPk(repositoryId);
      if (!repo) return;
      this.vectorStoreId = repo.getVectorStoreId() || undefined;
    } catch (err) {
      logger.warn(err, 'Failed to resolve vector store');
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
      ${this.instructionContext}`.trim();
  }
}
