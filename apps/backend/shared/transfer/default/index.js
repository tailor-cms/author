import * as yup from 'yup';
import { existsSync } from 'node:fs';
import Promise from 'bluebird';
import path from 'node:path';
import uniq from 'lodash/uniq.js';

import { createLogger } from '#logger';
import { IncompleteExportError } from '../errors.js';
import { sequelize } from '../../database/index.js';
import { useTar } from '../formats.js';
import processors from './processors.js';
import resolvers from './resolvers.js';
import storage from '../../../repository/storage.ts';

const miss = Promise.promisifyAll((await import('mississippi')).default);
const logger = createLogger('transfer:default');

const Filename = {
  REPOSITORY: 'repository.json',
  ACTIVITIES: 'activities.json',
  ELEMENTS: 'elements.json',
  ASSETS: 'assets.json',
  MANIFEST: 'manifest.json',
};

const resolverLookup = {
  [Filename.REPOSITORY]: resolvers.createRepositoryResolver,
  [Filename.ACTIVITIES]: resolvers.createActivitiesResolver,
  [Filename.ELEMENTS]: resolvers.createElementsResolver,
  [Filename.ASSETS]: resolvers.createAssetsResolver,
  [Filename.MANIFEST]: resolvers.createManifestResolver,
  default: resolvers.createAssetResolver,
};

const processorLookup = {
  [Filename.REPOSITORY]: processors.createRepositoryProcessor,
  [Filename.ACTIVITIES]: processors.createActivitiesProcessor,
  [Filename.ELEMENTS]: processors.createElementsProcessor,
  [Filename.ASSETS]: processors.createAssetsProcessor,
  [Filename.MANIFEST]: processors.createManifestProcessor,
  default: processors.createAssetProcessor,
};

const integer = () => yup.number().integer().positive();
const string = () => yup.string();

const exportSchema = yup.object().shape({
  repositoryId: integer().required(),
  schemaId: string().required(),
});

const importSchema = yup.object().shape({
  userId: integer().required(),
  // Omitted description means "inherit from the archive" - processRepository()
  // falls back to the archived repository's own value. Name is always provided.
  description: string(),
  name: string().required(),
});

class DefaultAdapter {
  static async export(blobStore, options) {
    await exportSchema.validate(options);
    const context = { ...options, assets: [] };
    await sequelize.transaction(async (transaction) => {
      await exportFile(blobStore, Filename.REPOSITORY, {
        context,
        transaction,
      });
      await exportFile(blobStore, Filename.ACTIVITIES, {
        context,
        transaction,
      });
      await exportFile(blobStore, Filename.ELEMENTS, { context, transaction });
      // Export the entire asset library (every type, incl. links) and collect
      // each record's files (primary + meta sub-files) for bundling below.
      await exportFile(blobStore, Filename.ASSETS, { context, transaction });
    });
    // Bundle every collected file; content-referenced keys plus every library
    // asset's files (assets.json).
    const assetFiles = uniq(context.assets);
    const failed = [];
    await Promise.map(assetFiles, async (it) => {
      try {
        await exportFile(blobStore, it, { context });
      } catch (e) {
        logger.error({ err: e, key: it }, 'Failed to bundle asset file');
        failed.push(it);
      }
    });
    if (failed.length) {
      logger.error(
        { missing: failed },
        'Export incomplete: asset files missing from storage',
      );
      throw new IncompleteExportError(failed, assetFiles.length);
    }
    context.assets = assetFiles;
    await exportFile(blobStore, Filename.MANIFEST, { context });
  }

  static async import(blobStore, options) {
    await importSchema.validate(options);
    const context = {
      ...options,
      assets: [],
      activityIdMap: {},
      elementIdMap: {},
      elementUidMap: {},
      repositoryId: null,
    };
    await importFile(blobStore, Filename.MANIFEST, { context });
    await sequelize.transaction(async (transaction) => {
      await importFile(blobStore, Filename.REPOSITORY, {
        context,
        transaction,
      });
      await importFile(blobStore, Filename.ACTIVITIES, {
        context,
        transaction,
      });
      await importFile(blobStore, Filename.ELEMENTS, { context, transaction });
      // Recreate the full asset library (every type, incl. links) from the
      // archive's records; storage files are imported below. Older archives
      // predate the asset-library bundle and carry no assets.json; skip
      if (hasFile(blobStore, Filename.ASSETS)) {
        await importFile(blobStore, Filename.ASSETS, { context, transaction });
      }
    });
    // Import each bundled file into storage, tolerating keys with no archive
    // entry: the file list over-lists (every storage://-shaped string is
    // flagged) and link/fileless assets contribute no bytes.
    await Promise.map(uniq(context.assets), async (it) => {
      try {
        await importFile(blobStore, it, { context });
      } catch (e) {
        console.log(`Unable to import file: ${it}\n`, e.message);
      }
    });
  }
}

export default useTar(DefaultAdapter);

async function exportFile(blobStore, filename, { context, transaction } = {}) {
  const options = { context, filename, storage, transaction };
  const createResolvingStream =
    resolverLookup[filename] || resolverLookup.default;
  const srcStream = await createResolvingStream(options);
  const destStream = blobStore.createWriteStream(filename);
  return miss.pipeAsync(srcStream, destStream);
}

function importFile(blobStore, filename, { context, transaction } = {}) {
  const options = { context, filename, storage, transaction };
  const createProcessingStream =
    processorLookup[filename] || processorLookup.default;
  const srcStream = blobStore.createReadStream(filename);
  const destStream = createProcessingStream(options);
  return miss.pipeAsync(srcStream, destStream);
}

function hasFile(blobStore, filename) {
  return existsSync(path.join(blobStore.path, filename));
}
