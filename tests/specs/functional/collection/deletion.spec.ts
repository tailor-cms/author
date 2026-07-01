import { addItem, ENTITY, fillArticleInputs, toCollection } from './helpers';
import { expect, test } from '@playwright/test';
import SeedClient from '../../../api/SeedClient';

test.use({ viewport: { width: 1920, height: 1080 } });

test.describe('Collection referential integrity', () => {
  test.afterAll(async () => {
    await SeedClient.resetDatabase();
  });

  test('blocks deleting a record behind a required relationship (RESTRICT)', async ({
    page,
  }) => {
    const { collection } = await toCollection(page);
    await addItem(collection, ENTITY.AUTHOR, 'Mary Shelley');
    const editor = await fillArticleInputs(collection, 'Frankenstein', {
      author: 'Mary Shelley',
    });
    await editor.save();
    await collection.goto();
    await collection.entityFilter.select(ENTITY.AUTHOR.label);
    const author = await collection.getItemByName('Mary Shelley');
    const dialog = await author.openRemoveDialog();
    await expect(dialog).toContainText(/can't delete/i);
    await expect(dialog).toContainText(/article/i);
    await dialog.getByRole('button', { name: 'Close' }).click();
  });

  test('unlinks dependents for an optional relationship (SET_NULL)', async ({
    page,
  }) => {
    const { collection } = await toCollection(page);
    await addItem(collection, ENTITY.AUTHOR, 'Author A');
    await addItem(collection, ENTITY.TAG, 'fiction');
    const editor = await fillArticleInputs(collection, 'Tagged Article', {
      author: 'Author A',
      tag: 'fiction',
    });
    await editor.save();

    await collection.goto();
    await collection.entityFilter.select(ENTITY.TAG.label);
    const tag = await collection.getItemByName('fiction');
    const dialog = await tag.openRemoveDialog();
    await expect(dialog).toContainText(/will be unlinked/i);
    await tag.confirmRemoval();

    // The tag is gone; the article survives with its Tags now empty.
    await collection.goto();
    await collection.entityFilter.select(ENTITY.TAG.label);
    expect(await collection.titles()).not.toContain('fiction');
    await collection.entityFilter.select(ENTITY.ARTICLE.label);
    const article = await collection.getItemByName('Tagged Article');
    const reopened = await article.open();
    await expect(reopened.relationship('Tags').el).not.toContainText('fiction');
  });

  test('deletes dependents for a CASCADE relationship', async ({ page }) => {
    const { collection } = await toCollection(page);
    await addItem(collection, ENTITY.AUTHOR, 'Author B');
    await addItem(collection, ENTITY.CATEGORY, 'Science');
    const editor = await fillArticleInputs(collection, 'Cosmos', {
      author: 'Author B',
      category: 'Science',
    });
    await editor.save();
    // Deleting the category cascades to the article, but not the author.
    await collection.goto();
    await collection.entityFilter.select(ENTITY.CATEGORY.label);
    const category = await collection.getItemByName('Science');
    const dialog = await category.openRemoveDialog();
    await expect(dialog).toContainText(/will also be deleted/i);
    await category.confirmRemoval();
    // The article filed under the deleted category is gone too.
    await collection.goto();
    await collection.entityFilter.select(ENTITY.ARTICLE.label);
    expect(await collection.titles()).not.toContain('Cosmos');
    // ...but an unrelated record (the author) is untouched.
    await collection.entityFilter.select(ENTITY.AUTHOR.label);
    expect(await collection.titles()).toContain('Author B');
  });
});
