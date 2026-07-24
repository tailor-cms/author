import { expect, test } from '@playwright/test';

import {
  outlineLevel,
  outlineSeed,
  seedLinkedRepositories,
  toEmptyRepository,
} from '../../../helpers/seed';
import { toEditorPage, toStructurePage } from '../../../helpers/navigation';
import { ActivityOutline } from '../../../pom/repository/Outline';
import BaseClient from '../../../api/BaseClient';
import { Editor } from '../../../pom/editor/Editor';
import { EditorToolbar } from '../../../pom/editor/EditorToolbar';
import { OutlineSidebar } from '../../../pom/repository/OutlineSidebar';
import { Toast } from '../../../pom/common/Toast';
import SeedClient from '../../../api/SeedClient';

const api = new BaseClient('/api/repositories/');

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('can link a leaf activity via options menu', async ({ page }) => {
  const {
    data: { repository: sourceRepo },
  } = await SeedClient.seedTestRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const module = await outline.addFirstItem(outlineLevel.GROUP, 'Target Module');
  const linkDialog = await module.optionsMenu.linkContentBelow();
  await linkDialog.selectAndLink(
    sourceRepo.name,
    outlineSeed.primaryPage.title,
  );
  await new Toast(page).expectLinked('Page');
  // Verify linked activity appears in outline with link icon
  await outline.toggleExpand();
  const linkedItem = await outline.getOutlineItemByName(
    outlineSeed.primaryPage.title,
  );
  await expect(linkedItem.linkIcon).toBeVisible();
  // Verify linked indicator in sidebar
  await linkedItem.select();
  const sidebar = new OutlineSidebar(page);
  await sidebar.linkedIndicator.expectVisible();
  await sidebar.linkedIndicator.expectLinkedStatus();
  // Verify persistence
  await page.reload({ waitUntil: 'networkidle' });
  await outline.toggleExpand();
  const reloadedItem = await outline.getOutlineItemByName(
    outlineSeed.primaryPage.title,
  );
  await expect(reloadedItem.linkIcon).toBeVisible();
});

test('can link a group activity via options menu', async ({ page }) => {
  const {
    data: { repository: sourceRepo },
  } = await SeedClient.seedTestRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const module = await outline.addFirstItem(outlineLevel.GROUP, 'Target Module');
  // Link source group into target module
  const linkDialog = await module.optionsMenu.linkContentInto();
  await linkDialog.selectAndLink(sourceRepo.name, outlineSeed.group.title);
  // Expand and verify linked group appears with link icon
  await module.toggleExpand();
  const linkedGroup = await outline.getOutlineItemByName(
    outlineSeed.group.title,
  );
  await expect(linkedGroup.linkIcon).toBeVisible();
  // Verify linked indicator
  await linkedGroup.select();
  const sidebar = new OutlineSidebar(page);
  await sidebar.linkedIndicator.expectVisible();
  await sidebar.linkedIndicator.expectLinkedStatus();
  // Verify persistence
  await page.reload({ waitUntil: 'networkidle' });
  await outline.toggleExpand();
  const reloadedGroup = await outline.getOutlineItemByName(
    outlineSeed.group.title,
  );
  await expect(reloadedGroup.linkIcon).toBeVisible();
});

test('can select a tree item by clicking its title', async ({ page }) => {
  const {
    data: { repository: sourceRepo },
  } = await SeedClient.seedTestRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const module = await outline.addFirstItem(outlineLevel.GROUP, 'Target Module');
  const linkDialog = await module.optionsMenu.linkContentInto();
  await linkDialog.selectRepository(sourceRepo.name);
  await linkDialog.expectSelectionState(
    outlineSeed.primaryPage.title,
    'unselected',
  );
  await linkDialog.selectActivityByTitle(outlineSeed.primaryPage.title);
  await linkDialog.expectSelectionState(outlineSeed.primaryPage.title, 'selected');
});

test('selecting a group visually marks its children as included', async ({
  page,
}) => {
  const {
    data: { repository: sourceRepo },
  } = await SeedClient.seedTestRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const module = await outline.addFirstItem(outlineLevel.GROUP, 'Target Module');
  const linkDialog = await module.optionsMenu.linkContentInto();
  await linkDialog.selectRepository(sourceRepo.name);
  await linkDialog.selectActivity(outlineSeed.group.title);
  await linkDialog.expectSelectionState(outlineSeed.group.title, 'selected');
  await linkDialog.expectSelectionState(outlineSeed.primaryPage.title, 'included');
});

