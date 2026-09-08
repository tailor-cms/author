import type { Emoji } from './schemas/index.ts';
import EmojiModel, { type Emoji as EmojiRow } from './models/emoji.model.js';
import { EMOJI_NAME } from '@tailor-cms/interfaces/emoji';
import { createKvStore } from '#shared/kvStore.ts';
import crypto from 'node:crypto';
import sharp from 'sharp';
import storage from './storage.ts';

export class EmojiNameTakenError extends Error {}
export class EmojiNameInvalidError extends Error {}
export class EmojiImageInvalidError extends Error {}
export class EmojiNotFoundError extends Error {}

// The largest an emoji is drawn is the 40px preview in the admin
// dialog; 128px still covers that on a 3x screen
const IMAGE_SIZE_PX = 128;

// A tiny file can hide a huge picture
const MAX_DECODED_PIXELS = 16_000_000;

// Two megabytes is already far more than an emoji needs; past that it
// is a photo somebody picked by mistake.
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

// Raster only to avoid XSS vectors
const ACCEPTED_FORMATS = new Set([
  'png',
  'jpeg',
  'jpg',
  'webp',
  'gif',
  'avif',
]);

// The manifest is read by every page that draws a message and changes
// only when an admin adds or removes one
const MANIFEST_KEY = 'manifest';

const cache = createKvStore<Emoji[]>({
  ttl: 24 * 60 * 60 * 1000,
  namespace: 'emoji',
});

const IMAGE_TYPE = 'image/webp';

// Content-addressed, so the response can be cached forever: replacing an
// emoji mints a new hash and therefore a new URL.
const imageUrl = (contentHash: string) => `/api/emoji/${contentHash}/image`;

// One object per image, named by its hash, so the same artwork uploaded
// under two shortcodes is stored once.
const storageKey = (contentHash: string) =>
  storage.getPath(`${contentHash}.webp`);

// Truncated because it names an image
const hashImage = (image: Buffer) =>
  crypto.createHash('sha256').update(image).digest('hex').slice(0, 32);

const toEmoji = ({ id, name, contentHash, isAnimated }: EmojiRow): Emoji => ({
  id,
  name,
  url: imageUrl(contentHash),
  isAnimated,
});

/**
 * Every emoji, in one list. Deliberately unpaginated: it is the
 * dictionary a client needs before it can render a single message.
 */
export async function list(): Promise<Emoji[]> {
  const cached = await cache.get(MANIFEST_KEY);
  if (cached) return cached;
  const rows = await EmojiModel.findAll({ order: [['name', 'ASC']] });
  const manifest = rows.map(toEmoji);
  await cache.set(MANIFEST_KEY, manifest);
  return manifest;
}

/**
 * Normalises an upload and stores it under its own content hash.
 * Animation is preserved.
 */
export async function create(
  input: { name: string; image: Buffer },
  userId: number,
): Promise<Emoji> {
  const name = input.name.trim().toLowerCase();
  if (!EMOJI_NAME.test(name)) throw new EmojiNameInvalidError(name);
  if (input.image.byteLength > MAX_UPLOAD_BYTES) {
    throw new EmojiImageInvalidError('too large');
  }
  const existing = await EmojiModel.findOne({ where: { name } });
  if (existing) throw new EmojiNameTakenError(name);
  const { data, info } = await normalize(input.image);
  const contentHash = hashImage(data);
  await storage.saveFile(storageKey(contentHash), data, {
    ContentType: IMAGE_TYPE,
  });
  const emoji = await EmojiModel.create({
    name,
    contentHash,
    isAnimated: (info.pages ?? 1) > 1,
    createdById: userId,
  });
  await cache.delete(MANIFEST_KEY);
  return toEmoji(emoji);
}

export async function remove(id: number): Promise<void> {
  const emoji = await EmojiModel.findByPk(id);
  if (!emoji) throw new EmojiNotFoundError(String(id));
  const { contentHash } = emoji;
  // The row goes first
  await emoji.destroy();
  await cache.delete(MANIFEST_KEY);
  // Aliases may still exist
  const remaining = await EmojiModel.count({ where: { contentHash } });
  if (!remaining) {
    await storage.deleteFile(storageKey(contentHash)).catch(() => undefined);
  }
}

/** The image behind a hash, for the delivery route. */
export async function readImage(contentHash: string) {
  const emoji = await EmojiModel.findOne({ where: { contentHash } });
  if (!emoji) throw new EmojiNotFoundError(contentHash);
  const body = await storage.getFile(storageKey(contentHash));
  return { body, contentType: IMAGE_TYPE };
}

/**
 * Raster image in => 128px WebP out; animation preserved.
 * `animated: true` loads every frame, and the resize is animation-aware.
 */
async function normalize(image: Buffer) {
  const source = sharp(image, {
    animated: true,
    limitInputPixels: MAX_DECODED_PIXELS,
  });
  const metadata = await source.metadata().catch(() => null);
  if (!metadata?.format || !ACCEPTED_FORMATS.has(metadata.format)) {
    throw new EmojiImageInvalidError(metadata?.format ?? 'unknown');
  }
  return source
    .resize({
      width: IMAGE_SIZE_PX,
      height: IMAGE_SIZE_PX,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 90, effort: 4 })
    .toBuffer({ resolveWithObject: true });
}
