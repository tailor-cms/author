import type { MessagingCreateReq } from '@tailor-cms/api-client';
import { type Credentials, signInAs } from './common';

// The messaging API as a given user, so a spec can play another person
// posting, editing or typing while the page under test watches
export default class MessagingClient {
  private readonly user: Credentials;

  constructor(user: Credentials) {
    this.user = user;
  }

  async startThread(repositoryId: number, title: string, content: string) {
    const { messaging } = await signInAs(this.user);
    const body = { title, content };
    return messaging.createThread({ params: { repositoryId }, body });
  }

  async post(repositoryId: number, body: MessagingCreateReq['body']) {
    const { messaging } = await signInAs(this.user);
    return messaging.create({ params: { repositoryId }, body });
  }

  async edit(repositoryId: number, messageId: number, content: string) {
    const { messaging } = await signInAs(this.user);
    const params = { repositoryId, messageId };
    return messaging.update({ params, body: { content } });
  }

  async remove(repositoryId: number, messageId: number) {
    const { messaging } = await signInAs(this.user);
    return messaging.delete({ params: { repositoryId, messageId } });
  }

  async typing(repositoryId: number, threadId: number) {
    const { messaging } = await signInAs(this.user);
    const body = { threadId };
    return messaging.reportTyping({ params: { repositoryId }, body });
  }
}