test('selecting a group after a child replaces the child selection', async ({
  page,
}) => {
  const {
    data: { repository: sourceRepo },
  } = await SeedClient.seedTestRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const module = await outline.addFirstItem(outlineLevel.GROUP, 'Target Module');
  const linkDialog = await module.optionsMenu.linkContentInto();
  await linkDialog.selectRepository(sourceRepo.name);
  await linkDialog.selectActivity(outlineSeed.primaryPage.title);
  await linkDialog.expectSelectionState(outlineSeed.primaryPage.title, 'selected');
  await linkDialog.selectActivity(outlineSeed.group.title);
  await linkDialog.expectSelectionState(outlineSeed.group.title, 'selected');
  await linkDialog.expectSelectionState(outlineSeed.primaryPage.title, 'included');
});

test('excluding a child from a group keeps its other children selected', async ({
  page,
}) => {
  const {
    data: { repository: sourceRepo },
  } = await SeedClient.seedTestRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const module = await outline.addFirstItem(outlineLevel.GROUP, 'Target Module');
  const linkDialog = await module.optionsMenu.linkContentInto();
  await linkDialog.selectRepository(sourceRepo.name);
  await linkDialog.selectActivity(outlineSeed.group.title);
  await linkDialog.expectSelectionState(outlineSeed.primaryPage.title, 'included');
  await linkDialog.selectActivity(outlineSeed.primaryPage.title);
  await linkDialog.expectSelectionState(outlineSeed.group.title, 'unselected');
  await linkDialog.expectSelectionState(outlineSeed.primaryPage.title, 'unselected');
  await linkDialog.expectSelectionState(outlineSeed.secondaryPage.title, 'selected');
});

test('excluding a page from one module preserves another selected module', async ({
  page,
}) => {
  const sourceRepo = await toEmptyRepository(page, 'Source');
  const sourceOutline = new ActivityOutline(page);
  const moduleA = await sourceOutline.addFirstItem(outlineLevel.GROUP, 'Module A');
  await moduleA.addInto(outlineLevel.LEAF, 'Page A1');
  await moduleA.addInto(outlineLevel.LEAF, 'Page A2');
  const moduleB = await sourceOutline.addRootItem(outlineLevel.GROUP, 'Module B');
  await moduleB.addInto(outlineLevel.LEAF, 'Page B1');
  await toEmptyRepository(page, 'Target');
  const targetOutline = new ActivityOutline(page);
  const targetModule = await targetOutline.addFirstItem(
    outlineLevel.GROUP,
    'Target Module',
  );
  const linkDialog = await targetModule.optionsMenu.linkContentInto();
  await linkDialog.selectRepository(sourceRepo.name);
  await linkDialog.selectActivity('Module A');
  await linkDialog.selectActivity('Module B');
  await linkDialog.expectSelectionState('Page B1', 'included');
  await linkDialog.selectActivity('Page A1');
  await linkDialog.expectSelectionState('Page A1', 'unselected');
  await linkDialog.expectSelectionState('Page A2', 'selected');
  await linkDialog.expectSelectionState('Module B', 'selected');
  await linkDialog.expectSelectionState('Page B1', 'included');
  // The now explicitly-selected Page A2 must stay independently togglable
  await linkDialog.selectActivity('Page A2');
  await linkDialog.expectSelectionState('Page A2', 'unselected');
  await linkDialog.expectSelectionState('Module B', 'selected');
  await linkDialog.expectSelectionState('Page B1', 'included');
  // Module A is now fully evacuated (neither it nor any of its pages are
  // selected) while Module B (a different level) remains selected.
  await linkDialog.selectActivity('Page A1');
  await linkDialog.expectSelectionState('Page A1', 'selected');
  await linkDialog.expectSelectionState('Module B', 'selected');
  await linkDialog.expectSelectionState('Page B1', 'included');
  // Re-selecting Module A (widening back from its individually-selected
  // Page A1) must consolidate only Module A's own pages; Module B, an
  // unrelated selection, must not be dropped in the process
  await linkDialog.selectActivity('Module A');
  await linkDialog.expectSelectionState('Module A', 'selected');
  await linkDialog.expectSelectionState('Page A1', 'included');
  await linkDialog.expectSelectionState('Page A2', 'included');
  await linkDialog.expectSelectionState('Module B', 'selected');
  await linkDialog.expectSelectionState('Page B1', 'included');
});

