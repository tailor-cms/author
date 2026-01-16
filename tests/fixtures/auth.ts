import { find } from 'lodash-es';
import seed from 'tailor-seed/user.json' assert { type: 'json' };

const adminTestUser = find(seed, { email: 'admin@gostudion.com' });
if (!adminTestUser) throw new Error('Admin test user not found');

const defaultTestUser = find(seed, { email: 'user@gostudion.com' });
if (!defaultTestUser) throw new Error('Default test user not found');

const collabTestUser = find(seed, { email: 'collaborator@gostudion.com' });
if (!collabTestUser) throw new Error('Collaborator test user not found');

export const ADMIN_TEST_USER = adminTestUser;
export const DEFAULT_TEST_USER = defaultTestUser;
export const COLLAB_TEST_USER = collabTestUser;
