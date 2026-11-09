// tests/e2e/convenience.spec.mjs — [⬇ md] 한글 원래 이름, 다크 모드(기기 설정 + 토글 기억). 스펙 §8 M4.
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { openPage, serveAsPages } from './helpers.mjs';
import { siteConfig } from '../../js/site-config.js';

const { guides, site } = siteConfig;
const download = async (page) => {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('.guide-tools a[download]').click()]);
  return dl;
};

for (const g of guides) {
  test(`md download keeps the Korean name and the exact bytes (${g.id})`, async ({ page }) => {
    await openPage(page, `/#/${g.id}`);
    const dl = await download(page);
    expect(dl.suggestedFilename()).toBe(g.downloadName);
    expect(readFileSync(await dl.path())).toEqual(readFileSync(g.file));
  });
}

test('md download keeps the Korean name under the deployed sub-path', async ({ page }) => {
  await serveAsPages(page);
  await page.goto(`${site.url}#/${guides[0].id}`);
  await page.locator('#doc[data-loaded]').waitFor();
  expect((await download(page)).suggestedFilename()).toBe(guides[0].downloadName);
});

const mode = (page) => page.evaluate(() => ({
  saved: document.documentElement.dataset.mode ?? null,
  scheme: getComputedStyle(document.documentElement).colorScheme,
  pressed: document.querySelector('.mode-toggle').getAttribute('aria-pressed'),
}));
const toggle = (page) => page.locator('.mode-toggle').click();

test.describe('device dark', () => {
  test.use({ colorScheme: 'dark' });
  test('follows the device setting when nothing is saved', async ({ page }) => {
    await openPage(page, '/#/');
    expect(await mode(page)).toEqual({ saved: null, scheme: 'dark', pressed: 'true' });
  });
});

test.describe('device light', () => {
  test.use({ colorScheme: 'light' });

  test('the toggle choice survives a reload and is set before the body paints', async ({ page }) => {
    await page.addInitScript(() => {
      new MutationObserver((_, o) => {
        if (!document.body) return;
        window.__modeAtBody = document.documentElement.dataset.mode ?? null;
        o.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });
    await openPage(page, '/#/');
    await toggle(page);
    expect(await mode(page)).toEqual({ saved: 'dark', scheme: 'dark', pressed: 'true' });
    await page.reload();
    expect(await page.evaluate(() => window.__modeAtBody)).toBe('dark');
    expect(await mode(page)).toEqual({ saved: 'dark', scheme: 'dark', pressed: 'true' });
  });

  test('a saved choice wins over later device changes', async ({ page }) => {
    await openPage(page, '/#/');
    await toggle(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.emulateMedia({ colorScheme: 'light' });
    expect(await mode(page)).toEqual({ saved: 'dark', scheme: 'dark', pressed: 'true' });
  });

  test('device changes are followed while nothing is saved', async ({ page }) => {
    await openPage(page, '/#/');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(async () => (await mode(page)).pressed).toBe('true');
    expect((await mode(page)).scheme).toBe('dark');
  });

  test('an unknown saved value is ignored', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mode', 'blue'));
    await openPage(page, '/#/');
    expect(await mode(page)).toEqual({ saved: null, scheme: 'light dark', pressed: 'false' }); // 저장값 없음 = 선언 기본값(tokens.css), 밝은 기기에서 밝게
  });

  test('blocked storage still switches this page without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }));
    await openPage(page, '/#/');
    await toggle(page);
    expect(await mode(page)).toEqual({ saved: 'dark', scheme: 'dark', pressed: 'true' });
    expect(errors).toEqual([]);
  });

  test('404 page uses the saved mode', async ({ page }) => {
    await openPage(page, '/#/');
    await toggle(page);
    await openPage(page, '/404.html');
    expect(await page.evaluate(() => [document.documentElement.dataset.mode, getComputedStyle(document.documentElement).colorScheme])).toEqual(['dark', 'dark']);
  });
});
