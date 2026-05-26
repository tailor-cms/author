export type CollectionSortOrder = 'asc' | 'desc';
export type CollectionSortKey = 'data.name' | 'createdAt';

export interface CollectionSort {
  key: CollectionSortKey;
  order: CollectionSortOrder;
}

export interface CollectionSortOption extends CollectionSort {
  title: string;
}

export const COLLECTION_SORT_OPTIONS: CollectionSortOption[] = [
  { key: 'createdAt', order: 'desc', title: 'Newest first' },
  { key: 'createdAt', order: 'asc', title: 'Oldest first' },
  { key: 'data.name', order: 'asc', title: 'Name (A–Z)' },
  { key: 'data.name', order: 'desc', title: 'Name (Z–A)' },
];

export const DEFAULT_COLLECTION_SORT: CollectionSort = {
  key: 'createdAt',
  order: 'desc',
};
