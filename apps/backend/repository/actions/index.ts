// Barrel export for action modules.
//
// Core CRUD + ops on the Repository entity sit flat at the top level;
// peripheral concerns are grouped into sub-folders by domain
// (members, user-groups, tags, transfer, references). Within each
// sub-folder action files are entity-prefixed (e.g. `user-list.action.ts`,
// `group-add.action.ts`) so a filename alone names the operation and the
// alphabetical order clusters related actions.

// Core: Repository CRUD + ops
export { default as list } from './list.action.ts';
export { default as create } from './create.action.ts';
export { default as get } from './get.action.ts';
export { default as patch } from './patch.action.ts';
export { default as remove } from './remove.action.ts';
export { default as pin } from './pin.action.ts';
export { default as clone } from './clone.action.ts';
export { default as publish } from './publish.action.ts';

// Repository members (users with access)
export { default as getUsers } from './members/user-list.action.ts';
export { default as upsertUser } from './members/user-upsert.action.ts';
export { default as removeUser } from './members/user-remove.action.ts';

// Repository access via user groups
export { default as addUserGroup } from './user-groups/group-add.action.ts';
export { default as removeUserGroup } from './user-groups/group-remove.action.ts';

// Tags
export { default as addTag } from './tags/tag-add.action.ts';
export { default as removeTag } from './tags/tag-remove.action.ts';

// Transfer: import + export jobs
export {
  default as importRepository,
  requireFile,
} from './transfer/import.action.ts';
export { default as initiateExportJob } from './transfer/export-initiate.action.ts';
export { default as getExportStatus } from './transfer/export-status.action.ts';
export { default as exportRepository } from './transfer/export-download.action.ts';

// Data integrity (cross-model reference checks)
export { default as validateReferences }
  from './references/reference-validate.action.ts';
export { default as cleanupInvalidReferences }
  from './references/reference-cleanup.action.ts';
