// 라우팅·상태(M1): 찾을 수 없음, 없는 단계, md 불러오기 실패.
import { test, expect } from '@playwright/test';
import { siteConfig } from '../../js/site-config.js';
import { pages, openPage } from './helpers.mjs';

const { ui, site, guides } = siteConfig;
const finalH1 = pages.find((p) => p.name === 'final').h1;

test('unknown hash shows not-found with links to every guide', async ({ page }) => {
  await openPage(page, '/#/없는주소');
  await expect(page.locator('h1')).toHaveText(ui.notFoundTitle);
  const links = page.locator('main .state__links a');
  await expect(links).toHaveCount(guides.length);
  for (const [i, g] of guides.entries()) {
    await expect(links.nth(i)).toHaveAttribute('href', `#/${g.id}`);
    await expect(links.nth(i)).toHaveText(g.menuLabel);
  }
  await links.first().click();
  await expect(page.locator('#doc h1')).toHaveText(finalH1);
});

test('broken percent-encoding in the hash does not throw', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openPage(page, '/#/%E0%A4%A');
  await expect(page.locator('h1')).toHaveText(ui.notFoundTitle);
  await openPage(page, '/#/final/%E0%A4%A');
  await expect(page.locator('.notice')).toHaveText(ui.stageMissing);
  expect(errors).toEqual([]);
});
