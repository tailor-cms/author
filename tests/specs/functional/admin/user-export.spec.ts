import type { Download } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

import {
  GroupManagement,
  UserGroupUserList,
} from '../../../pom/admin/GroupManagement.ts';
import { ADMIN_TEST_USER } from '../../../fixtures/auth.ts';
import { UserManagement } from '../../../pom/admin/UserManagement.ts';
import SeedClient from '../../../api/SeedClient.ts';

const ADMIN_EMAIL = ADMIN_TEST_USER.email;
const BASE_HEADER =
  '"Email","First name","Last name","Role","Date created","Status"';

/**
 * Reads a downloaded CSV into its raw lines - `[header, ...records]`.
 */
const readCsv = async (download: Download) => {
  const path = await download.path();
  const content = await readFile(path, 'utf8');
  return content
    .replace(/^\uFEFF/, '')
    .trimEnd()
    .split('\r\n');
};

const findRow = (rows: string[], email: string) =>
  rows.find((row) => row.includes(email));

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await page.goto(UserManagement.route);
});

test('should be able to export users as a CSV', async ({ page }) => {
  const userManagement = new UserManagement(page);
  const dialog = await userManagement.openExportDialog();
  const download = await dialog.export();
  expect(download.suggestedFilename()).toMatch(
    /^users-\d{4}-\d{2}-\d{2}\.csv$/,
  );
  const [header] = await readCsv(download);
  expect(header).toEqual(BASE_HEADER);
});

test('should export active users with their status', async ({ page }) => {
  const userManagement = new UserManagement(page);
  const dialog = await userManagement.openExportDialog();
  const rows = await readCsv(await dialog.export());
  expect(findRow(rows, ADMIN_EMAIL)).toContain('"Active"');
});

test('should be able to include user groups', async ({ page }) => {
  const group = 'Export QA Group';
  await GroupManagement.create(page, group, { visit: true });
  await new UserGroupUserList(page).addUser(ADMIN_EMAIL);
  await page.goto(UserManagement.route);
  const userManagement = new UserManagement(page);
  const dialog = await userManagement.openExportDialog();
  await dialog.includeUserGroups();
  const rows = await readCsv(await dialog.export());
  expect(rows[0]).toEqual(`${BASE_HEADER},"User groups"`);
  expect(findRow(rows, ADMIN_EMAIL)).toContain(`"${group}"`);
});

test('should exclude archived users unless included', async ({ page }) => {
  const email = 'tools+export@gostudion.com';
  const userManagement = new UserManagement(page);
  await userManagement.addUser(email);
  await userManagement.archiveUser(email);
  const dialog = await userManagement.openExportDialog();
  const activeRows = await readCsv(await dialog.export());
  expect(findRow(activeRows, email)).toBeUndefined();
  await userManagement.archiveToggle.click();
  const archiveDialog = await userManagement.openExportDialog();
  const allRows = await readCsv(await archiveDialog.export());
  expect(findRow(allRows, email)).toContain('"Archived"');
});

test('should neutralise spreadsheet formulas in exported text', async ({
  page,
}) => {
  const email = 'tools+formula@gostudion.com';
  const userManagement = new UserManagement(page);
  await userManagement.addUser(email, '=cmd|calc');
  const dialog = await userManagement.openExportDialog();
  const rows = await readCsv(await dialog.export());
  expect(findRow(rows, email)).toContain(`"'=cmd|calc"`);
});

test('should export only the users matching the search', async ({ page }) => {
  const userManagement = new UserManagement(page);
  await userManagement.searchInput.fill(ADMIN_EMAIL);
  await expect(userManagement.userEntriesLocator).toHaveCount(1);
  const dialog = await userManagement.openExportDialog();
  const rows = await readCsv(await dialog.export());
  expect(rows).toHaveLength(2);
  expect(rows[1]).toContain(ADMIN_EMAIL);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
