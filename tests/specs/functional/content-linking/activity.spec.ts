import { expect, test } from '@playwright/test';

import {
  outlineLevel,
  outlineSeed,
  toEmptyRepository,
  seedLinkedRepositories,
} from '../../../helpers/seed';
import { toEditorPage, toStructurePage } from '../../../helpers/navigation';
import { ActivityOutline } from '../../../pom/repository/Outline';
import { AddRepositoryDialog } from '../../../pom/catalog/AddRepository';
import BaseClient from '../../../api/BaseClient';
import { Editor } from '../../../pom/editor/Editor';
import { EditorToolbar } from '../../../pom/editor/EditorToolbar';
import { GeneralSettings } from '../../../pom/repository/RepositorySettings';
import { LinkContentDialog } from '../../../pom/repository/LinkContentDialog';
import { OutlineSidebar } from '../../../pom/repository/OutlineSidebar';
import { RevisionHistory } from '../../../pom/repository/RevisionHistory';
import SeedClient from '../../../api/SeedClient';

const api = new BaseClient('/api/repositories/');

const seedSourceRepository = async () => {
  const { data } = await SeedClient.seedTestRepository();
  return data.repository;
};

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('can link a leaf activity via options menu', async ({ page }) => {
  const sourceRepo = await seedSourceRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const module = await outline.addRootItem(outlineLevel.GROUP, 'Target Module');
  const linkDialog = await module.optionsMenu.linkContentBelow();
  await linkDialog.selectAndLink(
    sourceRepo.name,
    outlineSeed.primaryPage.title,
  );
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
  const sourceRepo = await seedSourceRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const module = await outline.addRootItem(outlineLevel.GROUP, 'Target Module');
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

test('can link a group activity below via options menu', async ({ page }) => {
  const sourceRepo = await seedSourceRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const module = await outline.addRootItem(outlineLevel.GROUP, 'Target Module');
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
  const sourceRepo = await seedSourceRepository();
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const module = await outline.addRootItem(outlineLevel.GROUP, 'Target Module');
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

test('can link a leaf activity via footer button', async ({ page }) => {
  const sourceRepo = await seedSourceRepository();
  await toEmptyRepository(page);
  // Use the footer "Link Existing" button on empty repository
  const linkBtn = page.getByRole('button', { name: 'Link Existing' });
  await expect(linkBtn).toBeVisible();
  await linkBtn.click();
  const linkDialog = new LinkContentDialog(page);
  await linkDialog.selectAndLink(
    sourceRepo.name,
    outlineSeed.primaryPage.title,
  );
  // Verify linked activity appears
  const outline = new ActivityOutline(page);
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
  await sourceOutline.addRootItem(outlineLevel.LEAF, 'Empty Page');
  const targetRepo = await toEmptyRepository(page, 'Target');
  const targetOutline = new ActivityOutline(page);
  const module = await targetOutline.addRootItem(outlineLevel.GROUP, 'Target Module');
  const linkDialog = await module.optionsMenu.linkContentInto();
  await linkDialog.selectAndLink(sourceRepo.name, 'Empty Page');
  // Navigate to linked page editor
  await targetOutline.toggleExpand();
  const linkedItem = await targetOutline.getOutlineItemByName('Empty Page');
  await linkedItem.select();
  const sidebar = new OutlineSidebar(page);
  await sidebar.openEditor();
  await page.waitForLoadState('networkidle');
  // Verify empty linked activity alert is shown
  const alert = page.locator('.content-containers-wrapper > .v-alert');
  await expect(alert).toContainText('without content');
  // Toolbar should show linked state
  const toolbar = new EditorToolbar(page);
  await toolbar.expectLinkedState();
  // No containers should be rendered
  await expect(page.locator('.content-containers')).not.toBeVisible();
  // Navigate back to structure and verify still linked
  await toStructurePage(page, { repositoryId: targetRepo.id } as any);
  const outline = new ActivityOutline(page);
  await outline.toggleExpand();
  const item = await outline.getOutlineItemByName('Empty Page');
  await expect(item.linkIcon).toBeVisible();
});

test('source activity rename propagates to linked copy', async ({ page }) => {
  const { activity, linkedActivity } = await seedLinkedRepositories();
  // Rename the source activity
  await toStructurePage(page, activity);
  const sourceOutline = new ActivityOutline(page);
  const { sidebar } = await sourceOutline.expandAndSelect(activity.uid);
  const newName = 'Renamed Source Activity';
  await sidebar.fillName(newName);
  // Navigate to target, linked copy should reflect the new name
  await toStructurePage(page, linkedActivity);
  const targetOutline = new ActivityOutline(page);
  await targetOutline.toggleExpand();
  const targetItem = await targetOutline.getOutlineItemByUid(
    linkedActivity.uid,
  );
  await expect(targetItem.el).toContainText(newName);
});

test('source activity deletion unlinks copies', async ({ page }) => {
  const { activity, linkedActivity } = await seedLinkedRepositories();
  // Navigate to source and delete
  await toStructurePage(page, activity);
  const sourceOutline = new ActivityOutline(page);
  const { item: sourceItem } = await sourceOutline.expandAndSelect(
    activity.uid,
  );
  await sourceItem.optionsMenu.remove();
  // Navigate to target, linked activity should no longer show indicator
  await toStructurePage(page, linkedActivity);
  const targetOutline = new ActivityOutline(page);
  const { sidebar } = await targetOutline.expandAndSelect(linkedActivity.uid);
  await sidebar.linkedIndicator.expectNotVisible();
});

test('reordering linked activity does not unlink it', async ({ page }) => {
  const { linkedActivity } = await seedLinkedRepositories();
  const targetRepoId = linkedActivity.repositoryId;
  await toStructurePage(page, linkedActivity);
  const outline = new ActivityOutline(page);
  // Add a sibling at root level to have something to reorder against
  await outline.addRootItem(outlineLevel.LEAF, 'Sibling Page');
  // Verify initial linked status
  await outline.toggleExpand();
  const linkedItem = await outline.getOutlineItemByUid(linkedActivity.uid);
  await expect(linkedItem.linkIcon).toBeVisible();
  // Reorder the linked activity via API (move to last position)
  await api.post(`${targetRepoId}/activities/${linkedActivity.id}/reorder`, {
    position: 1,
  });
  // Reload and verify reorder happened and link is preserved
  await page.reload({ waitUntil: 'networkidle' });
  await outline.toggleExpand();
  // Verify the linked activity is now last in the list
  const items = await outline.getOutlineItems();
  const lastItemUid = await items[items.length - 1].getUid();
  expect(lastItemUid).toBe(linkedActivity.uid);
  // Verify link is preserved
  const reorderedItem = await outline.getOutlineItemByUid(linkedActivity.uid);
  await expect(reorderedItem.linkIcon).toBeVisible();
  await reorderedItem.select();
  const sidebar = new OutlineSidebar(page);
  await sidebar.linkedIndicator.expectVisible();
  await sidebar.linkedIndicator.expectLinkedStatus();
});

test('clone preserves linked content fields', async ({ page }) => {
  const { activity, linkedActivity } = await seedLinkedRepositories();
  const targetRepoId = linkedActivity.repositoryId;
  // Clone the linked repository via API
  const { data: clonedRepo } = await api.post(`${targetRepoId}/clone`, {
    name: 'Cloned Linked Repo',
    description: 'Test clone',
  });
  // List activities in the cloned repository
  const { data: activities } = await api.get(
    `${clonedRepo.id}/activities/`,
  );
  // Find the cloned copy of the linked activity (by matching source)
  const clonedLinked = activities.find(
    (a: any) => a.sourceId === activity.id,
  );
  expect(clonedLinked).toBeDefined();
  expect(clonedLinked.isLinkedCopy).toBe(true);
  expect(clonedLinked.sourceModifiedAt).toBeDefined();
  // Verify in UI
  await toStructurePage(page, { repositoryId: clonedRepo.id } as any);
  const outline = new ActivityOutline(page);
  await outline.toggleExpand();
  const clonedItem = await outline.getOutlineItemByUid(clonedLinked.uid);
  await expect(clonedItem.linkIcon).toBeVisible();
});

test('linking activity with children creates single revision', async ({
  page,
}) => {
  const sourceRepo = await seedSourceRepository();
  const targetRepo = await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  // Link a group (which has child pages and content elements)
  const module = await outline.addRootItem(outlineLevel.GROUP, 'Target Module');
  const linkDialog = await module.optionsMenu.linkContentInto();
  await linkDialog.selectAndLink(sourceRepo.name, outlineSeed.group.title);
  // Navigate to history page
  const history = await RevisionHistory.goTo(page, targetRepo.id);
  // Should show "Linked" revision for the root activity only
  await history.expectRevisionExists(`Linked ${outlineSeed.group.title}`);
  // Count total revisions - should be 3:
  // 1. Created repository
  // 2. Created "Target Module"
  // 3. Linked "Introduction to Pizza Making" (single revision for group + children + elements)
  expect(await history.getCount()).toBe(3);
  // Verify NO separate "Created" revisions for child pages or elements
  await history.expectRevisionNotExists(
    `Created ${outlineSeed.primaryPage.title}`,
  );
});

test('unlinking activity does not create extra revision', async ({ page }) => {
  const { linkedActivity } = await seedLinkedRepositories();
  const targetRepoId = linkedActivity.repositoryId;
  // Count revisions before unlink
  const historyBefore = await RevisionHistory.goTo(page, targetRepoId);
  const revisionsBefore = await historyBefore.getCount();
  // Unlink the activity
  await toStructurePage(page, linkedActivity);
  const outline = new ActivityOutline(page);
  const { sidebar } = await outline.expandAndSelect(linkedActivity.uid);
  await sidebar.linkedIndicator.expectVisible();
  await sidebar.linkedIndicator.unlink();
  // Navigate to history page and verify no new revision created
  const historyAfter = await RevisionHistory.goTo(page, targetRepoId);
  const revisionsAfter = await historyAfter.getCount();
  // Unlink should not create a revision (hooks disabled by design)
  expect(revisionsAfter).toBe(revisionsBefore);
});

test('export and reimport strips linked content fields', async ({ page }) => {
  const { linkedActivity } = await seedLinkedRepositories();
  const targetRepoId = linkedActivity.repositoryId;
  // Navigate to linked repository settings and export
  await page.goto(`/repository/${targetRepoId}/root/settings/general`);
  await page.waitForLoadState('networkidle');
  const settingsPage = new GeneralSettings(page);
  await settingsPage.sidebar.getSidebarAction('Export').click();
  const dialog = page.locator('div[role="dialog"]');
  await expect(dialog.getByText('Repository export is ready.')).toBeVisible({
    timeout: 10000,
  });
  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Download' }).click();
  const download = await downloadPromise;
  const exportPath = `tmp/${download.suggestedFilename()}`;
  await download.saveAs(exportPath);
  // Import the exported archive via catalog UI
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const addRepoDialog = new AddRepositoryDialog(page);
  await addRepoDialog.open();
  await addRepoDialog.importTab.click();
  await addRepoDialog.archiveInput.click({ force: true });
  await addRepoDialog.archiveInput.setInputFiles(exportPath);
  const importName = `Reimported ${Date.now()}`;
  await addRepoDialog.nameInput.fill(importName);
  await addRepoDialog.descriptionInput.fill('reimport test');
  await addRepoDialog.createRepositoryBtn.click();
  await page.waitForTimeout(5000);
  // Find the imported repository
  const { data: repos } = await api.get();
  const importedRepo = repos.items.find((r: any) => r.name === importName);
  expect(importedRepo).toBeDefined();
  // List activities and verify linked fields are stripped
  const { data: activities } = await api.get(
    `${importedRepo.id}/activities/`,
  );
  expect(activities.length).toBeGreaterThan(0);
  for (const activity of activities) {
    expect(activity.isLinkedCopy).toBeFalsy();
    expect(activity.sourceId).toBeNull();
  }
});

test('linked activity editor is disabled with toolbar actions', async ({
  page,
}) => {
  const { linkedActivity } = await seedLinkedRepositories();
  await toEditorPage(page, linkedActivity);
  const toolbar = new EditorToolbar(page);
  const editor = new Editor(page);
  // Toolbar shows linked state with View source and Unlink buttons
  await toolbar.expectLinkedState();
  // Add element button should not be visible (editor is disabled)
  await expect(editor.addElementDialog.addBtn).not.toBeVisible();
  // Content elements should be visible but in disabled/readonly state
  const element = editor.getElement();
  await expect(element.el).toBeVisible();
});

test('unlinking from editor toolbar enables editing', async ({ page }) => {
  const { linkedActivity } = await seedLinkedRepositories();
  await toEditorPage(page, linkedActivity);
  const toolbar = new EditorToolbar(page);
  const editor = new Editor(page);
  // Verify disabled state
  await toolbar.expectLinkedState();
  await expect(editor.addElementDialog.addBtn).not.toBeVisible();
  await editor.expectAllElementsLinked();
  // Unlink
  await toolbar.unlink();
  // Toolbar reverts, elements unlocked, add button visible
  await toolbar.expectDefaultState();
  await editor.expectAllElementsLinked(false);
  await expect(editor.addElementDialog.addBtn).toBeVisible();
  // Verify persistence
  await page.reload({ waitUntil: 'networkidle' });
  await toolbar.expectDefaultState();
  await editor.expectAllElementsLinked(false);
  // Linked indicator should be gone on structure page
  await toStructurePage(page, linkedActivity);
  const outline = new ActivityOutline(page);
  const { sidebar } = await outline.expandAndSelect(linkedActivity.uid);
  await sidebar.linkedIndicator.expectNotVisible();
});

test('can navigate to source from editor toolbar', async ({ page }) => {
  const { activity, repository, linkedActivity } = await seedLinkedRepositories();
  await toEditorPage(page, linkedActivity);
  const toolbar = new EditorToolbar(page);
  await toolbar.expectLinkedState();
  await toolbar.viewSource();
  // Should navigate to the source repository with the source activity selected
  await expect(page).toHaveURL(
    new RegExp(`/repository/${repository.id}.*activityId=${activity.id}`),
  );
  const outline = new ActivityOutline(page);
  await outline.toggleExpand();
  const sourceItem = await outline.getOutlineItemByUid(activity.uid);
  await expect(sourceItem.el).toBeVisible();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
