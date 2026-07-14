import { expect, test } from '@playwright/test';

import {
  type RepositoryAccessScenario,
  openCard,
  verifyRepositoryAccess,
} from '../../../helpers/access-matrix.ts';
import {
  addRepositoryMember,
  createCleanRepository,
} from '../../../helpers/seed.ts';
import {
  GroupManagement,
  UserGroupUserList,
} from '../../../pom/admin/GroupManagement.ts';
import { AdminSection } from '../../../pom/admin/Admin.ts';
import { AddRepositoryDialog } from '../../../pom/catalog/AddRepository.ts';
import { AppBar } from '../../../pom/common/AppBar.ts';
import { DEFAULT_TEST_USER } from '../../../fixtures/auth.ts';
import { ActivityOutline } from '../../../pom/repository/Outline.ts';
import { Toast } from '../../../pom/common/Toast.ts';
import SeedClient from '../../../api/SeedClient.ts';

const REPOSITORY_NAME = 'Access Test Repository';

const seedMemberRepository = async (role: 'ADMIN' | 'AUTHOR') => {
  const repository = await createCleanRepository(REPOSITORY_NAME);
  await addRepositoryMember(repository.id, DEFAULT_TEST_USER.email, role);
  return repository;
};

const seedGroupRepository = async (role: 'ADMIN' | 'USER') => {
  const { data } = await SeedClient.seedUser({
    email: DEFAULT_TEST_USER.email,
    userGroup: { name: 'Test Group', role },
  });
  return createCleanRepository(REPOSITORY_NAME, [data.userGroup.id]);
};

test.describe('Default user role, without User Group assignment', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
  });

  test('should be able to create Repository', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const dialog = new AddRepositoryDialog(page);
    await dialog.open();
    await dialog.createRepository();
  });

  test('should not see the Admin menu entry', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const appBar = new AppBar(page);
    await expect(appBar.catalogLink).toBeVisible();
    await expect(appBar.adminLink).not.toBeVisible();
  });

  test('should not be able to access User Management', async ({ page }) => {
    await AdminSection.goToUserManagement(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Group management', async ({ page }) => {
    await AdminSection.goToGroupManagement(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Structure Types', async ({ page }) => {
    await AdminSection.goToStructuresPage(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Installed Elements', async ({ page }) => {
    await AdminSection.goToInstalledElementsList(page);
    await expect(page).toHaveURL('/');
  });
});

test.describe('Default user role, added to a User Group as Admin,', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
    await SeedClient.seedUser({
      email: DEFAULT_TEST_USER.email,
      userGroup: { name: 'Test', role: 'ADMIN' },
    });
  });

  test('should be able to create Repository', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const dialog = new AddRepositoryDialog(page);
    await dialog.open();
    await dialog.createRepository();
  });

  test('should see the Admin menu entry', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const appBar = new AppBar(page);
    await expect(appBar.adminLink).toBeVisible();
  });

  test('should be able to access group listing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const appBar = new AppBar(page);
    await expect(appBar.adminLink).toBeVisible();
    await appBar.adminLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(AdminSection.groupManagementRoute);
  });

  test('should be able to access user group page', async ({ page }) => {
    await GroupManagement.goToGroupByName(page, 'Test');
  });

  test('should not be able to access group actions', async ({ page }) => {
    const groupManagement = await GroupManagement.visit(page);
    const groupEntry = await groupManagement.getEntryByName('Test');
    await expect(groupEntry.editBtn).not.toBeVisible();
    await expect(groupEntry.removeBtn).not.toBeVisible();
  });

  test('should be able to assign user to a group', async ({ page }) => {
    await GroupManagement.goToGroupByName(page, 'Test');
    const userGroupUserList = new UserGroupUserList(page);
    await userGroupUserList.addUser('test_user@gostudion.com', 'User');
  });

  test('should be able to remove user from a group', async ({ page }) => {
    await GroupManagement.goToGroupByName(page, 'Test');
    const userGroupUserList = new UserGroupUserList(page);
    await userGroupUserList.addUser('test_user@gostudion.com', 'User');
    await userGroupUserList.removeUser('test_user@gostudion.com');
  });

  test('should not be able to access User Management', async ({ page }) => {
    await AdminSection.goToUserManagement(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Structure Types', async ({ page }) => {
    await AdminSection.goToStructuresPage(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Installed Elements', async ({ page }) => {
    await AdminSection.goToInstalledElementsList(page);
    await expect(page).toHaveURL('/');
  });
});

