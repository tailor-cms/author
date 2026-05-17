// Barrel for the user-group module.
// Core CRUD sits flat at the top level; member management is grouped
// under members/ with entity-prefixed filenames so related operations
// cluster alphabetically.

// UserGroup CRUD
export { default as list } from './list.action.ts';
export { default as create } from './create.action.ts';
export { default as get } from './get.action.ts';
export { default as patch } from './patch.action.ts';
export { default as remove } from './remove.action.ts';

// Members
export { default as getUsers } from './members/user-list.action.ts';
export { default as upsertUser } from './members/user-upsert.action.ts';
export { default as removeUser } from './members/user-remove.action.ts';
