import { JSDOM } from 'jsdom';
import { MailtrapClient } from 'mailtrap';

const {
  MAILTRAP_TOKEN,
  MAILTRAP_ACCOUNT_ID,
  MAILTRAP_INBOX_ID,
  MAILTRAP_INBOX_NAME,
} = process.env;

const timeout = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const client = new MailtrapClient({
  accountId: parseInt(MAILTRAP_ACCOUNT_ID, 10),
  testInboxId: parseInt(MAILTRAP_INBOX_ID, 10),
  token: MAILTRAP_TOKEN || '',
});

const lower = (s: string) => s.toLowerCase();

// Mailtrap inbox lookup. Memoised; the configured inbox name doesn't
// change inside a test run.
let cachedInboxId: number | undefined;
async function getInboxId(): Promise<number | undefined> {
  if (cachedInboxId !== undefined) return cachedInboxId;
  const inboxes = await client.testing.inboxes.getList();
  cachedInboxId = inboxes?.find((it) => it.name === MAILTRAP_INBOX_NAME)?.id;
  return cachedInboxId;
}

// Pull the anchor with the requested visible text out of the most recent
// email sent to `address` that actually contains that anchor.
// The loop polls Mailtrap until that email arrives (bounded by
// `retries` * `intervalMs`) and surfaces a clear error if it never does.
export const getAnchorFromLastRecievedEmail = async (
  address: string,
  anchorTitle: string,
  options: { retries?: number; intervalMs?: number } = {},
): Promise<HTMLAnchorElement> => {
  const { retries = 20, intervalMs = 1500 } = options;
  const target = lower(address);
  for (let attempt = 0; attempt < retries; attempt++) {
    await timeout(intervalMs);
    const inbox = await getInboxId();
    if (!inbox) continue;
    const messages = await client.testing.messages.get(inbox);
    // Mailtrap returns newest-first
    const candidates = (messages ?? []).filter(
      (m) => lower(m.to_email) === target,
    );
    for (const message of candidates) {
      const html = await client.testing.messages.getHtmlMessage(
        inbox,
        message.id,
      );
      const anchors = new JSDOM(html).window.document.querySelectorAll('a');
      const match = Array.from(anchors).find(
        (a) => a.textContent?.trim() === anchorTitle,
      );
      if (match) return match as unknown as HTMLAnchorElement;
    }
  }
  throw new Error(
    `Email with anchor "${anchorTitle}" never arrived for ${address} ` +
      `after ${retries} attempts (${(retries * intervalMs) / 1000}s).`,
  );
};
