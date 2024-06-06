import urlJoin from 'url-join';

import { feed as api } from '@/api';
import SSEConnection from './SSEConnection';

const noop = () => {};

class RepositoryFeed {
  baseUrl: string;
  repositoryId: number | null = null;
  connection: SSEConnection | null = null;

  constructor({ baseUrl }: { baseUrl: string }) {
    this.baseUrl = baseUrl;
  }

  get connected() {
    return Boolean(this.connection);
  }

  connect = (repositoryId: number, cb: any = noop) => {
    if (this.connected && this.repositoryId === repositoryId) return this;
    if (this.connected) this.disconnect();
    const url = this.getRepositoryUrl(repositoryId);
    this.connection = new SSEConnection(url);
    this.connection.once('open', () => cb(this.connection));
    this.repositoryId = repositoryId;
    return this;
  };

  getRepositoryUrl(repositoryId: any) {
    return urlJoin(this.baseUrl, api.urls.subscribe(repositoryId));
  }

  disconnect() {
    this.connection?.close();
    this.connection = null;
    this.repositoryId = null;
    return this;
  }

  subscribe(event: string, listener: any) {
    this.connection?.on(event, listener);
    return this;
  }

  unsubscribe(event: string, listener: any) {
    this.connection?.off(event, listener);
    return this;
  }
}

export default new RepositoryFeed({
  baseUrl: '/api',
});
