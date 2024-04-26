import axios, { Axios } from 'axios';
import buildFullPath from 'axios/unsafe/core/buildFullPath';

Axios.prototype.submitForm = function (url, fields, options) {
  const action = buildFullPath(this.defaults.baseURL, url);
  return Promise.resolve(submitForm(action, fields, options));
};

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

const isAuthError = (err) => [401, 403].includes(err.response?.status);

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (isAuthError(err)) {
      const isAuthenticated = useCookie('is-authenticated');
      isAuthenticated.value = false;
      const authRoute = '/auth';
      if (window.location.pathname === authRoute) return;
      if (process.server) return navigateTo(authRoute);
      return window.location.replace(authRoute);
    }
    throw err;
  },
);

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
