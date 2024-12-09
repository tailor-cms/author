import get from 'lodash/get.js';
import has from 'lodash/has.js'
import isString from 'lodash/isString.js';
import Promise from 'bluebird';
import set from 'lodash/set.js';
import toPairs from 'lodash/toPairs.js';
import values from 'lodash/values.js';
import storage from '../../repository/storage.js';
import { storage as config } from '#config';

const isComposite = (element) => has(element, 'data.embeds');
const isStorageAsset = (v) => isString(v) && v.startsWith(config.protocol);
const extractStorageKey = (v) => v.substr(config.protocol.length, v.length);

async function resolveAssetsMap(element) {
  if (!get(element, 'data.assets')) return element;
  await Promise.map(toPairs(element.data.assets), async ([key, url]) => {
    if (!url) return set(element.data, key, url);
    const resolvedUrl = isStorageAsset
      ? await storage.getFileUrl(extractStorageKey(url))
      : url;
    set(element.data, key, resolvedUrl);
  });
  return element;
}

async function resolveMetaMap(element) {
  const meta = Object.values(element.meta || {});
  await Promise.all(
    meta.map(async (value) => {
      const url = get(value, 'url');
      if (!url || !isStorageAsset(url)) return Promise.resolve();
      value.publicUrl = await storage.getFileUrl(extractStorageKey(url));
    }),
  );
  return element;
}

function resolveStatics(element) {
  return isComposite(element)
    ? resolveComposite(element)
    : resolvePrimitive(element);
}

async function resolvePrimitive(primitive) {
  if (isComposite(primitive)) throw new Error('Invalid primitive');
  // Temp handle legacy image format, due to broken preview
  if (primitive.type === 'IMAGE') {
    // url might be set to null, can't use lodash default
    const url = get(primitive, 'data.url');
    if (url && url.startsWith('repository/')) {
      primitive.data.assets = { url: `${config.protocol}${url}` };
    }
  }
  await resolveMetaMap(primitive);
  await resolveAssetsMap(primitive);
  return primitive;
}

async function resolveComposite(composite) {
  await resolveMetaMap(composite);
  await resolveAssetsMap(composite);
  const embeds = values(composite.data.embeds);
  if (!embeds || embeds.length < 1) return Promise.resolve(composite);
  return Promise.each(embeds, resolvePrimitive).then(() => composite);
}

export { resolveStatics };
