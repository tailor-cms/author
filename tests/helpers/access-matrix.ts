import type { APIResponse, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { ActivityOutline } from '../pom/repository/Outline';
import { Catalog } from '../pom/catalog/Catalog';
import { GeneralSettings } from '../pom/repository/RepositorySettings';
import { NavigationRail } from '../pom/repository/NavigationRail';
import { RepositoryCard } from '../pom/catalog/RepositoryCard';
import SeedClient from '../api/SeedClient';

// Actions an admin-standing user is offered on a catalog card, in order.
const ADMIN_ACTIONS = ['Clone', 'Publish', 'Export', 'Delete'];

export type SeededRepository = { id: number; name: string };

export type RepositoryAccessScenario = {
  title: string;
  // Seeds the scenario (the DB is reset first) and returns the repository
  // the acting user is expected to be able to view.
  seed: () => Promise<SeededRepository>;
  // Whether the acting user has repository admin standing.
  isAdmin: boolean;
};

// Opens the catalog and returns the card for the named repository.
export const openCard = async (page: Page, name: string) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const catalog = new Catalog(page);
  const el = catalog.findRepositoryCard(name);
  await expect(el).toBeVisible();
  return new RepositoryCard(page, el);
};

const expect403 = async (response: Promise<APIResponse>) => {
  expect((await response).status()).toBe(403);
};

/**
 * Generates a scenario's access checks: catalog card, in-repo navigation,
 * settings and API. One rule drives them all; repository admins get full
 * access, everyone else is blocked.
 */
export const verifyRepositoryAccess = ({
  title,
  seed,
  isAdmin,
}: RepositoryAccessScenario) => {
  test.describe(title, () => {
    test.beforeEach(() => SeedClient.resetDatabase());

    test('shows card controls to admins only', async ({ page }) => {
      const { name } = await seed();
      const card = await openCard(page, name);
      await card.el.hover();
      if (!isAdmin) {
        await expect(card.settingsBtn).not.toBeVisible();
        await expect(card.selectCheckbox).not.toBeVisible();
        await expect(card.actionsBtn).not.toBeVisible();
        return;
      }
      await expect(card.settingsBtn).toBeVisible();
      await expect(card.selectCheckbox).toBeVisible();
      expect(await card.getActionLabels()).toEqual(ADMIN_ACTIONS);
    });

    test('shows the Settings tab and actions menu to admins only', async ({
      page,
    }) => {
      const { id } = await seed();
      await page.goto(ActivityOutline.getRoute(id));
      const rail = new NavigationRail(page);
      await expect(rail.getTab('Structure')).toBeVisible();
      if (isAdmin) {
        await expect(rail.getTab('Settings')).toBeVisible();
        await expect(rail.actionsMenuBtn).toBeVisible();
        return;
      }
      await expect(rail.getTab('Settings')).not.toBeVisible();
      await expect(rail.actionsMenuBtn).not.toBeVisible();
    });

    test('opens the settings page to admins only', async ({ page }) => {
      const { id } = await seed();
      await page.goto(GeneralSettings.getRoute(id));
      // Admins stay on settings; everyone else is redirected to the catalog.
      const expectedUrl = isAdmin ? GeneralSettings.getRoute(id) : '/';
      await expect(page).toHaveURL(expectedUrl);
    });

    // Non-admins must be refused at the API, independent of the hidden UI.
    if (isAdmin) return;

    test('rejects privileged API calls with 403', async ({ page }) => {
      const { id } = await seed();
      const base = `/api/repositories/${id}`;
      await expect403(page.request.delete(base));
      await expect403(page.request.post(`${base}/publish`));
      await expect403(page.request.patch(base, { data: { name: 'Nope' } }));
      await expect403(page.request.get(`${base}/export/setup`));
      await expect403(
        page.request.post(`${base}/clone`, {
          data: { name: 'Cloned', description: 'Cloned' },
        }),
      );
    });
  });
};
