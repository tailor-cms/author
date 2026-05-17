import Promise from 'bluebird';
import type { User } from './user.model.js';

// update IF the password column actually changed
// bulk-hash all rows on bulk insert (used by seed).
function add(User: any, Hooks: any) {
  User.addHook(Hooks.beforeCreate, (user: User) => user.encryptPassword());
  User.addHook(Hooks.beforeUpdate, (user: User) =>
    user.changed('password') ? user.encryptPassword() : Promise.resolve(),
  );
  User.addHook(Hooks.beforeBulkCreate, (users: User[]) =>
    Promise.all(users.map((user) => user.encryptPassword())),
  );
}

export default { add };
