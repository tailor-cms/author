import find from 'lodash/find';
import userSeed from 'tailor-seed/user.json';

const TEST_USER = find(userSeed, { email: 'admin@gostudion.com' });
if (!TEST_USER) throw new Error('Test user not found');

export { TEST_USER };
