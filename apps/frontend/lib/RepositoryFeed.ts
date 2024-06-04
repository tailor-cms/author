import urlJoin from 'url-join';

import { feed as api } from '@/api';
import SSEConnection from './SSEConnection';

const noop = () => {};

class RepositoryFeed {
  _connection: any;
  _repositoryId: any;

  baseUrl;

  constructor({ baseUrl }: { baseUrl: string }) {
    this.baseUrl = baseUrl;
  }

  get connected() {
    return Boolean(this._connection);
  }

  connect = (repositoryId: any, cb: any = noop) => {
    if (this.connected && this._repositoryId === repositoryId) return this;
    if (this.connected) this.disconnect();
    const url = this._buildUrl(repositoryId);
    this._connection = new SSEConnection(url);
    this._connection.once('open', () => cb(this._connection));
    this._repositoryId = repositoryId;
    return this;
  };

  _buildUrl(repositoryId: any) {
    return urlJoin(this.baseUrl, api.urls.subscribe(repositoryId));
  }

  disconnect() {
    this._connection?.close();
    this._connection = null;
    return this;
  }

  subscribe(event: string, listener: any) {
    this._connection?.on(event, listener);
    return this;
  }

  unsubscribe(event: string, listener: any) {
    this._connection?.off(event, listener);
    return this;
  }
}

export default new RepositoryFeed({
  baseUrl: '/api',
});
