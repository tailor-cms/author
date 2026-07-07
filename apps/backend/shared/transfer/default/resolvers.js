import mapKeys from 'lodash/mapKeys.js';
import miss from 'mississippi';
import QueryStream from 'pg-query-stream';
import { stringify } from 'JSONStream';
import db from '../../database/index.js';
import { stripInstanceSpecific } from '#app/repository/lib/data-attr.ts';
import { stripTransientAssetMeta } from '#app/asset/utils/meta.ts';

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

// Streams the whole asset library (every type, incl. links) into assets.json
// and collects each record's files for bundling - so unused/unplaced assets
// and their folders survive the round-trip, not just content-referenced ones.
function createAssetsResolver({ context, transaction }) {
  const where = { repositoryId: context.repositoryId, deletedAt: null };
  const srcStream = queryStream(Asset, { where, transaction });
  return miss.pipe(srcStream, collectAssetFiles(context), stringify());
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

// Bundling tap for the asset-library export. createAssetsResolver splices it
// into the assets.json stream (queryStream(Asset) -> collectAssetFiles ->
// stringify): every Asset row passes through on its way into assets.json, and
// each one's file storage keys are recorded into context.assets - the set of
// files export() writes into the archive.
//
// It's needed because the content scan (collectAssets, over repo/activity/
// element rows) only sees storage:// strings embedded in data/meta - which
// misses unused library assets; the asset lib is a separate entity and
// its files have different structure and placement:
//   - the primary file is a top-level `storage_key` COLUMN, not an embedded
//     reference; and
//   - meta.files sub-files (e.g. video captions) sit on the asset row, not in
//     any content.
// So without this, unused/unplaced library assets and all sub-files would be
// left out of the archive. Link assets own no file and add nothing here; their
// record still travels in assets.json.
function collectAssetFiles(context) {
  // Shared accumulator - collectAssets (content refs) also pushes here, so a
  // placed library asset lands via both. Harmless: export/import uniq() the
  // list before bundling.
  context.assets = context.assets || [];
  // Pass-through transform: tap each asset row for files, forward unchanged.
  return miss.through.obj(function (asset, _enc, cb) {
    // Primary file (absent on link/embed rows, which own no bytes).
    if (asset.storage_key) context.assets.push(asset.storage_key);
    // Sub-files attached to the asset (fileKey -> storageKey);
    for (const key of Object.values(asset.meta?.files || {})) {
      // Skip empty slots; drop any storage:// prefix for a raw storage key.
      if (!isString(key) || !key) continue;
      context.assets.push(key.replace(reStorage, ''));
    }
    // Drop cache flags (hasThumbnail/thumbnailFailed) so the
    // imported copy regenerates its thumbnail instead of pointing at a file
    // that isn't in the archive.
    if (asset.meta) asset.meta = stripTransientAssetMeta(asset.meta);
    // Forward the row to stringify() -> assets.json.
    cb(null, asset);
  });
}

async function createManifestResolver({ context }) {
  const { assets, repositoryId } = context;
  const repository = await Repository.findByPk(repositoryId, {
    paranoid: false,
  });
  // The full asset-library records travel in assets.json; the manifest only
  // needs the schema and the list of bundled files.
  const manifest = {
    schema: repository.getSchemaConfig(),
    date: new Date(),
    assets,
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
  createAssetsResolver,
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
