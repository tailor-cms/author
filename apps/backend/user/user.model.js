import bcrypt from 'bcryptjs';
import gravatar from 'gravatar';
import jwt from 'jsonwebtoken';
import map from 'lodash/map.js';
import { Model } from 'sequelize';
import omit from 'lodash/omit.js';
import pick from 'lodash/pick.js';
import Promise from 'bluebird';
import randomstring from 'randomstring';
import { UserRole } from '@tailor-cms/common';
import mail from '#shared/mail/index.js';
import Audience from '#shared/auth/audience.js';
import { auth as authConfig } from '#config';

const { ADMIN, COLLABORATOR, INTEGRATION, USER } = UserRole;
const gravatarConfig = { size: 130, default: 'identicon' };

class User extends Model {
  static fields({ DATE, ENUM, STRING, TEXT, UUID, UUIDV4, VIRTUAL }) {
    return {
      uid: {
        type: UUID,
        unique: true,
        allowNull: false,
        defaultValue: UUIDV4,
      },
      email: {
        type: STRING,
        set(email) {
          this.setDataValue('email', email.toLowerCase());
        },
        validate: { isEmail: true },
        unique: { msg: 'The specified email address is already in use.' },
      },
      password: {
        type: STRING,
        validate: { notEmpty: true, len: [5, 100] },
        defaultValue: () => randomstring.generate(),
      },
      role: {
        type: ENUM(ADMIN, COLLABORATOR, INTEGRATION, USER),
        defaultValue: COLLABORATOR,
      },
      firstName: {
        type: STRING,
        field: 'first_name',
        validate: { len: [2, 50] },
      },
      lastName: {
        type: STRING,
        field: 'last_name',
        validate: { len: [2, 50] },
      },
      fullName: {
        type: VIRTUAL,
        get() {
          return (
            [this.firstName, this.lastName].filter(Boolean).join(' ') || null
          );
        },
      },
      label: {
        type: VIRTUAL,
        get() {
          return this.fullName || this.email;
        },
      },
      imgUrl: {
        type: TEXT,
        field: 'img_url',
        get() {
          const imgUrl = this.getDataValue('imgUrl');
          return (
            imgUrl || gravatar.url(this.email, gravatarConfig, true /* https */)
          );
        },
      },
      profile: {
        type: VIRTUAL,
        get() {
          return pick(this, [
            'id',
            'email',
            'role',
            'firstName',
            'lastName',
            'fullName',
            'label',
            'imgUrl',
            'createdAt',
            'updatedAt',
            'deletedAt',
          ]);
        },
      },
      createdAt: {
        type: DATE,
        field: 'created_at',
      },
      updatedAt: {
        type: DATE,
        field: 'updated_at',
      },
      deletedAt: {
        type: DATE,
        field: 'deleted_at',
      },
    };
  }

  static associate({
    ActivityStatus,
    Comment,
    Repository,
    RepositoryUser,
    UserGroup,
    UserGroupMember,
  }) {
    this.hasMany(Comment, {
      foreignKey: { name: 'authorId', field: 'author_id' },
    });
    this.belongsToMany(Repository, {
      through: RepositoryUser,
      foreignKey: { name: 'userId', field: 'user_id' },
    });
    this.hasMany(UserGroupMember, {
      foreignKey: { name: 'userId', field: 'user_id' },
    });
    this.belongsToMany(UserGroup, {
      through: UserGroupMember,
      foreignKey: { name: 'userId', field: 'user_id' },
    });
    this.hasMany(ActivityStatus, {
      as: 'assignedActivities',
      foreignKey: { name: 'assigneeId', field: 'assignee_id' },
    });
  }

  static scopes({ UserGroup, UserGroupMember }) {
    return {
      defaultScope: {
        attributes: { exclude: ['password'] },
      },
      withGroups() {
        return { include: [{ model: UserGroup }, { model: UserGroupMember }] };
      },
    };
  }

  static hooks(Hooks) {
    return {
      [Hooks.beforeCreate](user) {
        return user.encryptPassword();
      },
      [Hooks.beforeUpdate](user) {
        return user.changed('password')
          ? user.encryptPassword()
          : Promise.resolve();
      },
      [Hooks.beforeBulkCreate](users) {
        const updates = [];
        users.forEach((user) => updates.push(user.encryptPassword()));
        return Promise.all(updates);
      },
    };
  }

  static options() {
    return {
      modelName: 'user',
      underscored: true,
      timestamps: true,
      paranoid: true,
      freezeTableName: true,
    };
  }

  static invite(user) {
    return this.create(user).then((user) => {
      this.sendInvitation(user);
      return user.reload();
    });
  }

  static inviteOrUpdate(data) {
    const { email } = data;
    return User.findOne({ where: { email }, paranoid: false }).then((user) => {
      if (!user) return User.invite(data);
      const payload = omit(data, ['id', 'uid']);
      map({ ...payload, deletedAt: null }, (v, k) => user.setDataValue(k, v));
      return user.save();
    });
  }

  static sendInvitation(user) {
    const token = user.createToken({
      expiresIn: '5 days',
      audience: Audience.Scope.Setup,
    });
    mail.invite(user, token);
  }

  isAdmin() {
    return this.role === ADMIN || this.role === INTEGRATION;
  }

  authenticate(password) {
    if (!this.password) return Promise.resolve(false);
    return bcrypt
      .compare(password, this.password)
      .then((match) => (match ? this : false));
  }

  encrypt(val) {
    return bcrypt.hash(val, authConfig.saltRounds);
  }

  encryptPassword() {
    if (!this.password) return Promise.resolve(false);
    return this.encrypt(this.password).then((pw) => (this.password = pw));
  }

  createToken(options = {}) {
    const payload = { id: this.id, email: this.email };
    Object.assign(options, {
      issuer: authConfig.jwt.issuer,
      audience: options.audience || Audience.Scope.Access,
    });
    return jwt.sign(payload, this.getTokenSecret(options.audience), options);
  }

  sendResetToken() {
    const token = this.createToken({
      audience: Audience.Scope.Setup,
      expiresIn: '2 days',
    });
    mail.resetPassword(this, token);
  }

  getTokenSecret(audience) {
    const { secret } = authConfig.jwt;
    if (audience === Audience.Scope.Access) return secret;
    return [secret, this.password, this.createdAt.getTime()].join('');
  }

  async getAccessibleUserGroups() {
    if (this.isAdmin()) {
      const UserGroup = this.sequelize.model('UserGroup');
      const groups = await UserGroup.findAll();
      return groups.map((group) => ({
        ...group.dataValues,
        role: UserRole.ADMIN,
      }));
    }
    return this.getUserGroups().then((groups) =>
      groups.map((group) => ({
        ...pick(group.dataValues, ['id', 'name']),
        role: group?.userGroupMember?.role,
      })),
    );
  }
}

export default User;
