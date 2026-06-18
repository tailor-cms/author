import { expect, test } from '@playwright/test';
import { addItem, ENTITY, toCollection } from './helpers';
import SeedClient from '../../../api/SeedClient';

import type { CollectionView } from '../../../pom/repository/collection/CollectionView';

test.describe('Collection - filtering, search & sort', () => {
  let collection: CollectionView;

  test.beforeEach(async ({ page }) => {
    ({ collection } = await toCollection(page));
  });

  test.afterAll(async () => {
    await SeedClient.resetDatabase();
  });

  test('scopes the list to the active entity', async () => {
    await addItem(collection, ENTITY.ARTICLE, 'Deep Dish');
    await addItem(collection, ENTITY.AUTHOR, 'Mario Rossi');

    // Articles is the default selection.
    await collection.entityFilter.expectActive(ENTITY.ARTICLE.label);
    expect(await collection.titles()).toEqual(['Deep Dish']);

    await collection.entityFilter.select(ENTITY.AUTHOR.label);
    expect(await collection.titles()).toEqual(['Mario Rossi']);

    await collection.entityFilter.select(ENTITY.TAG.label);
    expect(await collection.titles()).toEqual([]);
  });

  test('searches within the active entity', async () => {
    await addItem(collection, ENTITY.ARTICLE, 'Pizza');
    await addItem(collection, ENTITY.ARTICLE, 'Pasta');

    await collection.entityFilter.select(ENTITY.ARTICLE.label);
    await collection.search('Pizza');
    expect(await collection.titles()).toEqual(['Pizza']);

    await collection.search('zzz');
    await expect(collection.noMatchesAlert).toBeVisible();
  });

  test('sorts items by name', async () => {
    // Created Apple-then-Banana, so the default "Newest first" yields Banana
    // first; sorting by name must reorder them.
    await addItem(collection, ENTITY.ARTICLE, 'Apple');
    await addItem(collection, ENTITY.ARTICLE, 'Banana');
    await collection.entityFilter.select(ENTITY.ARTICLE.label);
    expect(await collection.titles()).toEqual(['Banana', 'Apple']);
    await collection.sortBy('Name (A');
    expect(await collection.titles()).toEqual(['Apple', 'Banana']);
    await collection.sortBy('Name (Z');
    expect(await collection.titles()).toEqual(['Banana', 'Apple']);
  });
});
