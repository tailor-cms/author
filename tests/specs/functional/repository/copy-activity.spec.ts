import { expect, test } from '@playwright/test';

import {
  outlineLevel,
  outlineSeed,
  toEmptyRepository,
} from '../../../helpers/seed';
import { ActivityOutline } from '../../../pom/repository/Outline';
import { Toast } from '../../../pom/common/Toast';
import SeedClient from '../../../api/SeedClient';

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('can copy an activity from another repository', async ({ page }) => {
  const {
    data: { repository: sourceRepo },
  } = await SeedClient.seedTestRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  await expect(outline.emptyCopyCard).toBeVisible();
  const copyDialog = await outline.copyFirst();
  // Copying at the root offers only root-level activity types (e.g. Module)
  await copyDialog.selectAndCopy(sourceRepo.name, outlineSeed.group.title);
  // Confirmation toast reflects the activity's type label (e.g. "Module")
  await new Toast(page).expectCopied('Module');
  // Copied activity appears in the outline as a plain (non-linked) duplicate
  const copied = await outline.getOutlineItemByName(outlineSeed.group.title);
  await expect(copied.linkIcon).not.toBeVisible();
});

test('can copy an activity via the outline toolbar', async ({ page }) => {
  const {
    data: { repository: sourceRepo },
  } = await SeedClient.seedTestRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  await outline.addFirstItem(outlineLevel.GROUP, 'Anchor Module');
  const copyDialog = await outline.copyExisting();
  await copyDialog.selectRepository(sourceRepo.name);
  await copyDialog.selectActivity(outlineSeed.group.title);
  await copyDialog.copy();
  await new Toast(page).expectCopied('Module');
  await outline.getOutlineItemByName(outlineSeed.group.title);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
