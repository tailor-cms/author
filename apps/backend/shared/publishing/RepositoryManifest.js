import findIndex from 'lodash/findIndex.js';
import hash from 'hash-object';
import pick from 'lodash/pick.js';
import Promise from 'bluebird';
import reduce from 'lodash/reduce.js';
import { schema } from '@tailor-cms/config';
import without from 'lodash/without.js';

import { ContentContainer } from './ContentContainer.js';
import { renameKey } from './utils.js';
import storage from '#storage';

export class RepositoryManifest {
  repository = null;
  draft = null;

  constructor(repository, draft) {
    if (!repository) throw new Error('RepositoryManifest args are not valid!');
    this.repository = repository;
    this.draft = draft;
  }

  static async load(repository) {
    const manifest = await RepositoryManifest.loadFromStorage(repository.id);
    const draft = manifest || RepositoryManifest.init(repository);
    return new RepositoryManifest(repository, draft);
  }

  static async loadFromStorage(repositoryId) {
    const storageKey = `repository/${repositoryId}/index.json`;
    const buffer = await storage.getFile(storageKey);
    return !!buffer && JSON.parse(buffer.toString('utf8'));
  }

  static init(repository) {
    return {
      ...RepositoryManifest.pickRepositoryAttrs(repository),
      structure: [],
    };
  }

  async update(val = this.repository) {
    this.draft = {
      ...this.draft,
      ...RepositoryManifest.pickRepositoryAttrs(val),
    };
    return this.save();
  }

  async save() {
    const hashProps = without(Object.keys(this.draft), [
      'version',
      'publishedAt',
    ]);
    const hashData = pick(this.draft, hashProps);
    const updatedData = {
      ...this.draft,
      version: hash(hashData, { algorithm: 'sha1' }),
      publishedAt: new Date(),
    };
    const buffer = Buffer.from(JSON.stringify(updatedData), 'utf8');
    const key = `repository/${this.repository.id}/index.json`;
    await storage.saveFile(key, buffer);
    return updatedData;
  }

  static pickRepositoryAttrs(repository) {
    const attrs = ['id', 'uid', 'schema', 'name', 'description', 'data'];
    const temp = pick(repository, attrs);
    renameKey(temp, 'data', 'meta');
    return temp;
  }

  findActivityById(id) {
    return this.draft?.structure.find((it) => it.id === id);
  }

  findActivityIndex(id) {
    return findIndex(this.draft?.structure, { id });
  }

  async publishActivity(activity) {
    const publishedActivity = this.findActivityById(activity.id);
    const prevPublishedContainers = publishedActivity?.contentContainers || [];
    // Parents need to be in the published structure
    const predecessors = await activity.predecessors();
    predecessors.forEach((it) => {
      const exists = this.findActivityById(it.id);
      if (!exists) this.upsertStructureItem(it);
    });
    // Upsert in the manifest structure
    this.upsertStructureItem(activity);
    // Publish containers
    const newlyPublishedContainers = await ContentContainer.publish(activity);
    // Remove deleted containers
    await ContentContainer.unpublish(
      activity,
      prevPublishedContainers,
      newlyPublishedContainers,
    );
    // Add container info to the manifest structure activity item
    this.attachContainerSummary(activity.id, newlyPublishedContainers);
    return this.save();
  }

  async unpublishActivity(activity) {
    const manifestItem = this.findActivityById(activity.id);
    if (!manifestItem) return;
    const deleted = this.getStructureChildren(activity.id).concat(manifestItem);
    // Remove activity and its children from the repository structure
    this.removeStructureItems(deleted);
    // Unpublish related content containers
    await Promise.map(deleted, async (it) =>
      ContentContainer.unpublish(activity, it.contentContainers),
    );
    return this.save();
  }

  upsertStructureItem(activity) {
    const relationships = schema.getLevelRelationships(activity.type);
    const data = {
      ...pick(activity, [
        'id',
        'uid',
        'parentId',
        'type',
        'position',
        'data',
        'publishedAt',
        'createdAt',
        'updatedAt',
      ]),
      relationships: this.mapRelationships(relationships, activity),
    };
    renameKey(data, 'data', 'meta');
    const index = this.findActivityIndex(data.id);
    if (index < 0) {
      this.draft.structure.push(data);
    } else {
      this.draft.structure[index] = data;
    }
  }

  removeStructureItems(activities) {
    const { structure } = this.draft;
    const ids = activities.map((it) => it.id);
    this.draft.structure = structure.filter((it) => !ids.includes(it.id));
  }

  getStructureChildren(id) {
    const { structure } = this.draft;
    const items = structure?.filter((it) => it.parentId === id);
    if (!items.length) return [];
    return items.concat(
      reduce(items, (acc, it) => acc.concat(this.getStructureChildren(it.id)), []),
    );
  }

  attachContainerSummary(activityId, containers) {
    const outlineActivity = this.findActivityById(activityId);
    ContentContainer.attachContainerSummary(outlineActivity, containers);
  }

  mapRelationships(relationships, activity) {
    return relationships.reduce((acc, { type }) => {
      return Object.assign(acc, { [type]: activity?.refs?.[type] || [] });
    }, {});
  }
}
