import { expect, test, type Page } from '@playwright/test';
import { MESSAGE_MAX_LENGTH } from '@tailor-cms/interfaces/comment';

import {
  ADMIN_TEST_USER,
  DEFAULT_TEST_USER as TEAMMATE,
} from '../../../fixtures/auth';
import { DOCUMENT, IMAGE } from '../../../fixtures/assets';
import { confirmAction, DISABLED_LIST_ITEM } from '../../../pom/common/utils';
import { Discussion } from '../../../pom/repository/discussion/Discussion';
import { Editor } from '../../../pom/editor/Editor';
import { outlineSeed } from '../../../helpers/seed';
import { toEditorPage } from '../../../helpers/navigation';
import { Toast } from '../../../pom/common/Toast';
import AssetClient from '../../../api/AssetClient';
import MessagingClient from '../../../api/MessagingClient';
import SeedClient from '../../../api/SeedClient';

// Target element and comment
const ELEMENT_THREAD = outlineSeed.primaryPage.title;
const ELEMENT_COMMENT = 'Needs a clearer example here';
const CHANNEL_MESSAGE = 'Kick-off notes for the rewrite';

test.beforeAll(async () => {
  await SeedClient.resetDatabase();
});

// Seeds a repository with a comment left on one of its elements. Through
// the messaging client, the signed-in user sets up more threads in it
const seedRepository = async (authorEmail?: string) => {
  const { data } = await SeedClient.seedTestRepository({
    name: 'Discussion test repository',
  });
  const commentedElement = {
    repositoryId: data.activity.repositoryId as number,
    activityId: data.activity.id as number,
    contentElementId: data.contentElement.id as number,
  };
  await SeedClient.seedComment({
    ...commentedElement,
    content: ELEMENT_COMMENT,
    authorEmail,
  });
  const { repositoryId } = commentedElement;
  const { activity } = data;
  const messaging = new MessagingClient(ADMIN_TEST_USER, repositoryId);
  return { repositoryId, activity, commentedElement, messaging };
};

const toDiscussion = async (page: Page, authorEmail?: string) => {
  const seeded = await seedRepository(authorEmail);
  const discussion = await Discussion.visit(page, seeded.repositoryId);
  return { ...seeded, discussion };
};

// Seeds a repository and opens the element comment's thread
const toElementThread = async (page: Page) => {
  const seeded = await toDiscussion(page);
  const thread = await seeded.discussion.selectThread(ELEMENT_THREAD);
  await thread.expectMessage(ELEMENT_COMMENT);
  return { ...seeded, thread };
};

// Opens a thread of its own with a question, and replies to it
const toReplies = async (page: Page) => {
  const { repositoryId, messaging } = await seedRepository();
  await messaging.startThread('Release', 'Should we ship?');
  const discussion = await Discussion.visit(page, repositoryId);
  const thread = await discussion.selectThread('Release');
  const replies = await thread.openReplies('Should we ship');
  await replies.composer.post('Only once the rubric is signed off');
  await expect(replies.getMessageLocator('rubric')).toBeVisible();
  return { discussion, thread, replies };
};

test('lists an element comment as a thread that links to it', async ({
  page,
}) => {
  const { discussion } = await toDiscussion(page);
  await expect(discussion.threadList.getItemLocator(ELEMENT_THREAD))
    .toBeVisible();
  const thread = await discussion.selectThread(ELEMENT_THREAD);
  await thread.expectMessage(ELEMENT_COMMENT);
  await expect(thread.title).toContainText(ELEMENT_THREAD);
  await expect(thread.openInEditorBtn).toHaveAttribute('href', /editor/);
});

test('starts a thread', async ({ page }) => {
  const { discussion } = await toDiscussion(page);
  await discussion.startThread('Rewrite', CHANNEL_MESSAGE);
  await discussion.thread.expectMessage(CHANNEL_MESSAGE);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(discussion.threadList.getItemLocator('Rewrite')).toBeVisible();
});

test('posts in a thread', async ({ page }) => {
  const { discussion, thread } = await toElementThread(page);
  const message = 'Agreed, I will rewrite the intro';
  await thread.composer.post(message);
  await thread.expectMessage(message);
  await page.reload({ waitUntil: 'networkidle' });
  const reopened = await discussion.selectThread(ELEMENT_THREAD);
  await reopened.expectMessage(ELEMENT_COMMENT);
  await reopened.expectMessage(message);
});

