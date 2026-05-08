import { expect, test } from '@playwright/test';

import AssetClient from '../../../api/AssetClient';
import SeedClient from '../../../api/SeedClient';
import { AUDIO, DOCUMENT, IMAGE, VIDEO } from '../../../fixtures/assets';
import { createRepository } from './helpers';

test.describe('Asset API', () => {
  test('can upload a file and list it', async () => {
    const repositoryId = await createRepository();
    const upload = await AssetClient.uploadFile(repositoryId, IMAGE.path);
    expect(upload.status).toBe(200);
    const list = await AssetClient.list(repositoryId);
    expect(list.status).toBe(200);
    expect(list.data.items.length).toBe(1);
    expect(list.data.items[0].type).toBe('IMAGE');
    expect(list.data.items[0].name).toContain(IMAGE.name);
  });

  test('can add a link and list it', async () => {
    const repositoryId = await createRepository();
    const add = await AssetClient.addLink(repositoryId, 'https://example.com');
    expect(add.status).toBe(200);
    const list = await AssetClient.list(repositoryId);
    expect(list.data.items.length).toBe(1);
    expect(list.data.items[0].type).toBe('LINK');
  });

  test('can update asset meta', async () => {
    const repositoryId = await createRepository();
    await AssetClient.uploadFile(repositoryId, IMAGE.path);
    const { data: { items } } = await AssetClient.list(repositoryId);
    const update = await AssetClient.updateMeta(repositoryId, items[0].id, {
      description: 'Test description',
      tags: ['test', 'image'],
    });
    expect(update.status).toBe(200);
    expect(update.data.meta.description).toBe('Test description');
    expect(update.data.meta.tags).toContain('test');
  });

  test('can get download URL for file asset', async () => {
    const repositoryId = await createRepository();
    await AssetClient.uploadFile(repositoryId, IMAGE.path);
    const { data: { items } } = await AssetClient.list(repositoryId);
    const download = await AssetClient.getDownloadUrl(repositoryId, items[0].id);
    expect(download.status).toBe(200);
    expect(download.data.url).toBeTruthy();
  });

  test('can delete a single asset', async () => {
    const repositoryId = await createRepository();
    await AssetClient.uploadFile(repositoryId, IMAGE.path);
    const { data: { items } } = await AssetClient.list(repositoryId);
    const del = await AssetClient.remove(repositoryId, items[0].id);
    expect(del.status).toBe(200);
    const listAfter = await AssetClient.list(repositoryId);
    expect(listAfter.data.items.length).toBe(0);
  });

  test('can bulk delete assets', async () => {
    const repositoryId = await createRepository();
    await AssetClient.uploadFile(repositoryId, IMAGE.path);
    await AssetClient.uploadFile(repositoryId, DOCUMENT.path);
    const { data: { items } } = await AssetClient.list(repositoryId);
    expect(items.length).toBe(2);
    const ids = items.map((a: any) => a.id);
    const delRequest = await AssetClient.bulkRemove(repositoryId, ids);
    expect(delRequest.status).toBe(200);
    const listAfter = await AssetClient.list(repositoryId);
    expect(listAfter.data.items.length).toBe(0);
  });

  test('can filter assets by type', async () => {
    const repositoryId = await createRepository();
    await AssetClient.uploadFile(repositoryId, IMAGE.path);
    await AssetClient.uploadFile(repositoryId, DOCUMENT.path);
    const images = await AssetClient.list(repositoryId, { type: 'IMAGE' });
    expect(images.data.items.length).toBe(1);
    expect(images.data.items[0].type).toBe('IMAGE');
    const docs = await AssetClient.list(repositoryId, { type: 'DOCUMENT' });
    expect(docs.data.items.length).toBe(1);
    expect(docs.data.items[0].type).toBe('DOCUMENT');
  });

  test('can search assets by name', async () => {
    const repositoryId = await createRepository();
    await AssetClient.uploadFile(repositoryId, IMAGE.path);
    await AssetClient.uploadFile(repositoryId, DOCUMENT.path);
    const results = await AssetClient.list(repositoryId, { search: IMAGE.name });
    expect(results.data.items.length).toBe(1);
    expect(results.data.items[0].name).toContain(IMAGE.name);
  });

  test('upload resolves correct asset type for each file', async () => {
    const repositoryId = await createRepository();
    for (const fp of [IMAGE.path, DOCUMENT.path, VIDEO.path, AUDIO.path]) {
      await AssetClient.uploadFile(repositoryId, fp);
    }
    const { data: { items } } = await AssetClient.list(repositoryId);
    const types = items.map((a: any) => a.type).sort();
    expect(types).toEqual(['AUDIO', 'DOCUMENT', 'IMAGE', 'VIDEO']);
  });

  test('link import extracts OG metadata', async () => {
    const repositoryId = await createRepository();
    const add = await AssetClient.addLink(
      repositoryId, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    );
    expect(add.status).toBe(200);
    expect(add.data.type).toBe('LINK');
    expect(add.data.meta.provider).toBe('youtube');
    expect(add.data.meta.url).toContain('youtube.com');
  });
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
