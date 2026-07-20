import type { Page } from '@playwright/test';
import {
  CollectionView,
  type Entity,
} from '../../../pom/repository/collection/CollectionView';
import type {
  CollectionItemEditor,
} from '../../../pom/repository/collection/CollectionItemEditor';
import { collectionSeed, toEmptyCollection } from '../../../helpers/seed';
import SeedClient from '../../../api/SeedClient';

// The entities of the bundled ARTICLE collection schema.
export const ENTITY = collectionSeed.entities;

// Reset, create an empty ARTICLE collection repository and land on its
// structure page. Returns the repository plus a ready CollectionView.
export async function toCollection(page: Page, name?: string) {
  await SeedClient.resetDatabase();
  const repository = await toEmptyCollection(page, name);
  const collection = new CollectionView(page, repository.id);
  return { repository, collection };
}

// Create the first item in an empty collection (empty-state flow), then return
// to the list. For arrange steps where the editor isn't the subject.
export async function addFirstItem(
  collection: CollectionView,
  entity: Entity,
  title: string,
) {
  await collection.createFirstItem(entity, title);
  await collection.goto();
}

// Add an item to an already-populated collection, then return to the list.
export async function addItem(
  collection: CollectionView,
  entity: Entity,
  title: string,
) {
  await collection.createItem(entity, title);
  await collection.goto();
}

// Fill an article editor's required inputs plus the given relationship links.
export async function fillArticleInputs(
  editor: CollectionItemEditor,
  links: { author?: string; tag?: string; category?: string } = {},
) {
  await editor.fillRichText('description', 'Body required to save.');
  await editor.contentElement('body').fill('Some content.');
  if (links.author) {
    await editor.relationship('Author').select(links.author);
    await editor.relationship('Author').expectSelected(links.author);
  }
  if (links.tag) {
    await editor.relationship('Tags').select(links.tag);
    await editor.relationship('Tags').expectSelected(links.tag);
  }
  if (links.category) {
    await editor.relationship('Category').select(links.category);
    await editor.relationship('Category').expectSelected(links.category);
  }
}
