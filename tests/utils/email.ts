import find from 'lodash/find';
import { JSDOM } from 'jsdom';
import { MailtrapClient } from 'mailtrap';

const {
  MAILTRAP_TOKEN,
  MAILTRAP_ACCOUNT_ID,
  MAILTRAP_INBOX_ID,
  MAILTRAP_INBOX_NAME,
} = process.env;

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const client = new MailtrapClient({
  accountId: parseInt(MAILTRAP_ACCOUNT_ID, 10),
  token: MAILTRAP_TOKEN,
  testInboxId: parseInt(MAILTRAP_INBOX_ID, 10),
});

// Get the first email from the inbox
export const getFirstEmail = async (
  toEmailAddress: string,
  retries: number = 5,
): Promise<string> => {
  // Wait for the email to arrive
  await timeout(2000);
  const inboxesClient = client.testing.inboxes;
  const inboxes = await inboxesClient.getList();
  if (!inboxes?.length) return '';
  const inboxId = inboxes.find((it) => it.name === MAILTRAP_INBOX_NAME)?.id;
  if (!inboxId) return '';
  const messagesClient = client.testing.messages;
  const messages = await messagesClient.get(inboxId);
  if (!messages?.length && retries)
    return getFirstEmail(toEmailAddress, retries - 1);
  const message = toEmailAddress
    ? messages.find((it) => it.to_email === toEmailAddress.toLowerCase())
    : messages[0];
  if (message) return messagesClient.getHtmlMessage(inboxId, message.id);
  if (!message && retries) return getFirstEmail(toEmailAddress, retries - 1);
  return '';
};

export const getAnchorFromLastRecievedEmail = async (
  address: string,
  anchorTitle: string,
) => {
  const emailMessage = await getFirstEmail(address);
  const dom = new JSDOM(emailMessage);
  const anchors = dom.window.document.querySelectorAll('a');
  return find(anchors, { textContent: anchorTitle });
};
