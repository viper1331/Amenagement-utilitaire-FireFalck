import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const SCENARIO_ONE_MODULES = [
  'MOD-RACK-ARI-DOUBLE',
  'MOD-DRAWER-1200',
  'MOD-DRAWER-800',
  'MOD-SHELF-ADJUST',
  'MOD-FAN-MOUNT',
];

const STRESS_MODULES = [
  'MOD-RACK-ARI-DOUBLE',
  'MOD-DRAWER-1200',
  'MOD-DRAWER-800',
  'MOD-SHELF-ADJUST',
  'MOD-FAN-MOUNT',
  'MOD-ABSORBENT-EPI',
  'MOD-WORKTOP-FOLD',
  'MOD-EXT-12KG',
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __downloads: unknown[]; __downloadClicks: number }).__downloads = [];
    (window as unknown as { __downloads: unknown[]; __downloadClicks: number }).__downloadClicks = 0;
    const originalCreateObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob: Blob) => {
      const url = originalCreateObjectURL(blob);
      const globalWindow = window as unknown as {
        __downloads: Array<{ url: string; type: string; size: number }>;
      };
      globalWindow.__downloads.push({ url, type: blob.type, size: blob.size });
      return url;
    };
    HTMLAnchorElement.prototype.click = function click() {
      const globalWindow = window as unknown as { __downloadClicks: number };
      globalWindow.__downloadClicks += 1;
    };
  });
});

const openApp = async (page: Page) => {
  await page.goto('/');
  await expect(page.getByText('Catalogue modules')).toBeVisible();
};

test('new project allows module placement and full export suite', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Nouveau' }).click();
  await expect(page.locator('[data-testid="scene-canvas"]')).toBeVisible();

  for (const sku of SCENARIO_ONE_MODULES) {
    const locator = page.locator(`[data-module-sku="${sku}"]`);
    await locator.waitFor({ state: 'visible' });
    await locator.dragTo(page.locator('[data-testid="scene-canvas"]'));
  }

  await page.getByRole('button', { name: 'Exporter' }).click();
  await page.waitForTimeout(500);

  const downloads = await page.evaluate(() => (window as unknown as { __downloads: Array<{ type: string }> }).__downloads);
  expect(downloads).toHaveLength(6);
  const mimeTypes = downloads.map((entry) => entry.type).sort();
  expect(mimeTypes).toEqual([
    'application/json',
    'application/pdf',
    'image/vnd.dxf',
    'model/gltf+json',
    'text/csv',
    'text/plain',
  ].sort());
});

test('demo project switches to English, toggles FPV, and saves', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Charger démonstration' }).click();
  await page.waitForFunction(() => {
    const store = (window as unknown as { __EDITOR_STORE__?: { getState: () => { project: { id: string } | null } } }).__EDITOR_STORE__;
    return store?.getState().project?.id === 'demo-vsav-2025';
  });

  await page.evaluate(() => {
    const store = (window as unknown as {
      __EDITOR_STORE__?: {
        getState: () => {
          setLanguage: (lang: 'fr' | 'en') => void;
        };
      };
    }).__EDITOR_STORE__;
    if (!store) {
      throw new Error('Store not available');
    }
    store.getState().setLanguage('en');
  });
  await page.waitForFunction(() => {
    const store = (window as unknown as { __EDITOR_STORE__?: { getState: () => { project: { settings: { language: string } } | null } } }).__EDITOR_STORE__;
    return store?.getState().project?.settings.language === 'en';
  });
  await expect(page.getByTestId('language-select')).toHaveValue('en');
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();

  await page.getByRole('button', { name: 'FPV' }).click();
  await page.evaluate(() => {
    const store = (window as unknown as {
      __EDITOR_STORE__?: {
        getState: () => { setViewMode: (mode: 'orbit' | 'fpv') => void };
      };
    }).__EDITOR_STORE__;
    if (!store) {
      throw new Error('Store not available');
    }
    store.getState().setViewMode('orbit');
  });
  const saveButton = page.getByRole('button', { name: 'Save' });
  await saveButton.waitFor({ state: 'visible' });
  await saveButton.evaluate((button) => (button as HTMLButtonElement).click());
  await page.waitForFunction(() => {
    const downloads = (window as unknown as { __downloads?: Array<unknown> }).__downloads;
    return Array.isArray(downloads) && downloads.length >= 1;
  });

  const downloads = await page.evaluate(() => (window as unknown as { __downloads: Array<{ type: string }> }).__downloads);
  expect(downloads).toHaveLength(1);
  expect(downloads[0]?.type).toBe('application/json');
});

test('stress scenario flags mass and walkway issues after stacking modules', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Charger démonstration' }).click();
  await page.waitForFunction(() => {
    const store = (window as unknown as { __EDITOR_STORE__?: { getState: () => { project: { id: string } | null } } }).__EDITOR_STORE__;
    return store?.getState().project?.id === 'demo-vsav-2025';
  });

  await page.evaluate((skus) => {
    const store = (window as unknown as {
      __EDITOR_STORE__?: {
        getState: () => {
          addModule: (sku: string, position: [number, number, number], rotation: [number, number, number]) => void;
        };
      };
    }).__EDITOR_STORE__;
    if (!store) {
      throw new Error('Store not available');
    }
    const { addModule } = store.getState();
    for (let index = 0; index < 30; index += 1) {
      const sku = skus[index % skus.length];
      const offsetX = 400 * (index % 6);
      const offsetY = 400 * Math.floor(index / 6) - 800;
      addModule(sku, [offsetX, offsetY, 0], [0, 0, 0]);
    }
  }, STRESS_MODULES);

  await expect(page.getByText('mass.payload.reserve').first()).toBeVisible();
  await expect(page.getByText('walkway.blocked').first()).toBeVisible();
});
