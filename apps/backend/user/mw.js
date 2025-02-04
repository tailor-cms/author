import crypto from 'crypto';
import { requestLimiter } from '#shared/request/mw.js';

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

const loginRequestLimiter = requestLimiter({
  windowMs: ONE_HOUR_IN_MS,
  limit: 15,
  keyGenerator: (req) => req.userKey,
});

function setLoginLimitKey(req, res, next) {
  const key = [req.ip, req.body.email].join(':');
  req.userKey = crypto.createHash('sha256').update(key).digest('base64');
  return next();
}

function resetLoginAttempts(req, res, next) {
  return loginRequestLimiter.resetKey(req.userKey).then(() => next());
}

export { loginRequestLimiter, setLoginLimitKey, resetLoginAttempts };
