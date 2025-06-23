import { find } from 'lodash-es';
import seed from 'tailor-seed/user.json' assert { type: 'json' };

const ADMIN_TEST_USER = find(seed, { email: 'admin@gostudion.com' });
if (!ADMIN_TEST_USER) throw new Error('Admin test user not found');

const DEFAULT_TEST_USER = find(seed, { email: 'user@gostudion.com' });
if (!DEFAULT_TEST_USER) throw new Error('Default test user not found');

const COLLAB_TEST_USER = find(seed, { email: 'collaborator@gostudion.com' });
if (!COLLAB_TEST_USER) throw new Error('Collaborator test user not found');

export { ADMIN_TEST_USER, DEFAULT_TEST_USER, COLLAB_TEST_USER };