test('a message posted here shows in the editor', async ({ page }) => {
  const { thread, activity } = await toElementThread(page);
  const message = 'Posted from the discussion';
  await thread.composer.post(message);
  await thread.expectMessage(message);
  await toEditorPage(page, activity);
  const { elementText } = outlineSeed.primaryPage;
  const element = new Editor(page).getElement(elementText);
  const comment = await element.getComment(message);
  await expect(comment.el).toBeVisible();
});

test('mentions a member', async ({ page }) => {
  const { thread } = await toElementThread(page);
  await thread.composer.selectSuggestion('@');
  await thread.composer.send();
  // Shown as a chip naming the person
  await expect(thread.getLastMessage().body.tokens.last()).toBeVisible();
});

test('Enter picks the highlighted suggestion instead of sending', async ({
  page,
}) => {
  const { thread } = await toElementThread(page);
  const { composer, messages } = thread;
  const count = await messages.count();
  await composer.selectSuggestionWithKeyboard('@');
  await expect(messages).toHaveCount(count);
  await expect(composer.mentionChips).toBeVisible();
  // Picking one closed the suggestions, so the same key now sends
  await composer.input.press('Enter');
  await expect(messages).toHaveCount(count + 1);
});

test('a reference shows a preview on hover', async ({ page }) => {
  const { thread } = await toElementThread(page);
  const query = ELEMENT_THREAD.slice(0, 6);
  await thread.composer.selectSuggestion('#', { query });
  await thread.composer.send();
  const reference = thread.getLastMessage().body.tokens.last();
  await reference.hover();
  await expect(thread.referencePreview).toBeVisible();
});

test('a # suggestion shows what kind of item it is', async ({ page }) => {
  const { thread } = await toElementThread(page);
  const query = ELEMENT_THREAD.slice(0, 6);
  const suggestions = await thread.composer.openSuggestions('#', query);
  await expect(suggestions.first()).toContainText('Activity');
  // The same icon the posted reference gets
  await expect(thread.composer.suggestionIcons.first())
    .toHaveClass(/mdi-file-tree/);
});

test('resolves and reopens a thread', async ({ page }) => {
  const { discussion, thread } = await toElementThread(page);
  const { threadList } = discussion;
  const item = threadList.getItemLocator(ELEMENT_THREAD);
  await thread.runAction('Resolve');
  await new Toast(page).hasText('Thread resolved');
  await threadList.getFilterLocator('Open').click();
  await expect(item).toHaveCount(0);
  await threadList.getFilterLocator('All').click();
  await discussion.selectThread(ELEMENT_THREAD);
  await thread.runAction('Reopen');
  await new Toast(page).hasText('Thread reopened');
  await threadList.getFilterLocator('Open').click();
  await expect(item).toBeVisible();
});

test('deletes a thread it started', async ({ page }) => {
  const { repositoryId, messaging } = await seedRepository();
  await messaging.startThread('Scratch', 'Posted by mistake');
  const discussion = await Discussion.visit(page, repositoryId);
  const { threadList } = discussion;
  const thread = await discussion.selectThread('Scratch');
  await thread.runAction('Delete thread');
  await confirmAction(page);
  await new Toast(page).hasText('Thread deleted');
  await expect(threadList.getItemLocator('Scratch')).toHaveCount(0);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(threadList.getItemLocator('Scratch')).toHaveCount(0);
});

test('an element comment thread cannot be deleted or subscribed', async ({
  page,
}) => {
  const { thread } = await toElementThread(page);
  await thread.openMenu();
  await expect(thread.getMenuItemLocator('Resolve')).toBeVisible();
  // Deleting it would delete the comments in the editor too
  await expect(thread.getMenuItemLocator('Delete thread')).toHaveCount(0);
  // Automated posts only go to threads that people start
  await expect(thread.getMenuItemLocator('Subscribe to updates'))
    .toHaveCount(0);
});

