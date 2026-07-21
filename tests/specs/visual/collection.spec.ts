import { test } from '@playwright/test';

import {
  addFirstItem,
  addItem,
  ENTITY,
  toCollection,
} from '../functional/collection/helpers';
import { percySnapshot } from '../../utils/percy';

const COLLECTION_NAME = 'Visual test collection';

// Wide viewport so the editor's right sidebar docks beside the card.
test.use({ viewport: { width: 1920, height: 1080 } });

test.describe('Collection visuals', () => {
  test('collection structure page', async ({ page }) => {
    const { collection } = await toCollection(page, COLLECTION_NAME);
    await addFirstItem(collection, ENTITY.AUTHOR, 'Jane Doe');
    await addItem(collection, ENTITY.ARTICLE, 'The Origins of Pizza');
    await collection.entityFilter.select(ENTITY.ARTICLE.label);
    await collection.getItemByName('The Origins of Pizza');
    await percySnapshot(page, 'Collection - list view');
  });

  test('collection item editor', async ({ page }) => {
    const { collection } = await toCollection(page, COLLECTION_NAME);
    const editor = await collection.createFirstItem(
      ENTITY.ARTICLE,
      'The Origins of Pizza',
    );
    await editor.fillRichText('description', 'A short history of pizza.');
    await percySnapshot(page, 'Collection - entity editor');
  });
});
