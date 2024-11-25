import get from 'lodash/get.js';
import isString from 'lodash/isString.js';
import Promise from 'bluebird';
import set from 'lodash/set.js';
import toPairs from 'lodash/toPairs.js';
import values from 'lodash/values.js';
import storage from '../../repository/storage.js';
import { storage as config } from '#config';

const isPrimitive = (element) => !get(element, 'data.embeds');
const isQuestion = (element) => get(element, 'data.question');
const isStorageAsset = (v) => isString(v) && v.startsWith(config.protocol);
const extractStorageKey = (v) => v.substr(config.protocol.length, v.length);

function resolveStatics(item) {
  return isQuestion(item) ? resolveQuestion(item) : resolveAsset(item);
}

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

async function resolveQuestion(element) {
  await resolveMetaMap(element);
  await resolveAssetsMap(element);
  const question = element.data.question;
  if (!question || question.length < 1) return Promise.resolve(element);
  return Promise.each(question, resolveAsset).then(() => element);
}

function resolveAsset(element) {
  return isPrimitive(element)
    ? resolvePrimitive(element)
    : resolveComposite(element);
}

async function resolvePrimitive(primitive) {
  if (!isPrimitive(primitive)) throw new Error('Invalid primitive');
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
  return Promise.each(values(composite.data.embeds), resolvePrimitive).then(
    () => composite,
  );
}

export { resolveStatics };