test('excluding a deeply nested page leaves the rest of the tree included', async ({
  page,
}) => {
  const sourceRepo = await toEmptyRepository(page, 'Source');
  const sourceOutline = new ActivityOutline(page);
  // Level 1 > Level 2 > Level 3 > Level 4 > [Deep Page, Deep Sibling]
  // Level 1 also has an unrelated branch: Level 2 Sibling, off the path
  await sourceOutline.addFirstItem(outlineLevel.GROUP, 'Level 1');
  const level1 = await sourceOutline.getOutlineItemByName('Level 1');
  await level1.addInto(outlineLevel.GROUP, 'Level 2');
  await level1.addInto(outlineLevel.GROUP, 'Level 2 Sibling');
  const level2 = await sourceOutline.getOutlineItemByName('Level 2');
  await level2.addInto(outlineLevel.GROUP, 'Level 3');
  const level3 = await sourceOutline.getOutlineItemByName('Level 3');
  await level3.addInto(outlineLevel.GROUP, 'Level 4');
  const level4 = await sourceOutline.getOutlineItemByName('Level 4');
  await level4.addInto(outlineLevel.LEAF, 'Deep Page');
  await level4.addInto(outlineLevel.LEAF, 'Deep Sibling');
  await toEmptyRepository(page, 'Target');
  const targetOutline = new ActivityOutline(page);
  const targetModule = await targetOutline.addFirstItem(
    outlineLevel.GROUP,
    'Target Module',
  );
  const linkDialog = await targetModule.optionsMenu.linkContentInto();
  await linkDialog.selectRepository(sourceRepo.name);
  // Selecting the root includes every descendant, however deep
  await linkDialog.selectActivity('Level 1');
  await linkDialog.expectSelectionState('Deep Page', 'included');
  await linkDialog.expectSelectionState('Deep Sibling', 'included');
  await linkDialog.expectSelectionState('Level 2 Sibling', 'included');
  // Excluding a page 4 levels down must still take effect, not just when
  // it's a direct child of the selected root
  await linkDialog.selectActivity('Deep Page');
  await linkDialog.expectSelectionState('Deep Page', 'unselected');
  await linkDialog.expectSelectionState('Level 1', 'unselected');
  // Its sibling and the unrelated branch both stay selected
  await linkDialog.expectSelectionState('Deep Sibling', 'selected');
  await linkDialog.expectSelectionState('Level 2 Sibling', 'selected');
});

test('can link a group activity below via options menu', async ({ page }) => {
  const {
    data: { repository: sourceRepo },
  } = await SeedClient.seedTestRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const module = await outline.addFirstItem(outlineLevel.GROUP, 'Target Module');
  const linkDialog = await module.optionsMenu.linkContentBelow();
  await linkDialog.selectAndLink(sourceRepo.name, outlineSeed.group.title);
  const linkedGroup = await outline.getOutlineItemByName(
    outlineSeed.group.title,
  );
  await expect(linkedGroup.linkIcon).toBeVisible();
  await linkedGroup.select();
  const sidebar = new OutlineSidebar(page);
  await sidebar.linkedIndicator.expectVisible();
  await sidebar.linkedIndicator.expectLinkedStatus();
  // Verify persistence
  await page.reload({ waitUntil: 'networkidle' });
  const reloadedGroup = await outline.getOutlineItemByName(
    outlineSeed.group.title,
  );
  await expect(reloadedGroup.linkIcon).toBeVisible();
});

test('can link a leaf activity into a group via options menu', async ({
  page,
}) => {
  const {
    data: { repository: sourceRepo },
  } = await SeedClient.seedTestRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const module = await outline.addFirstItem(outlineLevel.GROUP, 'Target Module');
  const linkDialog = await module.optionsMenu.linkContentInto();
  await linkDialog.selectAndLink(
    sourceRepo.name,
    outlineSeed.primaryPage.title,
  );
  await module.toggleExpand();
  const linkedPage = await outline.getOutlineItemByName(
    outlineSeed.primaryPage.title,
  );
  await expect(linkedPage.linkIcon).toBeVisible();
  await linkedPage.select();
  const sidebar = new OutlineSidebar(page);
  await sidebar.linkedIndicator.expectVisible();
  await sidebar.linkedIndicator.expectLinkedStatus();
  // Verify persistence
  await page.reload({ waitUntil: 'networkidle' });
  await outline.toggleExpand();
  const reloadedPage = await outline.getOutlineItemByName(
    outlineSeed.primaryPage.title,
  );
  await expect(reloadedPage.linkIcon).toBeVisible();
});

