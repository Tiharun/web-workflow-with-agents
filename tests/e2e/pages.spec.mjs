import { test, expect } from '@playwright/test';
import { pages, openPage } from './helpers.mjs';
import { siteConfig } from '../../js/site-config.js';

for (const p of pages) {
  test(`${p.name} opens with its title`, async ({ page }) => {
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await openPage(page, p.path);
    await expect(page.locator('h1').first()).toHaveText(p.h1);
    expect(errors).toEqual([]);
  });
}

for (const p of pages) {
  test(`${p.name} has the shared footer`, async ({ page }) => {
    await openPage(page, p.path);
    const f = page.locator('footer.site-footer');
    await expect(f.locator('.brand')).toHaveText(siteConfig.site.name);
    await expect(f.locator('.site-footer__list a')).toHaveText(siteConfig.guides.map((g) => g.menuLabel));
    await expect(f.getByRole('link', { name: /GitHub 저장소/ })).toHaveAttribute('target', '_blank');
  });
}
test('footer does not overflow at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await openPage(page, '/#/');
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(over).toBeLessThanOrEqual(0);
});
test('footer link to current guide returns to top', async ({ page }) => {
  await openPage(page, '/#/final');
  await page.locator('footer.site-footer').getByRole('link', { name: '최종 워크플로우' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});
