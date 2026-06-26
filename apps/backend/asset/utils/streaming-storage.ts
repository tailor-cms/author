import type { Request } from 'express';
import type { StorageEngine } from 'multer';

import { Transform, type Readable } from 'node:stream';
import { AssetType } from '../models/asset.model.js';
import { buildStorageKey } from './storage-key.ts';
import { extractDimensions } from './image.ts';
import { resolveType } from './mime.ts';
import Storage from '../../repository/storage.ts';

// Bytes of the file head to sample for image dimension probing. An image's
// width/height live in its header, well within this, so we never buffer the
// whole file; generous since EXIF/metadata can push the size marker back.
const IMAGE_HEADER_BYTES = 512 * 1024;

// Accumulates up to `limit` bytes from the start of a stream; just enough to
// read an image's dimensions from its header without buffering the whole file.
function headerSampler(limit: number) {
  const chunks: Buffer[] = [];
  let length = 0;
  return {
    add(chunk: Buffer) {
      if (length >= limit) return;
      chunks.push(Buffer.from(chunk.subarray(0, limit - length)));
      length += chunk.length;
    },
    buffer: () => Buffer.concat(chunks),
  };
}

// Returns a pass-through stream that measures the upload as it flows: total
// size always, plus a sampled header for images (read for dimensions once the
// stream has drained).
function measureUpload(isImage: boolean) {
  let size = 0;
  const header = headerSampler(IMAGE_HEADER_BYTES);
  const stream = new Transform({
    transform(chunk: Buffer, _enc, done) {
      size += chunk.length;
      if (isImage) header.add(chunk);
      done(null, chunk);
    },
  });
  return { stream, result: () => ({ size, header: header.buffer() }) };
}

// Pipes the upload through the measuring stream into storage, resolving once
// durably stored. `pipe` doesn't forward errors, so a source failure (client
// abort, multer size-limit truncation) is pushed in to reject the write.
function streamToStorage(
  source: Readable,
  through: Transform,
  key: string,
  contentType: string,
) {
  source.on('error', (err) => through.destroy(err));
  source.pipe(through);
  return Storage.saveStream(key, through, { ContentType: contentType });
}

/**
 * A multer storage engine that streams each uploaded file straight to the
 * configured Storage provider (S3 multipart / filesystem) instead of spooling
 * it to disk or RAM, so multi-GB uploads stay memory-flat.
 *
 * Multer's own `limits.fileSize` still applies: on overflow it truncates the
 * stream and rejects the request with `LIMIT_FILE_SIZE` (mapped to 413 by the
 * app error handler), then calls `_removeFile` to roll back the stored object.
 */
class StreamingStorage implements StorageEngine {
  async _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error?: unknown, info?: Partial<Express.Multer.File>) => void,
  ) {
    const repositoryId = Number(req.params.repositoryId);
    if (!Number.isInteger(repositoryId)) {
      return cb(new Error('Missing repository context for upload'));
    }
    const { uid, key } = buildStorageKey(repositoryId, file.originalname);
    const isImage = resolveType(file.mimetype) === AssetType.Image;
    const measured = measureUpload(isImage);
    try {
      await streamToStorage(file.stream, measured.stream, key, file.mimetype);
      const { size, header } = measured.result();
      const dimensions = isImage ? extractDimensions(header) : null;
      // uid/key/dimensions are our additions, not in multer's File type
      cb(null, { uid, key, size, dimensions } as Partial<Express.Multer.File>);
    } catch (err) {
      cb(err);
    }
  }

  // Roll back a stored object when multer fails the request after this file was
  // saved. saveStream aborts in-flight multiparts itself; this removes one
  // that already committed.
  _removeFile(
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null) => void,
  ) {
    // `key` is one of the fields _handleFile merged on (not in multer's type).
    const { key } = file as { key?: string };
    if (!key) return cb(null);
    Promise.resolve(Storage.deleteFile(key)).then(() => cb(null), cb);
  }
}

// Factory
export function createStreamingStorage(): StorageEngine {
  return new StreamingStorage();
}
