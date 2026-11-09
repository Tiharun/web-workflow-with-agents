// 스켈레톤은 md를 실제로 불러오는 동안에만(스펙 §5).
import { test, expect } from '@playwright/test';
import { openPage } from './helpers.mjs';

// 페이지가 뜨기 전부터 스켈레톤 3종이 DOM에 들어오는지 기록한다.
const watch = () => {
  window.__sk = [];
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
    if (n.nodeType !== 1) return;
    const sel = '.skeleton, .ruler-skeleton, .menu-skeleton';
    if (n.matches(sel)) window.__sk.push(n.className);
    n.querySelectorAll(sel).forEach((x) => window.__sk.push(x.className));
  }))).observe(document, { subtree: true, childList: true });
};
const go = async (page, hash) => {
  await page.evaluate((h) => { window.__sk.length = 0; location.hash = h; }, hash);
};
const inserted = (page) => page.evaluate(() => window.__sk.slice());

test.beforeEach(async ({ page }) => { await page.addInitScript(watch); });

test('first open with a slow md shows the skeleton until the body arrives', async ({ page }) => {
  await page.route('**/content/final-workflow.md', async (r) => { await new Promise((ok) => setTimeout(ok, 600)); await r.continue(); });
  await page.goto('/#/final');
  await expect(page.locator('#doc .skeleton')).toBeVisible();
  await expect(page.locator('#doc')).toHaveAttribute('aria-busy', 'true');
  await page.locator('#doc[data-loaded]').waitFor();
  await expect(page.locator('#doc .skeleton')).toHaveCount(0);
  await expect(page.locator('#doc')).not.toHaveAttribute('aria-busy');
});

test('revisiting a loaded guide never inserts the skeleton', async ({ page }) => {
  await openPage(page, '/#/final');
  await go(page, '#/steps');
  await page.locator('.guide[data-guide="steps"] #doc[data-loaded]').waitFor();
  await go(page, '#/final');
  await page.locator('.guide[data-guide="final"] #doc[data-loaded]').waitFor();
  expect(await inserted(page)).toEqual([]);
});

test('returning home with the md loaded never inserts the ruler skeleton', async ({ page }) => {
  await openPage(page, '/#/final');
  await go(page, '#/');
  await expect(page.locator('.hero__visual .ruler')).toBeVisible();
  expect(await inserted(page)).toEqual([]);
});

test('opening a menu whose md is loaded never inserts the menu skeleton', async ({ page }) => {
  await openPage(page, '/#/final');
  await page.evaluate(() => { window.__sk.length = 0; });
  await page.locator('.guide-nav__btn[data-guide="final"]').click();
  await expect(page.locator('#mega-final a').first()).toBeVisible();
  expect(await inserted(page)).toEqual([]);
});

test('a failure while drawing the cached ruler hides its slot instead of breaking the route', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // 단계 자를 칸에 넣는 순간 실패하게 만든다(캐시 경로든 아니든 같은 지점).
  await page.addInitScript(() => {
    const orig = Element.prototype.replaceChildren;
    Element.prototype.replaceChildren = function (...a) {
      if (this.matches?.('[data-hero-visual]')) throw new Error('ruler failed');
      return orig.apply(this, a);
    };
  });
  await openPage(page, '/#/final');
  await go(page, '#/');
  await expect(page.locator('.hero__visual')).toBeHidden();
  await expect(page.locator('.entry__grid > li')).toHaveCount(3); // 나머지 홈은 그대로
  expect(errors).toEqual([]);
});
