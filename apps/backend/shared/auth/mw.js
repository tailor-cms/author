import get from 'lodash/get.js';
import roleConfig from '@tailor-cms/interfaces/role';
import { StatusCodes } from 'http-status-codes';
import { createError } from '../error/helpers.js';
import { auth as authConfig } from '#config';

const { user: role } = roleConfig;

function authorize(...allowed) {
  allowed.push(role.ADMIN);
  return (req, res, next) => {
    const { user } = req;
    if (user && allowed.includes(user.role)) return next();
    return createError(StatusCodes.UNAUTHORIZED, 'Access restricted');
  };
}

function extractAuthData(req, res, next) {
  const path = authConfig.jwt.cookie.signed ? 'signedCookies' : 'cookies';
  req.authData = get(req[path], 'auth', null);
  return next();
}

export { authorize, extractAuthData };