test('a starred thread is listed first, for whoever starred it', async ({
  page,
}) => {
  const { repositoryId, messaging } = await seedRepository();
  await messaging.startThread('Budget', 'Older business');
  await messaging.startThread('Rewrite', CHANNEL_MESSAGE);
  const { threadList } = await Discussion.visit(page, repositoryId);
  // Newest first, until a thread is starred
  await expect(threadList.items.first()).toContainText('Rewrite');
  await threadList.getItem('Budget').toggleStar();
  // Saved, so it is still first after a reload
  await page.reload({ waitUntil: 'networkidle' });
  await expect(threadList.getGroupLabelLocator('Starred')).toBeVisible();
  await expect(threadList.items.first()).toContainText('Budget');
  await threadList.getItem('Budget').toggleStar();
  await expect(threadList.getGroupLabelLocator('Starred')).toHaveCount(0);
  await expect(threadList.items.first()).toContainText('Rewrite');
});

test('replies to a message, one level deep', async ({ page }) => {
  const { discussion, thread, replies } = await toReplies(page);
  await expect(thread.messages).toHaveCount(1);
  const question = thread.getMessage('Should we ship');
  await expect(question.replyFooter).toContainText('1 reply');
  const { toolbar } = replies.getMessage('rubric');
  await toolbar.reveal();
  await expect(toolbar.reactBtn).toBeVisible();
  await expect(toolbar.replyBtn).toHaveCount(0);
  // A reply can be posted to the thread as well
  await replies.alsoSendToThreadCheckbox.check();
  await replies.composer.post('Sales need to know as well');
  await thread.expectMessage('Sales need to know');
  await expect(thread.getMessageLocator('Sales need to know'))
    .toContainText('Replied to a thread');
  await expect(thread.messages).toHaveCount(2);
  await page.reload({ waitUntil: 'networkidle' });
  await discussion.selectThread('Release');
  await expect(thread.messages).toHaveCount(2);
  await expect(question.replyFooter).toContainText('2 replies');
});

test('changes to the replied message show in both panels', async ({
  page,
}) => {
  const { thread, replies } = await toReplies(page);
  const { parent } = replies;
  const question = thread.getMessage('Should we ship');
  const pills = await parent.react('thumbsup');
  await expect(pills).toContainText('1');
  await expect(question.reactions.pills).toContainText('1');
  await parent.edit('Should we ship on Monday?');
  await expect(parent.el).toContainText('Monday');
  await thread.expectMessage('Monday');
  // A deleted message stays as a placeholder, so its replies are kept
  await parent.remove();
  await new Toast(page).hasText('Message deleted');
  await expect(parent.el).toContainText('This message was deleted');
  await expect(replies.getMessageLocator('rubric')).toBeVisible();
  await thread.expectMessage('This message was deleted');
  await expect(thread.getMessage('This message was deleted').replyFooter)
    .toContainText('1 reply');
});

test('`:` inserts an emoji as the character itself', async ({ page }) => {
  const { discussion } = await toDiscussion(page);
  const composer = await discussion.openNewThread('Ship it');
  await composer.type('shipping ');
  await composer.selectSuggestionWithKeyboard(':', { query: 'tada' });
  await composer.send();
  const thread = await discussion.selectThread('Ship it');
  await expect(thread.messages.first()).toContainText('🎉');
});

test('links a URL, with or without https://', async ({ page }) => {
  const { thread } = await toElementThread(page);
  await thread.composer.post(
    'specs at https://example.com/specs and www.example.org, both live',
  );
  const message = thread.getMessage('specs at');
  const withScheme = message.getLinkLocator(/example\.com/);
  const withoutScheme = message.getLinkLocator('www.example.org');
  await expect(withScheme).toHaveAttribute('href', 'https://example.com/specs');
  await expect(withoutScheme).toHaveAttribute(
    'href',
    'https://www.example.org/',
  );
});

test('formats backticks as code, while typing and once posted', async ({
  page,
}) => {
  const { thread } = await toElementThread(page);
  const { composer } = thread;
  await composer.write('run `npm ci` first');
  await expect(composer.inlineCode).toHaveText('`npm ci`');
  await composer.send();
  // The backticks are kept in the message, but not shown
  const { body } = thread.getMessage('run');
  await expect(body.inlineCode).toHaveText('npm ci');
  await expect(body.inlineCode).not.toContainText('`');
});

test('formats a fenced block written over several lines', async ({
  page,
}) => {
  const { thread } = await toElementThread(page);
  const { composer } = thread;
  // Shift+Enter adds a line, since Enter sends
  await composer.typeLines(['```js', 'const a = 1;', '```']);
  await expect(composer.codeBlocks.first()).toBeVisible();
  await composer.send();
  const { body } = thread.getLastMessage();
  await expect(body.codeBlockText).toHaveText('const a = 1;');
  await expect(body.codeBlockLanguage).toHaveText('js');
});

