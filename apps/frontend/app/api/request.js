import axios, { Axios } from 'axios';
import buildFullPath from 'axios/unsafe/core/buildFullPath';

Axios.prototype.submitForm = function (url, fields, options) {
  const action = buildFullPath(this.defaults.baseURL, url);
  return Promise.resolve(submitForm(action, fields, options));
};

const isAuthError = (err) => err.response?.status === 401;

// Response interceptor that bumps unauthenticated users back to /auth.
// Exported so other axios instances can apply the same behaviour without
// duplicating the logic.
export function applyAuthInterceptor(target) {
  target.interceptors.response.use(
    (res) => res,
    (err) => {
      if (isAuthError(err)) {
        // eslint-disable-next-line no-undef
        const isAuthenticated = useCookie('is-authenticated');
        isAuthenticated.value = false;
        const authRoute = '/auth';
        if (window.location.pathname === authRoute) return;
        // eslint-disable-next-line no-undef
        if (import.meta.server) return navigateTo(authRoute);
        return window.location.replace(authRoute);
      }
      throw err;
    },
  );
}

// Adapts axios upload-progress events into a 0..100 percent callback, the
// single progress contract shared by every upload caller. Returns undefined
// (which axios ignores) when no callback is given, so it can be passed through
// unconditionally.
export function uploadProgress(onProgress) {
  if (!onProgress) return undefined;
  return ({ loaded, total }) => {
    if (total) onProgress(Math.round((loaded / total) * 100));
  };
}

const config = {
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
};

// Instance of axios to be used for all API requests.
const client = axios.create(config);

// Attach additional instance without interceptors
Object.defineProperty(client, 'base', {
  get() {
    if (!this.base_) this.base_ = axios.create(config);
    return this.base_;
  },
});

applyAuthInterceptor(client);

export default client;

function submitForm(action, fields = {}, options) {
  const form = document.createElement('form');
  Object.assign(form, { method: 'POST', target: 'blank', action }, options);
  Object.entries(fields).forEach(([name, attrs]) => {
    const input = document.createElement('input');
    Object.assign(input, { name }, attrs);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  form.remove();
}
