# Repository transfer (export / import)

Moves a **whole repository** out to a self-contained `.tgz` archive and back
into any Tailor instance - structure, content, the asset library, and the
underlying asset files. It's what powers "export repository" / "import
repository".

---

## TL;DR

- **Export** = read a repository out of the database and object storage, write
  it as a handful of JSON files plus the raw asset files into a temp directory,
  then `tar + gzip` that directory into a `.tgz`.
- **Import** = the exact reverse: `gunzip + untar` the `.tgz` into a temp
  directory, then stream those files back into the database and object storage,
  **re-homing** everything onto a brand-new repository.
- Everything is **streamed** - rows flow one at a time from Postgres through
  Node streams into the archive (and back), so a huge repository never has to
  fit in memory.
- One **job queue** runs transfers one at a time; each job works in its own
  throwaway temp directory (a "blob store") that is cleaned up afterwards.

The archive is just a directory-in-a-tarball:

```
repository.tgz
├─ manifest.json     # schema config + which asset files are bundled (their storage keys)
├─ repository.json   # the Repository row
├─ activities.json   # every Activity row
├─ elements.json     # every ContentElement row
├─ assets.json       # the asset-library records (all types, incl. links)
└─ repository/<id>/assets/...   # the asset files themselves (images, video, pdf, ...)
```

`assets.json` is the library *records*; the files under `repository/<id>/assets/`
are their *bytes*; `manifest.json` only *lists* which of those files the archive
bundled (by storage key).

---

## Concepts

**Blob store.** A transfer never touches the final `.tgz` directly while
reading/writing content. It works against a temporary directory
(`fs-blob-store` over a `tmp` dir) whose entries are addressed by filename.
Export writes files into it and then packs the directory; import unpacks the
archive into it and then reads files out. See `job.js`.

**Adapter.** The format of the archive is owned by an *adapter*. There is one
today - `default/` - selected via `options.adapter` (defaults to `default`).
An adapter exposes four statics: `export`, `import` (content <-> blob store)
and `pack`, `unpack` (blob store <-> `.tgz`, mixed in by `formats.js`).

**Resolvers vs. processors.** Within the default adapter, every archive file
has a *resolver* (export: produces a **read** stream that pulls from the DB /
storage) and a *processor* (import: produces a **write** stream that pushes
into the DB / storage). A lookup table maps each filename to its pair; anything
not a named JSON file is treated as a raw asset file.

**`context`.** A single plain object threaded through the whole pipeline. It
carries the job options and accumulates state as files stream by - the
collected asset-file keys on export; the id-remapping tables and the new
repository id on import.

---

## Path / call stack

### Export

```
repository.service                        # kicks off the transfer job
└─ TransferService.createExportJob()      transfer.service.js   (queue: 1 at a time)
   └─ ExportJob.run()                      job.js
      ├─ createBlobStore()                 # fresh temp dir
      ├─ DefaultAdapter.export(blobStore, options)   default/index.js   # DB  -> files
      └─ DefaultAdapter.pack(blobStore, outFile)     formats.js         # dir -> .tgz
```

`DefaultAdapter.export` (inside one DB transaction for a consistent snapshot):

```
export(blobStore, { repositoryId, schemaId })
  ├─ exportFile('repository.json')  -> createRepositoryResolver  # + scans data/meta for asset refs
  ├─ exportFile('activities.json')  -> createActivitiesResolver
  ├─ exportFile('elements.json')    -> createElementsResolver
  ├─ exportFile('assets.json')      -> createAssetsResolver      # + collects every lib file
  ├─ for each collected key:  exportFile(key) -> createAssetResolver # copies file from storage
  └─ exportFile('manifest.json')    -> createManifestResolver    # written LAST: needs the final file list
```

### Import

```
repository.service.importArchive(path, { name, description, userId, userGroupIds })
└─ TransferService.createImportJob()      transfer.service.js
   └─ ImportJob.run()                      job.js
      ├─ createBlobStore()
      ├─ DefaultAdapter.unpack(inFile, blobStore)    formats.js       # .tgz -> dir
      └─ DefaultAdapter.import(blobStore, options)   default/index.js # files -> DB + storage
```

`DefaultAdapter.import`:

```
import(blobStore, options)
  ├─ importFile('manifest.json')   -> processManifest      # read FIRST: sets schema + file list
  ├─ transaction:
  │    ├─ importFile('repository.json') -> processRepository  # creates the repo, sets context.repositoryId
  │    ├─ importFile('activities.json') -> processActivities  # depth-ordered bulkCreate + id remap
  │    ├─ importFile('elements.json')   -> processElements    # bulkCreate + id remap
  │    └─ importFile('assets.json')     -> processAssets      # re-home the asset library
  └─ for each key in context.assets:  importFile(key) -> createAssetProcessor  # copies the file into storage
```

`exportFile` / `importFile` are the tiny routers that make this work:

```
exportFile(name):  (resolverLookup[name]  || createAssetResolver)  -> blobStore.createWriteStream(name)
importFile(name):  blobStore.createReadStream(name) -> (processorLookup[name] || createAssetProcessor)
```

---

## Stream flow

**Export** (a DB table -> a JSON file in the archive):

```
pg-query-stream(rows)  ->  collectAssets / collectAssetFiles (pass-through)  ->  JSONStream.stringify()  ->  blobStore file
```

`queryStream` selects the model's real columns (skipping VIRTUAL / generated
ones) and streams raw rows. The middle stage is a **pass-through** - the code
calls it a *tap*: a stream stage that watches each row for a side effect (here,
noting the asset files to bundle) and forwards it unchanged. `stringify` turns
the row stream into a JSON array on disk.

