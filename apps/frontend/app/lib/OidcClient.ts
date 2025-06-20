import join from 'url-join';

export default class OidcClient {
  baseUrl;

  constructor({ baseUrl }: { baseUrl: string }) {
    this.baseUrl = join(baseUrl, 'oidc');
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
}
