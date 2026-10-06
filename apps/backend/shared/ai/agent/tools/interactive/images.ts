// Images from the asset library, copied into the page so it stays one
// file. The page refers to one as storage://<storageKey>, optionally with
// #w=<px> for the width it needs.
import clamp from 'lodash/clamp.js';
import countBy from 'lodash/countBy.js';
import escapeRegExp from 'lodash/escapeRegExp.js';
import sortBy from 'lodash/sortBy.js';
import uniq from 'lodash/uniq.js';
import sharp from 'sharp';
import { Op } from 'sequelize';

import type { FileAsset } from '#app/asset/models/asset.model.js';
import { AssetType } from '@tailor-cms/interfaces/asset';
import { storage as storageConfig } from '#config';
import db from '#shared/database/index.js';
import Storage from '#storage';

const { Asset } = db as any;

const PROTOCOL = storageConfig.protocol;

// Width an image is shrunk to, in px; a reference can ask for another.
const DEFAULT_WIDTH = 1600;
const MIN_WIDTH = 16;
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 80;
// All images of a page together, as copied in.
const MAX_TOTAL_BYTES = 8 * 1024 * 1024;

// "storage://" plus up to 255 characters after it (the longest key).
// Where a key ends can't be told from the text, since a file name may hold
// spaces, brackets or quotes; the database picks out the real keys (see
// findImageAssets).
const STORAGE_MENTION = new RegExp(
  `${escapeRegExp(PROTOCOL)}[^\\n]{0,255}`,
  'g',
);

// A storage URL up to the first space, quote, bracket or backslash. Used
// only after inlining, to report URLs that matched no image.
const STORAGE_REFERENCE = new RegExp(
  `${escapeRegExp(PROTOCOL)}[^\\s"'\`()<>\\\\]+`,
  'g',
);

// Optional width at the end of a reference, e.g. #w=800.
const WIDTH_SUFFIX = '#w=';

// The data URL keeps the reference it replaced, so the page can be
// turned back into the short form (see restoreImages).
const SOURCE_PARAM = 'x-asset';
const INLINED_IMAGE = new RegExp(
  `data:[\\w.+/-]+;${SOURCE_PARAM}=([\\w-]+);base64,[A-Za-z0-9+/=]*`,
  'g',
);

export interface InlineImagesResult {
  html: string;
  // Storage URLs of the images copied in.
  inlined: string[];
  failed: { reference: string; reason: string }[];
  // References written more than once; each one is a full copy.
  repeated: { reference: string; count: number }[];
}

interface EncodedImage {
  body: Buffer;
  type: string;
}

interface InlineContext {
  result: InlineImagesResult;
  remainingBytes: number;
}

/**
 * Copies the library images the page refers to into it. A reference that
 * can't be copied stays as written and is listed in `failed`.
 */
export async function inlineImages(
  html: string,
  repositoryId: number,
): Promise<InlineImagesResult> {
  const result: InlineImagesResult = {
    html,
    inlined: [],
    failed: [],
    repeated: [],
  };
  if (!html.includes(PROTOCOL)) return result;
  const ctx: InlineContext = { result, remainingBytes: MAX_TOTAL_BYTES };
  const assets = await findImageAssets(html, repositoryId);
  for (const asset of assets) await inlineImage(asset, ctx);
  for (const reference of findUnknownReferences(result)) {
    result.failed.push({
      reference,
      reason: 'no image with this storageKey in the asset library',
    });
  }
  return result;
}

// Reverse of inlineImages: copied images become storage URLs again.
export function restoreImages(html: string): string {
  return html.replace(INLINED_IMAGE, (_, source) => decodeSource(source));
}

/**
 * Image assets of the repository whose storage URL appears in the page.
 * Matched in the database, since a file name may contain any character.
 */
