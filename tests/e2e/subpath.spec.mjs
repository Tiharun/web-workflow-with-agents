// 배포본은 하위 경로(/<저장소>/)에 있다. 로컬 루트(/)에서는 드러나지 않는 경로 오류를 여기서 잡는다.
import { test, expect } from '@playwright/test';
import { serveAsPages, openPage } from './helpers.mjs';
import { siteConfig } from '../../js/site-config.js';

const cases = [
  { name: 'home', path: '#/' },
  { name: 'guide', path: '#/final' },
  { name: 'deep missing path (404.html)', path: 'a/b/c' },
];

for (const c of cases) {
  test(`sub-path ${c.name}: no failed requests or console errors`, async ({ page }) => {
    await serveAsPages(page);
    const url = new URL(c.path, siteConfig.site.url).href;
    const failed = [];
    const errors = [];
    page.on('response', (r) => r.status() >= 400 && r.url() !== url && failed.push(`${r.status()} ${r.url()}`));
    page.on('requestfailed', (r) => failed.push(`failed ${r.url()}`));
    page.on('console', (m) => m.type() === 'error' && m.location().url !== url && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url, { waitUntil: 'networkidle' });
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('.site-footer .brand')).toHaveText(siteConfig.site.name);
    expect(failed).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('sub-path deep 404 is styled and links back into the site', async ({ page }) => {
  await serveAsPages(page);
  await page.goto(new URL('a/b/c', siteConfig.site.url).href);
  await expect(page.locator('.guide-nav__btn')).toHaveCount(siteConfig.guides.length);
  expect(await page.evaluate(() => getComputedStyle(document.body).display)).toBe('flex');
  await expect(page.locator('.site-footer__list a').first()).toHaveJSProperty('href', `${siteConfig.site.url}#/${siteConfig.guides[0].id}`);
});

test.describe('deep 404 without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('is styled and its home link points at the site root', async ({ page }) => {
    await serveAsPages(page);
    await page.goto(new URL('a/b/c', siteConfig.site.url).href);
    expect(await page.evaluate(() => getComputedStyle(document.body).display)).toBe('flex');
    await expect(page.locator('main .state__links a')).toHaveJSProperty('href', siteConfig.site.url);
  });
});
test('local 404 home link follows the base address when JS is on', async ({ page }) => {
  await openPage(page, '/404.html');
  await expect(page.locator('main [data-home]')).toHaveJSProperty('href', 'http://127.0.0.1:8123/');
});
