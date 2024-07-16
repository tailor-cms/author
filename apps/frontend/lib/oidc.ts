import join from 'url-join';

import { EventEmitter } from 'events';

const isProduction = process.env.NODE_ENV === 'production';
const SILENT_REFRESH_TIMEOUT = 5000;

export default class OidcClient {
  enabled;
  logoutEnabled;
  baseUrl;

  constructor({ baseUrl }: { baseUrl: string }) {
    const config = useRuntimeConfig().public;
    console.log('OidcClient constructor', config);
    this.enabled = config.oidcEnabled;
    this.logoutEnabled = config.oidcLogoutEnabled;
    this.baseUrl = join(baseUrl, 'oidc');
  }

  get silentUrl() {
    const url = new URL(this.baseUrl, window.location.href);
    url.searchParams.set('silent', 'true');
    return url.href;
  }

  get resignUrl() {
    const url = new URL(this.baseUrl, window.location.href);
    url.searchParams.set('resign', 'true');
    return url.href;
  }

  get logoutUrl() {
    const url = new URL(this.baseUrl, window.location.href);
    url.searchParams.set('action', 'logout');
    return url.href;
  }

  authenticate() {
    window.location.replace(this.baseUrl);
  }

  reauthenticate() {
    window.location.replace(this.resignUrl);
  }

  logout() {
    window.location.replace(this.logoutUrl);
  }

  slientlyRefresh() {
    return new Promise((resolve, reject) => {
      const iframe = new RefreshIframe(this.silentUrl, SILENT_REFRESH_TIMEOUT);
      iframe.on('auth:success', () => resolve('auth:success'));
      iframe.on('auth:fail', () => reject(new Error('auth:fail')));
    });
  }
}

class RefreshIframe extends EventEmitter {
  private iframe;
  private timeout;

  constructor(src: string, timeout: number) {
    super();
    this.iframe = window.document.createElement('iframe');
    Object.assign(this.iframe.style, {
      visibility: 'hidden',
      position: 'absolute',
      display: 'none',
      width: 0,
      height: 0,
    });
    this.iframe.src = src;
    this.mount();
    this.iframe.contentWindow?.addEventListener('auth:success', () =>
      this.onSuccess(),
    );
    this.iframe.contentWindow?.addEventListener('auth:fail', () =>
      this.onFail(),
    );
    if (isProduction && timeout) {
      this.timeout = setTimeout(() => this.onFail(), timeout);
    }
  }

  mount() {
    window.document.body.appendChild(this.iframe);
  }

  destroy() {
    window.document.body.removeChild(this.iframe);
    clearTimeout(this.timeout);
    this.timeout = undefined;
  }

  onSuccess() {
    this.emit('auth:success');
    this.destroy();
  }

  onFail() {
    this.emit('auth:fail');
    this.destroy();
  }
}