test('can link a leaf activity via toolbar menu', async ({ page }) => {
  const {
    data: { repository: sourceRepo },
  } = await SeedClient.seedTestRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const linkDialog = await outline.linkFirst();
  await linkDialog.selectRepository(sourceRepo.name);
  await linkDialog.selectActivity(outlineSeed.primaryPage.title);
  await linkDialog.link();
  // Verify linked activity appears
  const linkedItem = await outline.getOutlineItemByName(
    outlineSeed.primaryPage.title,
  );
  await expect(linkedItem.linkIcon).toBeVisible();
  // Verify persistence
  await page.reload({ waitUntil: 'networkidle' });
  const reloaded = await outline.getOutlineItemByName(
    outlineSeed.primaryPage.title,
  );
  await expect(reloaded.linkIcon).toBeVisible();
});

test('can navigate to linked parent from a nested linked child', async ({
  page,
}) => {
  const {
    data: { repository: sourceRepo },
  } = await SeedClient.seedTestRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const linkDialog = await outline.linkFirst();
  await linkDialog.selectAndLink(sourceRepo.name, outlineSeed.group.title);
  await outline.toggleExpand();
  const childPage = await outline.getOutlineItemByName(
    outlineSeed.primaryPage.title,
  );
  await childPage.select();
  // The nested child is linked via its parent, not an entry point itself
  const sidebar = new OutlineSidebar(page);
  await sidebar.expectName(outlineSeed.primaryPage.title);
  await sidebar.linkedIndicator.expectVisible();
  await sidebar.linkedIndicator.expectLinkedViaParentStatus();
  await sidebar.linkedIndicator.goToLinkedParent();
  // The linked parent module should now be selected and shown as entry point
  await sidebar.expectName(outlineSeed.group.title);
  await sidebar.linkedIndicator.expectVisible();
  await sidebar.linkedIndicator.expectEntryPointStatus();
});

test('linked activity shows link icon in outline', async ({ page }) => {
  const { linkedActivity } = await seedLinkedRepositories();
  await toStructurePage(page, linkedActivity);
  const outline = new ActivityOutline(page);
  await outline.toggleExpand();
  const item = await outline.getOutlineItemByUid(linkedActivity.uid);
  await expect(item.linkIcon).toBeVisible();
});

test('linked indicator shows in sidebar when linked activity is selected', async ({
  page,
}) => {
  const { linkedActivity } = await seedLinkedRepositories();
  await toStructurePage(page, linkedActivity);
  const outline = new ActivityOutline(page);
  const { sidebar } = await outline.expandAndSelect(linkedActivity.uid);
  const indicator = sidebar.linkedIndicator;
  await indicator.expectVisible();
  await indicator.expectLinkedStatus();
});

test('can unlink activity via indicator menu', async ({ page }) => {
  const { linkedActivity: item } = await seedLinkedRepositories();
  await toStructurePage(page, item);
  const outline = new ActivityOutline(page);
  const { sidebar } = await outline.expandAndSelect(item.uid);
  const indicator = sidebar.linkedIndicator;
  await indicator.expectVisible();
  await indicator.unlink();
  // Verify persistence
  await page.reload({ waitUntil: 'networkidle' });
  const { sidebar: reloadedSidebar } = await outline.expandAndSelect(item.uid);
  await reloadedSidebar.linkedIndicator.expectNotVisible();
});

test('comments disabled on linked activity', async ({ page }) => {
  const { linkedActivity } = await seedLinkedRepositories();
  await toStructurePage(page, linkedActivity);
  const outline = new ActivityOutline(page);
  const { sidebar } = await outline.expandAndSelect(linkedActivity.uid);
  const notice = sidebar.linkedCopyNotice;
  await expect(notice.el).toBeVisible();
  await expect(notice.viewOnSourceBtn).toBeVisible();
  await expect(sidebar.comments.el).not.toBeVisible();
});

test('can navigate to source from comments notice', async ({ page }) => {
  const { repository, linkedActivity } = await seedLinkedRepositories();
  await toStructurePage(page, linkedActivity);
  const outline = new ActivityOutline(page);
  const { sidebar } = await outline.expandAndSelect(linkedActivity.uid);
  const notice = sidebar.linkedCopyNotice;
  await expect(notice.viewOnSourceBtn).toBeVisible();
  await notice.navigateToSource();
  await expect(page).toHaveURL(new RegExp(`/repository/${repository.id}`));
});

