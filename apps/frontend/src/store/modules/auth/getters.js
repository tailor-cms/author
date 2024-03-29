import get from 'lodash/get';
import { role } from 'tailor-config-shared';

export const isAdmin = ({ user }) => get(user, 'role') === role.user.ADMIN;

export const isOidcActive = ({ authData }) => authData?.strategy === 'oidc';