function findImageAssets(
  html: string,
  repositoryId: number,
): Promise<FileAsset[]> {
  const { sequelize } = db as any;
  const mentions = (html.match(STORAGE_MENTION) ?? []).join('\n');
  const storageUrl = sequelize.fn(
    'concat',
    PROTOCOL,
    sequelize.col('storage_key'),
  );
  return Asset.findAll({
    where: {
      repositoryId,
      type: AssetType.Image,
      // Without a key, concat leaves a bare "storage://", which would
      // match every mention.
      storageKey: { [Op.ne]: null },
      [Op.and]: sequelize.where(
        sequelize.fn('strpos', mentions, storageUrl),
        { [Op.gt]: 0 },
      ),
    },
  });
}

// Each width the page asks for is copied once per place it is written.
async function inlineImage(asset: FileAsset, ctx: InlineContext) {
  const { result } = ctx;
  const storageUrl = `${PROTOCOL}${asset.storageKey}`;
  const pattern = new RegExp(
    `${escapeRegExp(storageUrl)}(?:${WIDTH_SUFFIX}\\d+)?`,
    'g',
  );
  const counts = countBy(result.html.match(pattern) ?? []);
  const file = await Storage.getFile(asset.storageKey).catch(() => null);
  const dataUrls = new Map<string, string>();
  for (const [reference, count] of Object.entries(counts)) {
    const fail = (reason: string) => result.failed.push({ reference, reason });
    if (!file) {
      fail('file missing from storage');
      continue;
    }
    const image = await shrinkImage(file, isSvgAsset(asset), widthOf(reference))
      .catch(() => null);
    if (!image) {
      fail('not a readable image');
      continue;
    }
    const dataUrl = toDataUrl(image, reference);
    const bytes = dataUrl.length * count;
    if (bytes > ctx.remainingBytes) {
      fail('image size limit reached; use fewer or smaller images (#w=)');
      continue;
    }
    ctx.remainingBytes -= bytes;
    dataUrls.set(reference, dataUrl);
    if (count > 1) result.repeated.push({ reference, count });
  }
  if (!dataUrls.size) return;
  result.html = result.html.replace(
    pattern,
    (reference) => dataUrls.get(reference) ?? reference,
  );
  result.inlined.push(storageUrl);
}

/**
 * Storage URLs still in the page that match no image. URLs whose image
 * failed to copy (e.g. a broken file) are already in `failed`.
 */
function findUnknownReferences({ html, failed }: InlineImagesResult) {
  const reported = sortBy(
    failed.map((it) => it.reference),
    (it) => -it.length,
  );
  const rest = reported.reduce(
    (text, reference) => text.split(reference).join(''),
    html,
  );
  return uniq(rest.match(STORAGE_REFERENCE) ?? []);
}

function widthOf(reference: string): number {
  const width = Number(reference.split(WIDTH_SUFFIX)[1]);
  return width ? clamp(width, MIN_WIDTH, MAX_WIDTH) : DEFAULT_WIDTH;
}

/**
 * Shrinks the image to fit `width` (never enlarges) as WebP, keeping
 * transparency and animation. SVG scales by itself, so it is kept as is.
 */
async function shrinkImage(
  file: Buffer,
  isSvg: boolean,
  width: number,
): Promise<EncodedImage> {
  if (isSvg) return { body: file, type: 'image/svg+xml' };
  const image = sharp(file, { animated: true });
  const { pages = 1 } = await image.metadata();
  // Turns photos upright (camera orientation); not supported on animations.
  if (pages === 1) image.rotate();
  const body = await image
    .resize(width, width, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  return { body, type: 'image/webp' };
}

// By the file name too, in case the type wasn't recorded on upload.
const isSvgAsset = (asset: FileAsset): boolean =>
  asset.meta?.mimeType === 'image/svg+xml' ||
  /\.svg$/i.test(asset.storageKey);

function toDataUrl({ body, type }: EncodedImage, reference: string) {
  const source = Buffer.from(reference, 'utf8').toString('base64url');
  const data = body.toString('base64');
  return `data:${type};${SOURCE_PARAM}=${source};base64,${data}`;
}

const decodeSource = (source: string) =>
  Buffer.from(source, 'base64url').toString('utf8');
