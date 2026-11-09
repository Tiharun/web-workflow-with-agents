// 툴팁: 탭·키보드 포커스로 열림, Esc로 닫힘, 문서 밖 설명 없음(WCAG 1.4.13, brief).
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { openPage } from './helpers.mjs';
import { siteConfig } from '../../js/site-config.js';

const { ui, guides } = siteConfig;
const tip = (page) => page.locator('#tooltip');

test('keyboard focus opens an icon button tooltip; Escape closes it and keeps focus', async ({ page }) => {
  await openPage(page, '/#/final');
  await page.locator('[data-toc-open]').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('.guide-tools a[download]')).toBeFocused();
  await expect(tip(page)).toBeVisible();
  await expect(tip(page)).toHaveText(ui.downloadLabel);
  await page.keyboard.press('Escape');
  await expect(tip(page)).toBeHidden();
  await expect(page.locator('.guide-tools a[download]')).toBeFocused();
});

for (const g of guides) {
  test(`term tooltips only use md sentences (${g.id})`, async ({ page }) => {
    await openPage(page, `/#/${g.id}`);
    const md = readFileSync(g.file, 'utf8');
    const lines = await page.locator('.term').evaluateAll((bs) => bs.flatMap((b) => b.dataset.tip.split('\n')));
    expect(lines.filter((l) => !md.includes(l))).toEqual([]);
  });
}

test('a shown tooltip already sits where it was placed (reduced motion: no 0.01ms transition lag)', async ({ page }) => {
  await openPage(page, '/#/final');
  const term = page.locator('.term').first();
  await term.scrollIntoViewIfNeeded();
  // show()가 끝난 직후(마이크로태스크) 실제 위치가 지정한 translate와 같아야 한다.
  await page.evaluate(() => {
    const t = document.getElementById('tooltip');
    window.__first = new Promise((ok) => new MutationObserver((_, mo) => {
      if (t.hidden) return;
      mo.disconnect();
      const r = t.getBoundingClientRect();
      ok([`${Math.round(r.x)}px ${Math.round(r.y)}px`, t.style.translate]);
    }).observe(t, { attributes: true }));
  });
  await term.hover();
  const [actual, placed] = await page.evaluate(() => window.__first);
  expect(actual).toBe(placed);
});

test('pointer can move from a term onto its tooltip without it closing', async ({ page }) => {
  await openPage(page, '/#/final');
  const term = page.locator('.term').first();
  await term.scrollIntoViewIfNeeded();
  await term.hover();
  const box = await tip(page).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
  await page.waitForTimeout(300); // 닫힘 지연(150ms)보다 길게
  await expect(tip(page)).toBeVisible();
});

test('scrolling closes a tooltip opened by the pointer', async ({ page }) => {
  await openPage(page, '/#/final');
  const term = page.locator('.term').first();
  await term.scrollIntoViewIfNeeded();
  await term.hover();
  await expect(tip(page)).toBeVisible();
  await page.mouse.wheel(0, 300);
  await expect(tip(page)).toBeHidden();
});

test('tabbing to a term below the fold keeps its tooltip next to it', async ({ page }) => {
  await openPage(page, '/#/final');
  const term = page.locator('.term').filter({ visible: true }).nth(5);
  expect((await term.boundingBox()).y).toBeGreaterThan(800); // 화면 아래에서 시작
  await page.keyboard.press('Tab'); // 키보드 입력 뒤라 다음 focus()가 :focus-visible
  await term.focus(); // 브라우저가 스크롤한다(Tab으로 갈 때와 같은 경로)
  await page.waitForTimeout(300);
  await expect(term).toBeFocused();
  await expect(tip(page)).toBeVisible();
  const near = async () => {
    const [t, b] = [await term.boundingBox(), await tip(page).boundingBox()];
    return Math.min(Math.abs(b.y - (t.y + t.height + 8)), Math.abs(b.y + b.height - (t.y - 8)));
  };
  expect(await near()).toBeLessThan(2);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(200);
  await expect(tip(page)).toBeVisible();
  expect(await near()).toBeLessThan(2);
});

test('a focused term scrolled out of view and back shows its tooltip again', async ({ page }) => {
  await openPage(page, '/#/final');
  const term = page.locator('.term').filter({ visible: true }).first();
  await page.keyboard.press('Tab');
  await term.focus();
  await expect(tip(page)).toBeVisible();
  await page.mouse.move(640, 400);
  await page.mouse.wheel(0, 1600);
  await expect(tip(page)).toBeHidden(); // 주인이 화면 밖이면 감춘다
  await page.mouse.wheel(0, -1600);
  await expect(term).toBeFocused();
  await expect(tip(page)).toBeVisible(); // 돌아오면 다시 보인다(초점이 머무는 동안 유지, WCAG 1.4.13)
  const [t, b] = [await term.boundingBox(), await tip(page).boundingBox()];
  expect(Math.min(Math.abs(b.y - (t.y + t.height + 8)), Math.abs(b.y + b.height - (t.y - 8)))).toBeLessThan(2);
  await page.keyboard.press('Escape');
  await expect(tip(page)).toBeHidden();
});

test.describe('touch 375px', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 812 } });

  test('tapping a term toggles its tooltip; tapping elsewhere closes it', async ({ page }) => {
    await openPage(page, '/#/final');
    const term = page.locator('.term').first();
    await term.scrollIntoViewIfNeeded();
    await term.tap();
    await expect(tip(page)).toBeVisible();
    await expect(term).toHaveAttribute('aria-describedby', 'tooltip');
    await term.tap();
    await expect(tip(page)).toBeHidden();
    await term.tap();
    await expect(tip(page)).toBeVisible();
    // 바깥 = 용어가 든 블록의 오른쪽 아래 구석(마지막 줄 끝의 빈 곳). 스크롤로 닫힌 게 아님을 함께 확인한다.
    const block = await term.locator('xpath=ancestor::*[parent::article]').boundingBox();
    const y0 = await page.evaluate(() => scrollY);
    await page.touchscreen.tap(block.x + block.width - 2, block.y + block.height - 2);
    expect(await page.evaluate(() => scrollY)).toBe(y0);
    await expect(tip(page)).toBeHidden();
    await expect(term).not.toHaveAttribute('aria-describedby');
  });

  test('a tooltip opened by a tap closes on scroll (taps give focus but not focus-visible)', async ({ page }) => {
    await openPage(page, '/#/final');
    const term = page.locator('.term').first();
    await term.scrollIntoViewIfNeeded();
    await term.tap();
    await expect(tip(page)).toBeVisible();
    await page.evaluate(() => scrollBy(0, 40));
    await expect(tip(page)).toBeHidden();
  });
});
