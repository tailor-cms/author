import { addItem, ENTITY, toCollection } from './helpers';
import { expect, test } from '@playwright/test';
import { CreateItemDialog } from '../../../pom/repository/collection/CreateItemDialog';
import SeedClient from '../../../api/SeedClient';

import type { CollectionView } from '../../../pom/repository/collection/CollectionView';

test.describe('Collection - item creation', () => {
  let collection: CollectionView;

  test.beforeEach(async ({ page }) => {
    ({ collection } = await toCollection(page));
  });

  test.afterAll(async () => {
    await SeedClient.resetDatabase();
  });

  test('shows an empty-state prompt before the first item', async () => {
    await expect(collection.emptyAlert).toBeVisible();
  });

  test('creates an item for every entity and lists it under that entity', async () => {
    await addItem(collection, ENTITY.AUTHOR, 'Jane Doe');
    await addItem(collection, ENTITY.TAG, 'history');
    await addItem(collection, ENTITY.ARTICLE, 'The Origins of Pizza');

    await collection.entityFilter.select(ENTITY.ARTICLE.label);
    expect(await collection.titles()).toEqual(['The Origins of Pizza']);

    await collection.entityFilter.select(ENTITY.AUTHOR.label);
    expect(await collection.titles()).toEqual(['Jane Doe']);

    await collection.entityFilter.select(ENTITY.TAG.label);
    expect(await collection.titles()).toEqual(['history']);
  });

  test('opens a created item in the editor with all its content fields', async () => {
    const editor = await collection.createItem(ENTITY.ARTICLE, 'Rich Article');
    await expect(editor.richText('description')).toBeVisible(); // rich-text meta
    await expect(editor.field('thumbnail')).toBeVisible(); // file meta
    await expect(editor.contentElement('body').el).toBeVisible(); // html element
  });

  test('locks the item type to the active entity', async ({ page }) => {
    await collection.entityFilter.select(ENTITY.AUTHOR.label);
    await collection.createBtn.click();
    const dialog = new CreateItemDialog(page);
    await dialog.expectTypeLocked();
    await expect(dialog.typeSelect).toContainText(ENTITY.AUTHOR.label);
  });

  test('persists a created item across reload', async ({ page }) => {
    await collection.createItem(ENTITY.TAG, 'naples');
    await collection.goto();
    await page.reload({ waitUntil: 'networkidle' });
    await collection.entityFilter.select(ENTITY.TAG.label);
    expect(await collection.titles()).toEqual(['naples']);
  });
});
