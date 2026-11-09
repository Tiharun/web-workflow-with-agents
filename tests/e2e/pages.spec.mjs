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
  // html·body가 overflow-x: clip이라 문서 폭으로는 넘침이 드러나지 않는다. 푸터 요소마다 오른쪽 끝을 잰다.
  const right = await page.evaluate(() => Math.max(...[...document.querySelectorAll('.site-footer *')].map((e) => e.getBoundingClientRect().right)));
  expect(right).toBeLessThanOrEqual(375);
});
test('re-clicking the current stage link (Korean id) scrolls back to it', async ({ page }) => {
  await openPage(page, '/#/final');
  const open = () => page.locator('.guide-nav__btn[data-guide="final"]').click();
  const stage = page.locator('#mega-final a.mega__stage').nth(2);
  await open();
  await stage.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500);
  const y = await page.evaluate(() => scrollY);
  await page.evaluate(() => scrollTo(0, 0));
  await open();
  await stage.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);
});
test('footer link to current guide returns to top', async ({ page }) => {
  await openPage(page, '/#/final');
  await page.locator('footer.site-footer').getByRole('link', { name: '최종 워크플로우' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect.poll(() => page.evaluate(() => document.activeElement === document.querySelector('#doc h1'))).toBe(true);
});

test('footer brand on home returns to top and focuses the title', async ({ page }) => {
  await openPage(page, '/#/');
  await page.locator('footer.site-footer .brand').click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect.poll(() => page.evaluate(() => document.activeElement === document.querySelector('main h1'))).toBe(true);
});

test.describe('scroll kind with motion allowed', () => {
  test.use({ reducedMotion: 'no-preference' });
  // 스크롤 위치를 모두 기록한다. 즉시 이동이면 0 말고는 기록되지 않고, 부드러운 이동이면 중간값이 생긴다.
  const record = (page) => page.evaluate(() => { window.__ys = []; addEventListener('scroll', () => window.__ys.push(Math.round(scrollY))); });
  test('footer link to current guide jumps instantly', async ({ page }) => {
    await openPage(page, '/#/final');
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    // 맨 아래로 보낸 스크롤의 이벤트가 끝난 뒤 기록을 시작한다.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await record(page);
    await page.locator('footer.site-footer').getByRole('link', { name: '최종 워크플로우' }).click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.__ys.filter((y) => y !== 0))).toEqual([]);
  });
  test('toc link scrolls smoothly (control: the recorder can see smooth scrolling)', async ({ page }) => {
    await openPage(page, '/#/final');
    await record(page);
    await page.locator('[data-toc-open]').click();
    await page.locator('#toc a[data-toc-id="0단계-준비"]').click();
    await expect.poll(() => page.evaluate(() => window.__ys.length), { timeout: 3000 }).toBeGreaterThan(2);
  });
});

for (const p of pages) {
  test(`${p.name} has the shared header`, async ({ page }) => {
    await openPage(page, p.path);
    const h = page.locator('header.site-header');
    await expect(h.locator('.brand')).toHaveText(siteConfig.site.name);
    await expect(h.locator('.guide-nav__btn')).toHaveText(siteConfig.guides.map((g) => g.menuLabel));
    await expect(h.locator('.mode-toggle')).toBeVisible();
  });
}
test('404 header mega menu loads stages', async ({ page }) => {
  await openPage(page, '/404.html');
  await page.locator('.guide-nav__btn[data-guide="final"]').click();
  const link = page.locator('#mega-final a.mega__stage').first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/#\/final\//);
  await expect(page.locator('.doc:not([aria-busy]) h1')).toBeVisible();
});
