import path from 'node:path';
import fecha from 'fecha';
import Storage from '../../repository/storage.js';
import StorageService from './storage.service.js';

const { getFileUrl } = Storage;

function getUrl(req, res) {
  const {
    query: { key },
  } = req;
  return getFileUrl(key).then((url) => res.json({ url }));
}

async function upload({ file, body, user, repository }, res) {
  const { name } = path.parse(file.originalname);
  const { id: repositoryId } = repository;
  if (body.unpack) {
    const timestamp = fecha.format(new Date(), 'YYYY-MM-DDTHH:mm:ss');
    const root = `${timestamp}__${user.id}__${name}`;
    const assets = await StorageService.uploadArchiveContent(
      repositoryId,
      file,
      root,
    );
    return res.json({ root, assets });
  }
  const asset = await StorageService.uploadFile(repositoryId, file, name);
  return res.json(asset);
}

export default {
  getUrl,
  upload,
};