test.describe('Default user role, added to a User Group as Default User,', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
    await SeedClient.seedUser({
      email: DEFAULT_TEST_USER.email,
      userGroup: { name: 'Test', role: 'USER' },
    });
  });

  test('should be able to create Repository', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const dialog = new AddRepositoryDialog(page);
    await dialog.open();
    await dialog.createRepository();
  });

  test('should not see the Admin menu entry', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const appBar = new AppBar(page);
    await expect(appBar.catalogLink).toBeVisible();
    await expect(appBar.adminLink).not.toBeVisible();
  });

  test('should not be able to access Group management', async ({ page }) => {
    await AdminSection.goToGroupManagement(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access User Management', async ({ page }) => {
    await AdminSection.goToUserManagement(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Structure Types', async ({ page }) => {
    await AdminSection.goToStructuresPage(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Installed Elements', async ({ page }) => {
    await AdminSection.goToInstalledElementsList(page);
    await expect(page).toHaveURL('/');
  });
});

test.describe('Default user role, added to a Group with Colaborator role', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
    await SeedClient.seedUser({
      email: DEFAULT_TEST_USER.email,
      userGroup: { name: 'Test', role: 'COLLABORATOR' },
    });
  });

  test('should be able to create Repository', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const dialog = new AddRepositoryDialog(page);
    await dialog.open();
    await dialog.createRepository();
  });

  test('should not see the Admin menu entry', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const appBar = new AppBar(page);
    await expect(appBar.catalogLink).toBeVisible();
    await expect(appBar.adminLink).not.toBeVisible();
  });

  test('should not be able to access User Management', async ({ page }) => {
    await AdminSection.goToUserManagement(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Group management', async ({ page }) => {
    await AdminSection.goToGroupManagement(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Structure Types', async ({ page }) => {
    await AdminSection.goToStructuresPage(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Installed Elements', async ({ page }) => {
    await AdminSection.goToInstalledElementsList(page);
    await expect(page).toHaveURL('/');
  });
});

// Per-repository access matrix
const REPOSITORY_ACCESS_SCENARIOS: RepositoryAccessScenario[] = [
  {
    title: 'Default user with AUTHOR role on a repository',
    isAdmin: false,
    seed: () => seedMemberRepository('AUTHOR'),
  },
  {
    title: 'Default user with ADMIN role on a repository',
    isAdmin: true,
    seed: () => seedMemberRepository('ADMIN'),
  },
  {
    title: 'Default user viewing a repository shared with their group',
    isAdmin: false,
    seed: () => seedGroupRepository('USER'),
  },
  // Regression: group admins used to get no card controls (tailor#749)
  {
    title: 'Default user as ADMIN of a group a repository is shared with',
    isAdmin: true,
    seed: () => seedGroupRepository('ADMIN'),
  },
];

REPOSITORY_ACCESS_SCENARIOS.forEach(verifyRepositoryAccess);

// A repository admin can run the card actions.
test.describe('Default user acting on a repository they administer', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
    const repository = await createCleanRepository(REPOSITORY_NAME);
    await addRepositoryMember(repository.id, DEFAULT_TEST_USER.email, 'ADMIN');
  });

  test('clones from the card', async ({ page }) => {
    const card = await openCard(page, REPOSITORY_NAME);
    await card.clone('Cloned by default admin');
    await new Toast(page).expectCloned(REPOSITORY_NAME);
  });

  test('publishes from the card', async ({ page }) => {
    const card = await openCard(page, REPOSITORY_NAME);
    await card.publish();
    await new Toast(page).expectPublished(REPOSITORY_NAME);
  });

  test('deletes from the card', async ({ page }) => {
    const card = await openCard(page, REPOSITORY_NAME);
    await card.delete();
    await new Toast(page).expectDeleted(REPOSITORY_NAME);
    await expect(card.el).not.toBeVisible();
  });
});

test.describe('Default user opening a repository without access', () => {
  test.beforeEach(() => SeedClient.resetDatabase());

  // A non-member hitting a repository URL is bounced to the catalog with an
  // access-denied toast
  test('returns to the catalog with an access-denied toast', async ({
    page,
  }) => {
    const repository = await createCleanRepository(REPOSITORY_NAME);
    await page.goto(ActivityOutline.getRoute(repository.id));
    await expect(page).toHaveURL('/');
    await new Toast(page).expectRepositoryAccessDenied();
    await expect(new AppBar(page).catalogLink).toBeVisible();
  });
});
