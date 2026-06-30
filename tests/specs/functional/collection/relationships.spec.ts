import { addItem, ENTITY, toCollection } from './helpers';
import { expect, test } from '@playwright/test';
import SeedClient from '../../../api/SeedClient';

import type { CollectionView } from '../../../pom/repository/collection/CollectionView';

// Collection items link to sibling entities via relationships stored on the
// entry activity
test.use({ viewport: { width: 1920, height: 1080 } });

test.describe('Collection - relationships (cross-entity links)', () => {
  let collection: CollectionView;

  test.beforeEach(async ({ page }) => {
    ({ collection } = await toCollection(page));
  });

  test.afterAll(async () => {
    await SeedClient.resetDatabase();
  });

  test('links an article to an author and tags', async () => {
    await addItem(collection, ENTITY.AUTHOR, 'Jane Austen');
    await addItem(collection, ENTITY.TAG, 'classics');
    await addItem(collection, ENTITY.TAG, 'novel');

    const editor = await collection.createItem(
      ENTITY.ARTICLE,
      'Pride and Prejudice',
    );
    // Description and body are required for the article to save.
    await editor.fillRichText('description', 'A classic of English literature.');
    await editor
      .contentElement('body')
      .fill('It is a truth universally acknowledged.');

    await editor.relationship('Author').select('Jane Austen');
    await editor.relationship('Tags').select('classics');
    await editor.relationship('Tags').select('novel');
    // Selections register in the card before persisting.
    await editor.relationship('Author').expectSelected('Jane Austen');
    await editor.relationship('Tags').expectSelected('classics');
    await editor.save();
    // Reopen the item and confirm the links persisted. The entity filter resets
    // to the first entity on reload, so reselect Articles before looking it up.
    await collection.goto();
    await collection.entityFilter.select(ENTITY.ARTICLE.label);
    const item = await collection.getItemByName('Pride and Prejudice');
    const reopened = await item.open();
    await reopened.relationship('Author').expectSelected('Jane Austen');
    await reopened.relationship('Tags').expectSelected('classics');
    await reopened.relationship('Tags').expectSelected('novel');
    // The content slots persisted too (this is the only full Article round-trip).
    await expect(reopened.richText('description')).toContainText(
      'A classic of English literature.',
    );
    await expect(reopened.contentElement('body').el).toContainText(
      'It is a truth universally acknowledged.',
    );
  });

  test('blocks saving when a required relationship is empty', async () => {
    const editor = await collection.createItem(
      ENTITY.ARTICLE,
      'Orphan Article',
    );
    await editor.fillRichText('description', 'Missing its author.');
    await editor.contentElement('body').fill('Some body text.');
    await editor.clickSave();
    await editor.relationship('Author').expectError(/required/i);
    // Save was rejected, so the card stays dirty.
    await editor.expectDirty();
  });
});
