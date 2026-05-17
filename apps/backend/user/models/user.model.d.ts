import type {
  BelongsToManyGetAssociationsMixin,
  HasManyGetAssociationsMixin,
  Model,
  ModelStatic,
} from 'sequelize';
import type { User as UserAttrs } from '@tailor-cms/interfaces/user';
import type { UserGroup } from '@tailor-cms/interfaces/user-group';

// Server-side attribute set: extends the FE-facing `UserAttrs`
// (deliberately password-free in `@tailor-cms/interfaces`)
interface UserServerAttrs extends UserAttrs {
  password?: string;
}

// Profile shape returned by the `profile` virtual: a curated subset of
// User attributes safe to send to the client.
export interface UserProfile {
  id: number;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  label: string;
  imgUrl: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Subset of Sequelize-generated association mixins used by the slice.
interface UserAssociations {
  setUserGroups: (groups: UserGroup[] | number[]) => Promise<void>;
  getUserGroups: BelongsToManyGetAssociationsMixin<UserGroup>;
  getRepositories: BelongsToManyGetAssociationsMixin<unknown>;
  getAssignedActivities: HasManyGetAssociationsMixin<unknown>;
}

// Group-with-role payload returned from `getAccessibleUserGroups`. For
// system admins this is every UserGroup; for non-admins it's the user's
// own membership rows projected onto `{ id, name, role }`.
export interface AccessibleUserGroup {
  id: number;
  name: string;
  role: string;
}

// Sequelize instance type for a User row. Composes the canonical
// attributes (from @tailor-cms/interfaces) with the Sequelize Model API,
// the virtual `profile`, and the custom instance methods declared on
// the model class. The `Model<UserServerAttrs>` parameterization is
// what makes `user.update({ password })` type-check.
export type User = UserAttrs &
  Model<UserServerAttrs> &
  UserAssociations & {
    password: string;
    profile: UserProfile;
    // Eager-loaded `belongsToMany(UserGroup)` rows. Only present when the
    // row was fetched with `include: [{ model: UserGroup }]` (or via the
    // `withGroups` scope). Accessors should null-guard accordingly.
    userGroups?: UserGroup[];
    isAdmin(): boolean;
    authenticate(password: string): Promise<User | false>;
    encrypt(value: string): Promise<string>;
    encryptPassword(): Promise<string | false>;
    createToken(options?: { audience?: string; expiresIn?: string }): string;
    sendResetToken(): void;
    getTokenSecret(audience: string): string;
    getAccessibleUserGroups(): Promise<AccessibleUserGroup[]>;
  };

// Sequelize static type for the User model. Extends the standard
// ModelStatic surface (findByPk, create, update, ...) with custom
// static methods declared on the model class.
interface UserModel extends ModelStatic<User> {
  invite(
    user: Partial<UserServerAttrs>,
    opts?: { skipInvite?: boolean },
  ): Promise<User>;
  inviteOrUpdate(
    data: Partial<UserServerAttrs>,
    opts?: { skipInvite?: boolean },
  ): Promise<User>;
  sendInvitation(user: User): void;
}

declare const User: UserModel;
export default User;
