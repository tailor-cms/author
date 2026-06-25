import * as assetService from '../../../asset/asset.service.ts';
import * as yup from 'yup';
import Promise from 'bluebird';
import uniq from 'lodash/uniq.js';
import { sequelize } from '../../database/index.js';
import storage from '../../../repository/storage.ts';
import { useTar } from '../formats.js';
import resolvers from './resolvers.js';
import processors from './processors.js';

const miss = Promise.promisifyAll((await import('mississippi')).default);

const Filename = {
  REPOSITORY: 'repository.json',
  ACTIVITIES: 'activities.json',
  ELEMENTS: 'elements.json',
  MANIFEST: 'manifest.json',
};

const resolverLookup = {
  [Filename.REPOSITORY]: resolvers.createRepositoryResolver,
  [Filename.ACTIVITIES]: resolvers.createActivitiesResolver,
  [Filename.ELEMENTS]: resolvers.createElementsResolver,
  [Filename.MANIFEST]: resolvers.createManifestResolver,
  default: resolvers.createAssetResolver,
};

const processorLookup = {
  [Filename.REPOSITORY]: processors.createRepositoryProcessor,
  [Filename.ACTIVITIES]: processors.createActivitiesProcessor,
  [Filename.ELEMENTS]: processors.createElementsProcessor,
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
  description: string().required(),
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
    });
    // Bundle each collected file; some keys are false positives (any
    // storage://-shaped string is flagged) or dangling refs with no backing
    // file. Keep only the ones that exported so the manifest doesn't list a
    // file the archive never contained (which would fail import).
    const exported = [];
    await Promise.map(uniq(context.assets), async (it) => {
      try {
        await exportFile(blobStore, it, { context });
        exported.push(it);
      } catch (e) {
        console.log(`Unable to export file: ${it}\n`, e.message);
      }
    });
    context.assets = exported;
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
    });
    // Import each referenced file, tolerating keys with no archive entry. The
    // manifest can over-list: the collector flags every storage://-shaped
    // string, and the export skips ones whose file is missing.
    const imported = [];
    await Promise.map(uniq(context.assets), async (it) => {
      try {
        await importFile(blobStore, it, { context });
        imported.push(it);
      } catch (e) {
        console.log(`Unable to import file: ${it}\n`, e.message);
      }
    });
    await registerImportedAssets(imported, context);
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

// Registers a single imported static file in the repository's Asset Library.
async function registerImportedAsset(context, storageKey) {
  const { repositoryId, userId, assetMeta = {} } = context;
  try {
    await assetService.registerStorageAsset({
      repositoryId,
      userId,
      storageKey,
      // Restore the original name + meta (folder, tags, ...) when the archive
      // carried them; otherwise derives a flat record.
      ...assetMeta[storageKey],
    });
  } catch (err) {
    console.log(`Failed to register asset ${storageKey}: ${err.message}`);
  }
}

// Registers every imported static file referenced by the archive.
function registerImportedAssets(assetKeys, context) {
  const { repositoryId, userId } = context;
  if (!repositoryId || !userId) return Promise.resolve();
  return Promise.map(assetKeys, (key) => registerImportedAsset(context, key), {
    concurrency: 4,
  });
}
