import * as yup from 'yup';
import Promise from 'bluebird';
import uniq from 'lodash/uniq.js';
import { sequelize } from '../../database/index.js';
import storage from '../../../repository/storage.js';
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
    await Promise.map(uniq(context.assets), async (it) => {
      try {
        await exportFile(blobStore, it, { context });
      } catch (e) {
        console.log(`Unable to export file: ${it}\n`, e.message);
      }
    });
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
    return Promise.map(context.assets, (it) =>
      importFile(blobStore, it, { context }),
    );
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
