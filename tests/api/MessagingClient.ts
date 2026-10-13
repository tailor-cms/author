import type {
  MessagingPostIntegrationMessageReq as MessagingWebhookReq,
} from '@tailor-cms/api-client';
import { type Credentials, getApiAs, type TypedApi } from './common';

// A person in one repository's threads, acting through the API. Plays a
// teammate posting, editing or typing while the page under test watches, etc.
export default class MessagingClient {
  private readonly api: TypedApi;

  // Route params: everything happens within the one repository
  private readonly params: { repositoryId: number };

  constructor(user: Credentials, repositoryId: number) {
    this.api = getApiAs(user);
    this.params = { repositoryId };
  }

  startThread(title: string, content: string) {
    const body = { title, content };
    return this.api.messaging.createThread({ params: this.params, body });
  }

  post(threadId: number, content: string) {
    const body = { threadId, content };
    return this.api.messaging.create({ params: this.params, body });
  }

  edit(messageId: number, content: string) {
    const params = { ...this.params, messageId };
    return this.api.messaging.update({ params, body: { content } });
  }

  remove(messageId: number) {
    const params = { ...this.params, messageId };
    return this.api.messaging.delete({ params });
  }

  typing(threadId: number) {
    const body = { threadId };
    return this.api.messaging.reportTyping({ params: this.params, body });
  }

  getThread(threadId: number) {
    const params = { ...this.params, threadId };
    return this.api.messaging.getThread({ params });
  }

  deleteThread(threadId: number) {
    const params = { ...this.params, threadId };
    return this.api.messaging.deleteThread({ params });
  }

  subscribe(threadId: number, topics: string[]) {
    const params = { ...this.params, threadId };
    return this.api.messaging.setSubscriptions({ params, body: { topics } });
  }

  registerIntegration(key: string, name: string) {
    const body = { key, name };
    return this.api.messaging.createIntegration({ params: this.params, body });
  }

  revokeIntegration(integrationId: number) {
    const params = { ...this.params, integrationId };
    return this.api.messaging.removeIntegration({ params });
  }

  postViaWebhook(token: string, body: MessagingWebhookReq['body']) {
    const params = { token };
    return this.api.messaging.postIntegrationMessage({ params, body });
  }
}
