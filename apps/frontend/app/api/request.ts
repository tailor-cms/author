import axios, { Axios } from 'axios';

const buildFullPath = (base: string, url: string): string =>
  base.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '');

declare module 'axios' {
  interface Axios {
    submitForm(url: string, fields: any, options?: any): Promise<void>;
    base: AxiosInstance;
  }
}

Axios.prototype.submitForm = function (
  url: string,
  fields: Record<string, any> = {},
  options?: Record<string, any>,
): Promise<void> {
  const action = buildFullPath(config.baseURL, url);
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

const isAuthError = (err: any) => [401, 403].includes(err.response?.status);

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (isAuthError(err)) {
      const isAuthenticated = useCookie('is-authenticated');
      isAuthenticated.value = 'false';
      const authRoute = '/auth';
      if (window.location.pathname === authRoute) return;
      if (import.meta.server) return navigateTo(authRoute);
      return window.location.replace(authRoute);
    }
    throw err;
  },
);

export default client;

const submitForm = (
  action: string,
  fields: Record<string, any> = {},
  options: Record<string, any> = {},
) => {
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
};
