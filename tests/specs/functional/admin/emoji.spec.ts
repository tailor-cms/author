import { expect, test } from '@playwright/test';

import { ANIMATED_IMAGE, IMAGE } from '../../../fixtures/assets';

import { Discussion } from '../../../pom/repository/discussion/Discussion';
import { EmojiManagement } from '../../../pom/admin/Emoji';
import SeedClient from '../../../api/SeedClient';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await EmojiManagement.visit(page);
});

test.describe('custom emoji', () => {
  test('adds one, and refuses the same name twice', async ({ page }) => {
    const admin = new EmojiManagement(page);
    await expect(admin.el).toContainText('No custom emoji yet');
    const entry = await admin.addEmoji('teamwork', IMAGE.path);
    await entry.expectServedImage();
    const dialog = await admin.openAddDialog();
    await dialog.enterName('teamwork');
    await dialog.hasVisibleError('That shortcode is taken.');
  });

  test('keeps an animated GIF moving', async ({ page }) => {
    const admin = new EmojiManagement(page);
    const entry = await admin.addEmoji('celebrate', ANIMATED_IMAGE.path);
    await entry.expectServedImage({ isAnimated: true });
  });

  test('renders in a message and as a reaction', async ({ page }) => {
    const admin = new EmojiManagement(page);
    await admin.addEmoji('teamwork', IMAGE.path);
    const { data } = await SeedClient.seedTestRepository({
      name: 'Emoji test repository',
    });
    const discussion = await Discussion.visit(page, data.activity.repositoryId);
    await discussion.startThread('Emoji thread', 'Kick-off notes.');
    const { thread } = discussion;
    await thread.composer.post('Shipping this today :teamwork: nice one');
    const message = thread.getMessage('Shipping this today');
    await expect(message.body.customEmoji).toBeVisible();
    await thread.composer.post('Also :nosuchemoji: here');
    await thread.expectMessage(':nosuchemoji:');
    await message.react('teamwork');
    await expect(message.reactions.customEmoji).toBeVisible();
  });
});
