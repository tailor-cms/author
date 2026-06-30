import type { Page } from '@playwright/test';
import {
  CollectionView,
  type Entity,
} from '../../../pom/repository/collection/CollectionView';
import { collectionSeed, toEmptyCollection } from '../../../helpers/seed';
import SeedClient from '../../../api/SeedClient';

// The entities of the bundled ARTICLE collection schema.
export const ENTITY = collectionSeed.entities;

// Reset, create an empty ARTICLE collection repository and land on its
// structure page. Returns the repository plus a ready CollectionView.
export async function toCollection(page: Page) {
  await SeedClient.resetDatabase();
  const repository = await toEmptyCollection(page);
  const collection = new CollectionView(page, repository.id);
  return { repository, collection };
}

// Create an item and return to the structure page, for populating the list (or
// linkable siblings) when the editor itself is not under test.
export async function addItem(
  collection: CollectionView,
  entity: Entity,
  title: string,
) {
  await collection.createItem(entity, title);
  await collection.goto();
}

// Create an article and fill its required content
export async function createArticle(collection: CollectionView, title: string) {
  const editor = await collection.createItem(ENTITY.ARTICLE, title);
  await editor.fillRichText('description', 'Body required to save.');
  await editor.contentElement('body').fill('Some content.');
  return editor;
}
