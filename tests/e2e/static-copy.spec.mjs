// JS 없이 보이는 정적 문구가 siteConfig와 같은지(스펙 §2-2 예외 조항).
import { test, expect } from '@playwright/test';
import { siteConfig } from '../../js/site-config.js';

const { site, ui, guides } = siteConfig;
test.use({ javaScriptEnabled: false });

test('index.html static copy matches siteConfig', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(site.name);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', site.description);
  await expect(page.locator('.skip-link')).toHaveText(ui.skip);
  const box = page.locator('main .state');
  await expect(box.locator('h1')).toHaveText(ui.noscriptTitle);
  await expect(box.locator('p')).toHaveText(ui.noscriptBody);
  const links = box.locator('a');
  await expect(links).toHaveCount(guides.length);
  for (const [i, g] of guides.entries()) {
    await expect(links.nth(i)).toHaveAttribute('href', g.file);
    await expect(links.nth(i)).toHaveText(g.menuLabel);
  }
});

test('404.html static copy matches siteConfig', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page).toHaveTitle(`${ui.pageNotFoundDocTitle} | ${site.name}`);
  await expect(page.locator('.site-header .brand')).toHaveText(site.name);
  const box = page.locator('main .state');
  await expect(box.locator('h1')).toHaveText(ui.pageNotFoundTitle);
  await expect(box.locator('p')).toHaveText(ui.pageNotFoundBody);
  await expect(box.locator('a')).toHaveText(ui.backHome);
});
