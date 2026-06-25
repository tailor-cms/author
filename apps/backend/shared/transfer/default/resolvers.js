import mapKeys from 'lodash/mapKeys.js';
import miss from 'mississippi';
import QueryStream from 'pg-query-stream';
import { stringify } from 'JSONStream';
import db from '../../database/index.js';
import { stripInstanceSpecific } from '#app/repository/lib/data-attr.ts';

const { Activity, Asset, ContentElement, Repository } = db;
const reStorage = /^storage:\/\//;

const IS_ARRAY_STREAM = false;
const isString = (arg) => typeof arg === 'string';
const prependStorage = (it) =>
  it.replace(/^(?!(?:storage:)?\/\/)(?=repository\/)/, 'storage://');

function createRepositoryResolver({ context, transaction }) {
  const where = { id: context.repositoryId };
  const srcStream = queryStream(Repository, { where, transaction });
  const stripInternal = miss.through.obj((repo, _enc, cb) => {
    // Drop instance-specific paths ($$.ai, etc.) but keep $$.schema so
    // the archive carries the schema snapshot - the target instance may
    // not have this schema id registered (paste-mode safety).
    if (repo.data) repo.data = stripInstanceSpecific(repo.data);
    cb(null, repo);
  });
  // Collect repository-level meta assets (e.g. a `thumbnailImage` File meta
  // input lives in `repository.data`) so their files get bundled too.
  return miss.pipe(
    srcStream,
    stripInternal,
    collectAssets(context),
    stringify(IS_ARRAY_STREAM),
  );
}

function createActivitiesResolver({ context, transaction }) {
  const where = { repositoryId: context.repositoryId };
  const srcStream = queryStream(Activity, { where, transaction });
  // Collect activity-level meta assets (File meta inputs live in
  // `activity.data`) alongside element assets.
  return miss.pipe(srcStream, collectAssets(context), stringify());
}

function createElementsResolver({ context, transaction }) {
  const where = { repositoryId: context.repositoryId };
  const srcStream = queryStream(ContentElement, { where, transaction });
  return miss.pipe(srcStream, collectAssets(context), stringify());
}

// Wires an asset-collecting parser onto an export stream: every storage://
// (or bare `repository/...`) reference found in a row's data/meta is recorded
// into context.assets. Applied to the repository, activity and element
// streams so File meta inputs at every level get bundled into the archive
// (and later registered in the asset library).
function collectAssets(context) {
  context.assets = context.assets || [];
  const assetParser = createAssetParser();
  assetParser.on('asset', (asset) => context.assets.push(asset));
  return assetParser;
}

async function createManifestResolver({ context }) {
  const { assets, repositoryId } = context;
  const repository = await Repository.findByPk(repositoryId, {
    paranoid: false,
  });
  // Carry each bundled asset's library record (name + meta, incl. folder/tags)
  // keyed by storage key, so import rebuilds the asset library structure rather
  // than flattening to the root with a derived name.
  const rows = await Asset.findAll({
    where: { repositoryId, storageKey: assets },
    attributes: ['storageKey', 'name', 'meta'],
  });
  const assetMeta = Object.fromEntries(
    rows.map((it) => [it.storageKey, { name: it.name, meta: it.meta }]),
  );
  const manifest = {
    schema: repository.getSchemaConfig(),
    date: new Date(),
    assets,
    assetMeta,
  };
  return miss.pipe(miss.from.obj([manifest]), stringify(IS_ARRAY_STREAM));
}

function createAssetResolver({ filename, storage }) {
  return storage.createReadStream(filename);
}

export default {
  createRepositoryResolver,
  createActivitiesResolver,
  createElementsResolver,
  createManifestResolver,
  createAssetResolver,
};

function createAssetParser() {
  return miss.through.obj(function (element, _enc, cb) {
    element = element || {};
    const { data = {}, meta = {} } = element;
    const str = JSON.stringify({ ...data, ...meta });
    JSON.parse(str, (_, value) => {
      if (!isString(value)) return value;
      const [, asset] = prependStorage(value).split(reStorage);
      asset && this.emit('asset', asset);
      return value;
    });
    cb(null, element);
  });
}

function queryStream(Model, { where, transaction }) {
  where = mapKeys(where, (_, key) => Model.rawAttributes[key].field);
  // Select real backing columns instead of `SELECT *`. Excludes generated
  // columns (e.g. `content_element.search_vector`) which have no model
  // attribute and break reimport (`normalize` can't map them, and they
  // can't be inserted into a `GENERATED ALWAYS` column), while skipping
  // VIRTUAL attributes (e.g. `activity.isTrackedInWorkflow`) that have no
  // column at all - selecting those would throw "column does not exist".
  const attributes = Object.values(Model.rawAttributes)
    .filter((it) => !(it.type && it.type.key === 'VIRTUAL'))
    .map((it) => it.field);
  const select = Model.queryGenerator.selectQuery(Model.tableName, {
    attributes,
    where,
  });
  const stream = new QueryStream(select);
  return transaction.connection.query(stream);
}
