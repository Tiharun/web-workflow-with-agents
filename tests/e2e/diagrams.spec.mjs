// 도식 비주얼(계획 M6 Task 5): 가이드 화면에서 제목 아래 표시(라이트·다크), 375px 넘침 없음, 흐름 링크 이동 뒤 중복 없음.
import { test, expect } from '@playwright/test';
import { siteConfig } from '../../js/site-config.js';
import { openPage, tocIds } from './helpers.mjs';

const items = siteConfig.visuals.filter((v) => v.type !== 'stage-ruler');

function errors(page) {
  const list = [];
  page.on('pageerror', (e) => list.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') list.push(m.text()); });
  return list;
}

for (const v of items) {
  test(`${v.type} shows under its heading in light and dark`, async ({ page }) => {
    const errs = errors(page);
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: scheme });
      await openPage(page, `/#/${v.guideId}`);
      await expect(page.locator(`[id="${v.headingId}"] + figure.visual`)).toBeVisible();
    }
    expect(errs).toEqual([]);
  });

  test(`${v.type}: every visual fits the text column at 375px`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await openPage(page, `/#/${v.guideId}`);
    const r = await page.locator(`[id="${v.headingId}"] + figure.visual`).evaluate((f) => {
      const doc = document.querySelector('#doc').getBoundingClientRect();
      const boxes = [...f.querySelectorAll('*')].map((e) => e.getBoundingClientRect()).filter((b) => b.width || b.height);
      return { left: Math.min(...boxes.map((b) => b.left)), right: Math.max(...boxes.map((b) => b.right)), docL: doc.left, docR: doc.right,
        over: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    expect(r.left).toBeGreaterThanOrEqual(r.docL);
    expect(r.right).toBeLessThanOrEqual(r.docR);
    expect(r.over).toBe(0);
  });
}

test('a flow link scrolls to its stage and keeps one visual', async ({ page }) => {
  const v = items.find((x) => x.type === 'steps-flow');
  await openPage(page, `/#/${v.guideId}`);
  const link = page.locator('.flow__link').last();
  const id = decodeURIComponent(await link.evaluate((a) => a.hash)).split('/')[2];
  await link.click();
  await expect(page.locator(`#doc [id="${id}"]`)).toBeInViewport();
  await expect(page.locator('#doc .visual .flow')).toHaveCount(1);
  expect((await tocIds(page)).length).toBeGreaterThan(0);
});

test('a quick path step link scrolls to its stage', async ({ page }) => {
  const v = items.find((x) => x.type === 'quick-paths');
  await openPage(page, `/#/${v.guideId}`);
  const link = page.locator('.paths__step').first();
  const id = decodeURIComponent(await link.evaluate((a) => a.hash)).split('/')[2];
  await link.click();
  await expect(page.locator(`#doc [id="${id}"]`)).toBeInViewport();
  await expect(page.locator('#doc .visual .paths')).toHaveCount(1);
});
