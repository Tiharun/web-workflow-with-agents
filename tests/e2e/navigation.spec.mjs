// 탐색(M3): 현재 위치 강조, 메가메뉴·모바일 메뉴, 목차 드로어, smooth scroll, 단계 0개.
import { test, expect } from '@playwright/test';
import { openPage, twoFrames, tocIds } from './helpers.mjs';
import { siteConfig } from '../../js/site-config.js';

const current = (page) => page.locator('#toc a[aria-current="location"]');
const middle = (ids) => ids[Math.floor(ids.length / 2)];

test.describe('current location', () => {
  for (const width of [1280, 375]) {
    test.describe(`${width}px`, () => {
      test.use({ viewport: { width, height: 800 } });
      test('scrolling to a heading highlights it', async ({ page }) => {
        await openPage(page, '/#/final');
        const id = middle(await tocIds(page));
        await page.evaluate((i) => document.getElementById(i).scrollIntoView({ block: 'start', behavior: 'instant' }), id);
        await twoFrames(page);
        await expect(current(page)).toHaveCount(1);
        await expect(current(page)).toHaveAttribute('data-toc-id', id);
      });
    });
  }

  test('opening the toc after a stage jump shows and focuses that stage', async ({ page }) => {
    await openPage(page, '/#/final');
    const id = middle(await tocIds(page));
    await openPage(page, `/#/final/${encodeURIComponent(id)}`);
    await twoFrames(page);
    await page.locator('[data-toc-open]').click();
    await expect(current(page)).toHaveCount(1);
    await expect(current(page)).toHaveAttribute('data-toc-id', id);
    await expect(current(page)).toBeFocused();
  });

  for (const g of siteConfig.guides) {
    test(`page bottom highlights the last heading (${g.id})`, async ({ page }) => {
      await openPage(page, `/#/${g.id}`);
      const ids = await tocIds(page);
      await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      await twoFrames(page);
      await expect(current(page)).toHaveAttribute('data-toc-id', ids.at(-1));
    });
  }
});
