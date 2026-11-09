// JS 없이 보이는 정적 문구가 siteConfig와 같은지(스펙 §2-2 예외 조항).
import { test, expect } from '@playwright/test';
import { siteConfig } from '../../js/site-config.js';
import { serveAsPages } from './helpers.mjs';

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
  // 404.html은 절대 주소(site.url)를 쓴다. 배포 주소를 흉내 내야 CSS 요청이 밖으로 나가지 않는다.
  await serveAsPages(page);
  await page.goto(new URL('404.html', site.url).href);
  await expect(page.locator('[data-home]')).toHaveCount(2);
  for (const a of await page.locator('[data-home]').all()) await expect(a).toHaveAttribute('href', site.url);
  const css = await page.locator('noscript').first().evaluate((n) => [...n.innerHTML.matchAll(/href="([^"]+)"/g)].map((m) => m[1]));
  expect(css).toEqual([`${site.url}vendor/fonts/pretendard/pretendardvariable-dynamic-subset.css`, `${site.url}css/site.css`]);
  await expect(page).toHaveTitle(`${ui.pageNotFoundDocTitle} | ${site.name}`);
  await expect(page.locator('.site-header .brand')).toHaveText(site.name);
  const box = page.locator('main .state');
  await expect(box.locator('h1')).toHaveText(ui.pageNotFoundTitle);
  await expect(box.locator('p')).toHaveText(ui.pageNotFoundBody);
  await expect(box.locator('a')).toHaveText(ui.backHome);
});