test('shows a preview of a pasted Google Docs link', async ({ page }) => {
  const { thread } = await toElementThread(page);
  await thread.composer.post(
    'notes are in https://docs.google.com/spreadsheets/d/1abc/edit',
  );
  // The server looks the link up, so the preview comes after the message
  const message = thread.getLastMessage();
  await expect(message.previews.card).toContainText('Google Sheet', {
    timeout: 20000,
  });
  await expect(message.getLinkLocator(/Google Sheet/))
    .toHaveAttribute('target', '_blank');
});

test('a file attached shows a preview', async ({
  page,
}) => {
  const { repositoryId } = await seedRepository();
  await AssetClient.uploadFile(repositoryId, DOCUMENT.path);
  const discussion = await Discussion.visit(page, repositoryId);
  const thread = await discussion.selectThread(ELEMENT_THREAD);
  // Referencing an existing file first loads the list of files
  await thread.composer.write('first ');
  await thread.composer.selectSuggestion('#', {
    query: 'test-document',
    label: 'test-document',
  });
  await thread.composer.send();
  await expect(thread.getMessage('first').previews.file).toBeVisible();
  await thread.composer.attach(IMAGE.path);
  await thread.composer.send();
  const { previews } = thread.getMessage('test-image');
  await expect(previews.image).toBeVisible();
  await expect(previews.thumbnail).toBeVisible();
});

test('lists the files shared in a thread', async ({ page }) => {
  const { repositoryId } = await seedRepository();
  await AssetClient.uploadFile(repositoryId, IMAGE.path);
  const discussion = await Discussion.visit(page, repositoryId);
  const thread = await discussion.selectThread(ELEMENT_THREAD);
  await thread.composer.write('here it is ');
  await thread.composer.selectSuggestion('#', {
    query: 'test-image',
    label: 'test-image',
  });
  await thread.composer.send();
  await thread.expectMessage('here it is');
  const dialog = await thread.openSharedFiles();
  await expect(dialog.getFileLocator('test-image')).toBeVisible();
});

test('reacts to a message, and takes the reaction back', async ({ page }) => {
  const { discussion, thread } = await toElementThread(page);
  const message = thread.getMessage(ELEMENT_COMMENT);
  const { pills } = message.reactions;
  await message.react('thumbsup');
  await expect(pills).toHaveCount(1);
  await expect(pills).toContainText('1');
  await message.reactions.add('rocket');
  await expect(pills).toHaveCount(2);
  await page.reload({ waitUntil: 'networkidle' });
  await discussion.selectThread(ELEMENT_THREAD);
  await expect(pills).toHaveCount(2);
  // Clicking your own reaction again removes it
  await pills.first().click();
  await expect(pills).toHaveCount(1);
});

test('edits a message, and again with the up arrow', async ({ page }) => {
  const { thread } = await toElementThread(page);
  await thread.composer.post(CHANNEL_MESSAGE);
  await thread.getMessage(CHANNEL_MESSAGE).edit('Kick-off notes, corrected');
  const edited = thread.getMessage('Kick-off notes, corrected');
  await expect(edited.body.editedLabel).toBeVisible();
  // Up arrow in an empty composer edits your last message
  await thread.editLast('Kick-off notes, corrected twice');
  await thread.expectMessage('Kick-off notes, corrected twice');
});

test('will not send a message over the length limit', async ({ page }) => {
  const { thread } = await toElementThread(page);
  const { composer, messages } = thread;
  const count = await messages.count();
  await composer.write('x'.repeat(MESSAGE_MAX_LENGTH + 1));
  await expect(composer.hint).toContainText('1 character too long');
  await expect(composer.postBtn).toBeDisabled();
  await composer.input.press('Enter');
  await expect(messages).toHaveCount(count);
  await composer.write('x'.repeat(MESSAGE_MAX_LENGTH));
  await expect(composer.hint).not.toContainText('too long');
  await composer.send();
  await expect(messages).toHaveCount(count + 1);
});

