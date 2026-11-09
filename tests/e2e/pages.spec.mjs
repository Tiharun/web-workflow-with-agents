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
    // 맨 위에 닿은 뒤 남은 스크롤 이벤트가 들어오도록 두 프레임을 더 본다(고정 대기 없이).
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
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
test('skip link moves focus to the page title', async ({ page }) => {
  await openPage(page, '/#/final');
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => document.activeElement === document.querySelector('#doc h1'))).toBe(true);
});
// 현재 가이드 밑줄(DESIGN.md: 아래 2px 코발트 선). 위 모서리가 둥근 버튼에 inset 그림자로 그리면
// 둥근 옆면을 따라 그림자 조각이 비친다. 그래서 버튼 폭 전체의 2px 선으로 그리고 그림자는 쓰지 않는다.
test('current guide underline is a full-width 2px line without edge slivers', async ({ page }) => {
  await openPage(page, '/#/final');
  const s = await page.locator('.guide-nav__btn[aria-current]').evaluate((b) => {
    const line = getComputedStyle(b, '::after');
    return { shadow: getComputedStyle(b).boxShadow, height: line.height, width: parseFloat(line.width), btn: b.getBoundingClientRect().width };
  });
  expect(s).toMatchObject({ shadow: 'none', height: '2px' });
  expect(s.width).toBeCloseTo(s.btn, 1);
});
test('404 header mega menu loads stages', async ({ page }) => {
  await openPage(page, '/404.html');
  await page.locator('.guide-nav__btn[data-guide="final"]').click();
  const link = page.locator('#mega-final a.mega__stage').first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/#\/final\//);
  await expect(page.locator('.doc:not([aria-busy]) h1')).toBeVisible();
});
// 읽기 전용 체크 목록: 화면 낭독기가 체크박스마다 그 항목 글을 읽어야 한다(Lighthouse 'label').
test('read-only checklist boxes are named by their item text', async ({ page }) => {
  await openPage(page, '/#/final');
  const boxes = page.locator('#doc .checklist input[type="checkbox"]');
  expect(await boxes.count()).toBeGreaterThan(0);
  const named = await boxes.evaluateAll((list) => list.map((b) => {
    const ids = b.getAttribute('aria-labelledby')?.split(' ') ?? [];
    const label = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim();
    return label !== '' && label === b.closest('li').textContent.trim();
  }));
  expect(named.every(Boolean)).toBe(true);
  await expect(page.getByRole('checkbox', { name: '핵심 기능 5개 이하, "안 만들 것" 목록이 있다' })).toHaveCount(1);
});
// 불러오는 동안 짧은 스켈레톤 아래로 푸터가 화면에 보였다가, 본문이 오면 밀려 내려가며 레이아웃 이동(CLS)이 생겼다.
test('opening a guide does not shift the layout while the md loads', async ({ page }) => {
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  // 스켈레톤이 그려지도록 md 응답을 잠깐 늦춘다.
  await page.route('**/content/final-workflow.md', async (r) => { await new Promise((res) => setTimeout(res, 500)); await r.continue(); });
  await openPage(page, '/#/final');
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  expect(await page.evaluate(() => window.__cls)).toBeLessThan(0.05);
});
// 홈·404는 정적 머리말·빈 푸터를 먼저 그리고 스크립트가 채운다. 느린 기기에서 채워질 때 레이아웃이 움직이지 않아야 한다.
for (const [name, path, script] of [['home', '/#/', 'main.js'], ['404', '/404.html', 'not-found-page.js']]) for (const width of [375, 1280]) {
  test(`${name} page does not shift when the header and footer fill in (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.route(`**/js/${script}`, async (r) => { await new Promise((res) => setTimeout(res, 500)); await r.continue(); });
    await openPage(page, path);
    await page.locator('footer.site-footer .brand').waitFor();
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    expect(await page.evaluate(() => window.__cls)).toBeLessThan(0.05);
  });
}
