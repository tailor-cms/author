import { expect, test } from '@playwright/test';

import SeedClient from '../../../api/SeedClient';
import { addFirstItem, ENTITY, toCollection } from './helpers';
import type { CollectionView } from '../../../pom/repository/collection/CollectionView';

// Wide viewport so the editor's right sidebar docks beside the card instead of
// overlaying it (its resize handle would otherwise intercept clicks).
test.use({ viewport: { width: 1920, height: 1080 } });

test.describe('Collection - item metadata editing', () => {
  let collection: CollectionView;

  test.beforeEach(async ({ page }) => {
    ({ collection } = await toCollection(page));
  });

  test.afterAll(async () => {
    await SeedClient.resetDatabase();
  });

  test('updates an item title inline and persists it', async ({ page }) => {
    const editor = await collection.createFirstItem(ENTITY.AUTHOR, 'Jane');
    await editor.fillText(ENTITY.AUTHOR.titleLabel, 'Jane Doe');
    await editor.expectDirty();
    await editor.save();

    await collection.goto();
    await collection.entityFilter.select(ENTITY.AUTHOR.label);
    expect(await collection.titles()).toEqual(['Jane Doe']);

    // Survives a reload.
    await page.reload({ waitUntil: 'networkidle' });
    await collection.entityFilter.select(ENTITY.AUTHOR.label);
    expect(await collection.titles()).toEqual(['Jane Doe']);
  });

  test('discards pending edits on cancel', async () => {
    const editor = await collection.createFirstItem(ENTITY.AUTHOR, 'Original');

    await editor.fillText(ENTITY.AUTHOR.titleLabel, 'Changed');
    await editor.expectDirty();
    await editor.cancel();
    await editor.expectPristine();

    // The discarded value was never persisted.
    await collection.goto();
    await collection.entityFilter.select(ENTITY.AUTHOR.label);
    expect(await collection.titles()).toEqual(['Original']);
  });

  test('deletes an item', async () => {
    await addFirstItem(collection, ENTITY.TAG, 'obsolete');
    await collection.entityFilter.select(ENTITY.TAG.label);
    const item = await collection.getItemByName('obsolete');
    await item.remove();
    await expect(collection.emptyAlert).toBeVisible();
  });
});
