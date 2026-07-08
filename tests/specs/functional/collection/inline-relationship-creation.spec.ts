import { ENTITY, fillArticleInputs, toCollection } from './helpers';
import { expect, test } from '@playwright/test';
import SeedClient from '../../../api/SeedClient';

test.use({ viewport: { width: 1920, height: 1080 } });

test.describe('Collection - inline relationship creation', () => {
  test('creates a required related record inline and links it', async ({
    page,
  }) => {
    const { collection } = await toCollection(page);
    const editor = await collection.createFirstItem(
      ENTITY.ARTICLE,
      'Animal Farm',
    );
    await fillArticleInputs(editor);
    await editor.relationship('Author').createNew('George Orwell');
    await editor.relationship('Author').expectSelected('George Orwell');
    await editor.save();

    await collection.goto();
    const article = await collection.getItemByName('Animal Farm');
    const reopened = await article.open();
    await reopened.relationship('Author').expectSelected('George Orwell');

    await collection.goto();
    await collection.entityFilter.select(ENTITY.AUTHOR.label);
    expect(await collection.titles()).toContain('George Orwell');
  });

  test.afterAll(async () => {
    await SeedClient.resetDatabase();
  });
});