test('unlinking preserves content', async ({ page }) => {
  const { linkedActivity } = await seedLinkedRepositories();
  await toStructurePage(page, linkedActivity);
  const outline = new ActivityOutline(page);
  const { sidebar } = await outline.expandAndSelect(linkedActivity.uid);
  const indicator = sidebar.linkedIndicator;
  await indicator.expectVisible();
  await indicator.unlink();
  // Navigate to editor and verify content preserved
  await toEditorPage(page, linkedActivity);
  const editor = new Editor(page);
  const element = editor.getElement();
  await expect(element.el).toBeVisible();
  const contentText = await element.el.textContent();
  expect(contentText).toContain(outlineSeed.primaryPage.textContent);
});

test('auto-unlink on activity data edit', async ({ page }) => {
  const { linkedActivity } = await seedLinkedRepositories();
  await toStructurePage(page, linkedActivity);
  const outline = new ActivityOutline(page);
  const { sidebar } = await outline.expandAndSelect(linkedActivity.uid);
  const indicator = sidebar.linkedIndicator;
  await indicator.expectVisible();
  // Edit the activity name in sidebar, triggers auto-unlink
  const newName = 'Edited Linked Activity';
  await sidebar.fillName(newName);
  await indicator.expectNotVisible();
  // Verify persistence
  await page.reload();
  await page.waitForLoadState('networkidle');
  await outline.toggleExpand();
  const editedItem = await outline.getOutlineItemByName(newName);
  await editedItem.select();
  await indicator.expectNotVisible();
});

test('auto-unlink on structural change (add child to a linked module)', async ({
  page,
}) => {
  const { repository, linkedActivity } = await seedLinkedRepositories();
  const { data: activities } = await api.get(`${repository.id}/activities/`);
  const sourceModule = activities.find(
    (a: any) => a.data.name === outlineSeed.group.title,
  );
  const targetRepoId = linkedActivity.repositoryId;
  const { data: linkedActivities } = await api.post(
    `${targetRepoId}/activities/link`,
    { sourceId: sourceModule.id, parentId: null, position: 0 },
  );
  const linkedModule = linkedActivities[0];
  await toStructurePage(page, { repositoryId: targetRepoId } as any);
  const outline = new ActivityOutline(page);
  const { item, sidebar } = await outline.expandAndSelect(linkedModule.uid);
  const indicator = sidebar.linkedIndicator;
  await indicator.expectVisible();
  // Add a child Page into the linked module — triggers auto-unlink
  await item.addInto('Page', 'New Child Page');
  await item.select();
  await indicator.expectNotVisible();
  // Verify persistence
  await page.reload();
  await page.waitForLoadState('networkidle');
  const { sidebar: reloadedSidebar } = await outline.expandAndSelect(
    linkedModule.uid,
  );
  await reloadedSidebar.linkedIndicator.expectNotVisible();
});

test('opening empty linked activity does not auto-unlink', async ({ page }) => {
  const sourceRepo = await toEmptyRepository(page, 'Source');
  const sourceOutline = new ActivityOutline(page);
  await sourceOutline.addFirstItem(outlineLevel.LEAF, 'Empty Page');
  const targetRepo = await toEmptyRepository(page, 'Target');
  const targetOutline = new ActivityOutline(page);
  const module = await targetOutline.addFirstItem(
    outlineLevel.GROUP,
    'Target Module',
  );
  const linkDialog = await module.optionsMenu.linkContentInto();
  await linkDialog.selectAndLink(sourceRepo.name, 'Empty Page');
  // Navigate to linked page editor
  await targetOutline.toggleExpand();
  const linkedItem = await targetOutline.getOutlineItemByName('Empty Page');
  await linkedItem.select();
  const sidebar = new OutlineSidebar(page);
  await sidebar.openEditor();
  await page.waitForLoadState('networkidle');
  const editor = new Editor(page);
  // Verify empty linked activity notice is shown
  await expect(editor.emptyLinkedNotice).toContainText('without content');
  // Toolbar should show linked state
  const toolbar = new EditorToolbar(page);
  await toolbar.expectLinkedState();
  // No containers should be rendered
  await expect(editor.containers).not.toBeVisible();
  // Navigate back to structure and verify still linked
  await toStructurePage(page, { repositoryId: targetRepo.id } as any);
  const outline = new ActivityOutline(page);
  await outline.toggleExpand();
  const item = await outline.getOutlineItemByName('Empty Page');
  await expect(item.linkIcon).toBeVisible();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
