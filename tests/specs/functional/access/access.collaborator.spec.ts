import { expect, test } from '@playwright/test';

import { AdminSection } from '../../../pom/admin/Admin.ts';
import { AddRepositoryDialog } from '../../../pom/catalog/AddRepository.ts';
import { AppBar } from '../../../pom/common/AppBar.ts';
import { COLLAB_TEST_USER } from '../../../fixtures/auth.ts';
import {
  GroupManagement,
  UserGroupUserList,
} from '../../../pom/admin/GroupManagement.ts';
import {
  RepositoryGroups,
  RepositoryMembers,
} from '../../../pom/repository/RepositorySettings.ts';
import { ActivityOutline } from '../../../pom/repository/Outline.ts';
import { Toast } from '../../../pom/common/Toast.ts';
import SeedClient from '../../../api/SeedClient.ts';
import {
  addRepositoryMember,
  createCleanRepository,
  toEmptyRepository,
} from '../../../helpers/seed.ts';
import {
  openCard,
  verifyRepositoryAccess,
  type RepositoryAccessScenario,
} from '../../../helpers/access-matrix.ts';

const REPOSITORY_NAME = 'Access Test Repository';

const seedMemberRepository = async (role: 'ADMIN' | 'AUTHOR') => {
  const repository = await createCleanRepository(REPOSITORY_NAME);
  await addRepositoryMember(repository.id, COLLAB_TEST_USER.email, role);
  return repository;
};

const seedGroupRepository = async (role: 'ADMIN' | 'COLLABORATOR') => {
  const { data } = await SeedClient.seedUser({
    email: COLLAB_TEST_USER.email,
    userGroup: { name: 'Test Group', role },
  });
  return createCleanRepository(REPOSITORY_NAME, [data.userGroup.id]);
};

test.describe('Collaborator, without User Group assignment', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
  });

  test('should not be able to create Repository', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const dialog = new AddRepositoryDialog(page);
    await expect(dialog.openDialogBtn).not.toBeVisible();
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

test.describe('Collaborator added to a User Group as Admin,', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
    await SeedClient.seedUser({
      email: COLLAB_TEST_USER.email,
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

  test('should be able to access user listing', async ({ page }) => {
    const repository = await toEmptyRepository(page, 'Test', [1]);
    const membersRoute = RepositoryMembers.getRoute(repository.id);
    await page.goto(membersRoute);
    const access = new RepositoryMembers(page);
    await expect(access.rail.el).toBeVisible();
    await expect(access.userList).toBeVisible();
    await expect(page).toHaveURL(membersRoute);
  });

  test('should be able to access repository group listing', async ({
    page,
  }) => {
    const repository = await toEmptyRepository(page, 'Test', [1]);
    const groupsRoute = RepositoryGroups.getRoute(repository.id);
    await page.goto(groupsRoute);
    const access = new RepositoryGroups(page);
    await expect(access.rail.el).toBeVisible();
    await expect(access.groupList).toBeVisible();
    await expect(page).toHaveURL(groupsRoute);
  });
});

test.describe('Collaborator added to a User Group as Default User,', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
    await SeedClient.seedUser({
      email: COLLAB_TEST_USER.email,
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

  test('should not be able to access settings', async ({ page }) => {
    const repository = await toEmptyRepository(page, 'Test', [1]);
    const accessRoute = RepositoryMembers.getRoute(repository.id);
    await page.goto(accessRoute, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL('/');
  });
});

test.describe('Collaborator added to a User Group with Colaborator role', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
    await SeedClient.seedUser({
      email: COLLAB_TEST_USER.email,
      userGroup: { name: 'Test', role: 'COLLABORATOR' },
    });
  });

  test('should not be able to create Repository', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const dialog = new AddRepositoryDialog(page);
    await expect(dialog.openDialogBtn).not.toBeVisible();
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

  test('should not be able to access settings', async ({ page }) => {
    const repository = await toEmptyRepository(page, 'Test', [1]);
    const accessRoute = RepositoryMembers.getRoute(repository.id);
    await page.goto(accessRoute, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL('/');
  });
});

// Per-repository access matrix
const REPOSITORY_ACCESS_SCENARIOS: RepositoryAccessScenario[] = [
  {
    title: 'Collaborator with AUTHOR role on a repository',
    isAdmin: false,
    seed: () => seedMemberRepository('AUTHOR'),
  },
  // Admin standing overrides the COLLABORATOR system role.
  {
    title: 'Collaborator with ADMIN role on a repository',
    isAdmin: true,
    seed: () => seedMemberRepository('ADMIN'),
  },
  {
    title: 'Collaborator viewing a repository shared with their group',
    isAdmin: false,
    seed: () => seedGroupRepository('COLLABORATOR'),
  },
  {
    title: 'Collaborator as ADMIN of a group a repository is shared with',
    isAdmin: true,
    seed: () => seedGroupRepository('ADMIN'),
  },
];

REPOSITORY_ACCESS_SCENARIOS.forEach(verifyRepositoryAccess);

// A repository admin can run the card actions
test.describe('Collaborator acting on a repository they administer', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
    const repository = await createCleanRepository(REPOSITORY_NAME);
    await addRepositoryMember(repository.id, COLLAB_TEST_USER.email, 'ADMIN');
  });

  test('clones from the card', async ({ page }) => {
    const card = await openCard(page, REPOSITORY_NAME);
    await card.clone('Cloned by collaborator');
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

test.describe('Collaborator opening a repository without access', () => {
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

test.describe('Group admin opening a group they do not administer', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
    await SeedClient.seedUser({
      email: COLLAB_TEST_USER.email,
      userGroup: { name: 'Group A', role: 'ADMIN' },
    });
    await SeedClient.seedUser({
      email: COLLAB_TEST_USER.email,
      userGroup: { name: 'Group B', role: 'USER' },
    });
  });

  test('should return to group listing without being logged out', async ({
    page,
  }) => {
    const groupManagement = await GroupManagement.visit(page);
    const entry = await groupManagement.getEntryByName('Group B');
    await entry.el.getByRole('link', { name: 'Group B' }).click();
    await expect(page).toHaveURL(/admin\/user-groups\/?$/);
    await expect(groupManagement.groupTable).toBeVisible();
  });
});