**Import** (a JSON file -> a DB table):

```
blobStore file  ->  JSONStream.parse()  ->  processX (transform)  ->  Model.bulkCreate
```

`parse()` emits the whole array; `processX` normalizes column names back to
model attributes, strips non-portable fields, remaps ids, and bulk-inserts.

Raw **asset files** skip the JSON machinery entirely: their resolver is just
`storage.createReadStream(key)` (export) and their processor is
`storage.createWriteStream(key)` (import).

---

## Key mechanisms

- **Id remapping.** Source rows keep their original ids in the archive, but
  those are stripped on import (`IGNORE_ATTRS`). As activities/elements are
  bulk-created, `context.activityIdMap` / `elementIdMap` record
  `oldId -> newId`. A second pass rewrites `parentId`, `activityId`, and every
  cross-entity `ref` (relationships, linked copies) through those maps.
- **Depth ordering.** Activities are inserted level by level (`groupByDepth`)
  so a parent always exists before its children are created.
- **Asset bundling (two sources).** Files to bundle = **content references**
  (`collectAssets` scans repository/activity/element `data`/`meta` for
  `storage://` keys) **∪ the entire library** (`collectAssetFiles` takes each
  asset row's primary `storageKey` plus its `meta.files` sub-files, e.g.
  captions). This is why unused/unplaced assets and their folders survive.
- **Library re-creation.** `assets.json` carries the full asset library (every
  type, including links, which have no file). `processAssets` recreates the
  rows, re-homed to the new repository and importing user.
- **Schema pinning (paste mode).** If the target instance doesn't have the
  archive's schema id registered, `processRepository` pins the manifest's
  schema snapshot into the new repo's `data` so it still renders.
- **Instance-specific stripping.** `stripInstanceSpecific` drops `$$.ai` and
  similar environment-bound `data` paths; `ASSET_IGNORE_ATTRS` drops the vector
  store id and processing state.
- **Transactions.** Export reads inside one transaction (consistent snapshot).
  Import writes all content inside one transaction (atomic); asset **files** are
  copied afterwards, best-effort (a missing file is logged, not fatal).

---

## Files

### `transfer.service.js`
The entry point. A singleton `TransferService` with a `PromiseQueue(1)` so
transfers run **one at a time**. `createExportJob` / `createImportJob`
construct a job, enqueue `job.run()`, wire success/error logging, and return
the job (callers `await job.toPromise()`).

### `job.js`
Defines `TransferJob` (an `EventEmitter`) and its `ExportJob` / `ImportJob`
subclasses. `run()` provisions a throwaway `BlobStore` (temp dir), runs the
job, emits `success`/`error`, and always cleans up the temp dir. It also
selects the adapter (`options.adapter`, default `default`). The subclasses just
sequence the two adapter halves: export = `export` then `pack`; import =
`unpack` then `import`.

### `formats.js`
`useTar(Adapter)` - a mixin that adds the archive-format statics to an adapter:
`pack` (tar the blob-store dir -> gzip -> write `.tgz`) and `unpack` (read
`.tgz` -> gunzip -> untar into the blob-store dir). The default adapter is
exported wrapped in it. Swapping archive formats (zip, no-gzip, ...) would be a
different mixin here.

### `default/index.js`
The **default adapter** and orchestrator. Holds the `Filename` map, the
`resolverLookup` / `processorLookup` tables, and the export/import yup schemas
(`importSchema` requires `name`; `description` is optional and inherited when
blank). `export()` and `import()` sequence the per-file steps described above;
`exportFile()` / `importFile()` are the routers that pick a resolver/processor
by filename and pipe it to/from the blob store.

### `default/resolvers.js`
The **export** (read) side - one resolver per archive file. Each streams a
model out of Postgres via `queryStream` and pipes it through an asset-collecting
tap into `JSONStream.stringify`:
- `createRepositoryResolver` / `createActivitiesResolver` /
  `createElementsResolver` - stream their table; `collectAssets` scans each row
  for embedded `storage://` references.
- `createAssetsResolver` - streams the asset library; `collectAssetFiles`
  records each row's primary + sub-files for bundling.
- `createManifestResolver` - emits `{ schema, date, assets }` (the bundled file
  list); written last so the list is final.
- `createAssetResolver` - the `default` resolver: streams a raw file straight
  out of object storage.

Helpers: `queryStream` (raw column-accurate row stream), `collectAssets` /
`createAssetParser` (content-reference scan), `collectAssetFiles` (library-file
scan).

### `default/processors.js`
The **import** (write) side - one processor per archive file, mirroring the
resolvers. Each parses its JSON and writes to the DB:
- `processManifest` - captures the schema config and the bundled file list into
  `context`.
- `processRepository` - creates the Repository (inheriting name/description from
  the archive when omitted), pins the schema snapshot if needed, and records the
  new `repositoryId`.
- `processActivities` - depth-ordered `bulkCreate`, builds `activityIdMap`, then
  remaps activity refs.
- `processElements` - `bulkCreate`, builds `elementIdMap` / `elementUidMap`,
  then remaps element refs.
- `processAssets` - recreates the asset-library rows, re-homed to the new
  repository and user.
- `createAssetProcessor` - the `default` processor: streams a raw file into
  object storage.

Helpers: `insertActivities` / `insertElements` (strip `IGNORE_ATTRS`, wire
foreign keys), `remapActivityRefs` / `remapElementRefs` (old->new id rewrite),
`groupByDepth`, `normalize` (DB column names -> model attributes), and
`createProcessor` (the transform/flush stream wrapper).
