// Wire shapes for the virtual-folder endpoints. Folders are derived from
// `meta.folder` (no folder model).
import { Int, dataEnvelope } from '#shared/request/schemas.ts';
import { FolderPath } from './entity.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

// Flat list of every distinct folder path in use across the repository's
// assets. The client builds the navigable tree from these prefixes.
export const UniqueFolders = z
  .array(z.string())
  .describe('Distinct folder paths in use (sorted).');

export type UniqueFolders = z.infer<typeof UniqueFolders>;

export const FoldersResponse = dataEnvelope(UniqueFolders)
  .describe('Folder paths derived from `meta.folder`.');

// Bulk move: reassign assets to a folder (empty string moves them to root).
export const MoveInput = z
  .object({
    assetIds: z
      .array(Int())
      .min(1)
      .describe('Numeric ids of the assets to move (at least one).'),
    folder: FolderPath.describe(oneLine`
      Destination folder path; empty string moves the assets
      to the repository root.
    `),
  })
  .describe('Selector and destination for a bulk asset move.');

export type MoveInput = z.infer<typeof MoveInput>;

export const MoveResult = z
  .object({
    movedIds: z
      .array(Int())
      .describe('Subset of requested ids that were moved.'),
  })
  .meta({ id: 'AssetMoveResult' })
  .describe('Assets relocated by a bulk move.');

export type MoveResult = z.infer<typeof MoveResult>;