test('keeps an unsent draft for each thread', async ({ page }) => {
  const { repositoryId, messaging } = await seedRepository();
  await messaging.startThread('Budget', 'Other business');
  const discussion = await Discussion.visit(page, repositoryId);
  const { composer } = await discussion.selectThread(ELEMENT_THREAD);
  await composer.write('half a thought');
  await discussion.selectThread('Budget');
  await expect(composer.input).toHaveText('');
  await discussion.selectThread(ELEMENT_THREAD);
  await expect(composer.input).toHaveText('half a thought');
  // Saved in the browser, so it is kept after a reload
  await page.reload({ waitUntil: 'networkidle' });
  await discussion.selectThread(ELEMENT_THREAD);
  await expect(composer.input).toHaveText('half a thought');
});

test('names the sender once for messages sent in a row', async ({ page }) => {
  const { thread } = await toElementThread(page);
  await thread.composer.post('First of two');
  await thread.composer.post('Second of two');
  await thread.expectMessage('Second of two');
  await expect(thread.getDividerLocator('Today')).toBeVisible();
  await expect(thread.getMessage(ELEMENT_COMMENT).header).toBeVisible();
  await expect(thread.getMessage('Second of two').header).toHaveCount(0);
});

test('drags the reply panel wider', async ({ page }) => {
  const { thread } = await toElementThread(page);
  const replies = await thread.openReplies(ELEMENT_COMMENT);
  const width = await replies.width();
  await replies.resizeBy(-160);
  expect(await replies.width()).toBeGreaterThan(width);
});

test('drags the thread list wider', async ({ page }) => {
  const { discussion } = await toDiscussion(page);
  const { threadList } = discussion;
  await expect(threadList.el).toBeVisible();
  const width = await threadList.width();
  await threadList.resizeBy(120);
  expect(await threadList.width()).toBeGreaterThan(width);
});

test('marks where the unread messages start', async ({ page }) => {
  const { repositoryId, commentedElement } = await seedRepository();
  const discussion = await Discussion.visit(page, repositoryId);
  // Opening the thread marks it read
  await discussion.selectThread(ELEMENT_THREAD, { waitForSeen: true });
  await SeedClient.seedComment({
    ...commentedElement,
    content: 'One more thing before you go',
    authorEmail: TEAMMATE.email,
  });
  await page.reload({ waitUntil: 'networkidle' });
  await discussion.selectThread(ELEMENT_THREAD);
  await expect(discussion.thread.unreadDivider).toBeVisible();
});

test('marks everything read', async ({ page }) => {
  // Your own messages are never unread, so a teammate writes this one
  const { discussion } = await toDiscussion(page, TEAMMATE.email);
  const { threadList } = discussion;
  await threadList.openMenu();
  await expect(threadList.markAllReadItem).not.toHaveClass(DISABLED_LIST_ITEM);
  await threadList.markAllReadItem.click();
  await threadList.openMenu();
  await expect(threadList.markAllReadItem).toHaveClass(DISABLED_LIST_ITEM);
});

test('your own messages are never unread', async ({ page }) => {
  // The only message is the signed-in user's, in a thread they have never
  // opened here
  const { discussion } = await toDiscussion(page, ADMIN_TEST_USER.email);
  const { threadList } = discussion;
  await threadList.openMenu();
  await expect(threadList.markAllReadItem).toHaveClass(DISABLED_LIST_ITEM);
  await page.keyboard.press('Escape');
  await threadList.getFilterLocator('Unread').click();
  await expect(threadList.items).toHaveCount(0);
});

test('a link opens its thread, and Back returns to the previous one',
  async ({ page }) => {
    const { repositoryId, messaging } = await seedRepository();
    const budget = await messaging.startThread('Budget', 'Numbers for Q3');
    await messaging.startThread('Rewrite', CHANNEL_MESSAGE);
    const discussion = await Discussion.visit(page, repositoryId, {
      threadId: budget.id,
    });
    const { title } = discussion.thread;
    await expect(title).toHaveText('Budget');
    await discussion.selectThread('Rewrite');
    await expect(title).toHaveText('Rewrite');
    await page.goBack();
    await expect(title).toHaveText('Budget');
  });

test('a link to a deleted thread says so', async ({ page }) => {
  const { repositoryId } = await seedRepository();
  const discussion = await Discussion.visit(page, repositoryId, {
    threadId: 999999,
  });
  await new Toast(page).hasText('That thread is no longer available');
  // The id is cleared, so a reload does not show the error again
  await expect(page).not.toHaveURL(/threadId=/);
  await expect(discussion.threadList.getItemLocator(ELEMENT_THREAD))
    .toBeVisible();
});
