// 비주얼(단계 자) 배치: 가이드 화면에서 제목 아래 그림, 짝 없음, builder 실패, 재방문, 좁은 화면. 스펙 §5·§8 M5.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { siteConfig } from '../../js/site-config.js';
import { openPage, tocIds } from './helpers.mjs';

/** js/<file> 응답을 바꿔 끼운다. 바꿀 문자열이 디스크 파일에 있는지 먼저 확인한다. */
async function patch(page, file, from, to) {
  const src = readFileSync(`js/${file}`, 'utf8');
  expect(src).toContain(from);
  await page.route(`**/js/${file}`, (route) => route.fulfill({ body: src.replace(from, to), contentType: 'text/javascript' }));
}

/** 잡히지 않은 예외(reportError 포함)와 console.error를 모은다. */
function errors(page) {
  const list = [];
  page.on('pageerror', (e) => list.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') list.push(m.text()); });
  return list;
}

const v = siteConfig.visuals.find((x) => x.type === 'stage-ruler');
const ready = (page) => page.locator('.doc[data-loaded]').waitFor();

test('the stage ruler shows under its heading on the guide', async ({ page }) => {
  const errs = errors(page);
  await openPage(page, `/#/${v.guideId}`);
  const fig = page.locator(`[id="${v.headingId}"] + figure.visual`);
  await expect(fig.locator('nav.ruler')).toBeVisible();
  await expect(fig.locator('nav.ruler')).toHaveAttribute('aria-label', siteConfig.ui.rulerLabel);
  const ids = await fig.locator('.ruler__link').evaluateAll((as) => as.map((a) => a.hash.split('/').pop()));
  expect(ids.length).toBeGreaterThan(0);
  for (const id of ids) await expect(page.locator(`#doc [id="${decodeURIComponent(id)}"]`)).toHaveCount(1);
  expect(errs).toEqual([]);
});

test('a missing heading hides the visual and keeps the text', async ({ page }) => {
  await openPage(page, `/#/${v.guideId}`);
  const base = await page.locator('#doc').evaluate((a) => { const c = a.cloneNode(true); c.querySelectorAll('.visual').forEach((f) => f.remove()); return c.textContent; });
  const tocBase = await tocIds(page);

  const page2 = await page.context().newPage();
  const errs = errors(page2);
  await patch(page2, 'site-config.js', `headingId: '${v.headingId}'`, `headingId: 'no-such-heading'`);
  await openPage(page2, `/#/${v.guideId}`);
  await expect(page2.locator('#doc .visual')).toHaveCount(0);
  expect(await page2.locator('#doc').textContent()).toBe(base);
  expect(await tocIds(page2)).toEqual(tocBase);
  expect(errs).toEqual([]);
});

test('a failing visual builder is reported and leaves the toc intact', async ({ page }) => {
  const errs = errors(page);
  await patch(page, 'ruler.js', `export function buildRuler(doc, { variant = 'auto' } = {}) {`,
    `export function buildRuler(doc, { variant = 'auto' } = {}) { if (location.hash.startsWith('#/${v.guideId}')) throw new Error('boom');`);
  await openPage(page, `/#/${v.guideId}`);
  await expect(page.locator('#doc .visual')).toHaveCount(0);
  expect((await tocIds(page)).length).toBeGreaterThan(0);
  await expect(page.locator(`#doc [id="${v.headingId}"]`)).toBeVisible();
  // 진행 막대 추적도 붙었다: 맨 아래로 가면 scaleX(1)(tests/e2e/motion.spec.mjs의 진행 막대 검사와 같은 방식)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('.progress__bar')).toHaveAttribute('style', /scaleX\(1\)/);
  expect(errs).toEqual([`비주얼을 그리지 못함: ${v.type} → #${v.headingId}`]); // 묻히지 않고 정확히 1건 보고된다
});

test('a failing visual builder still scrolls to the requested stage', async ({ page }) => {
  await openPage(page, `/#/${v.guideId}`);
  const target = (await tocIds(page)).at(-1);
  const errs = errors(page);
  await patch(page, 'ruler.js', `export function buildRuler(doc, { variant = 'auto' } = {}) {`,
    `export function buildRuler(doc, { variant = 'auto' } = {}) { if (location.hash.startsWith('#/${v.guideId}')) throw new Error('boom');`);
  await page.goto('about:blank');
  await openPage(page, `/#/${v.guideId}/${target}`);
  await expect(page.locator(`#doc [id="${target}"]`)).toBeInViewport();
  expect(errs).toEqual([`비주얼을 그리지 못함: ${v.type} → #${v.headingId}`]);
});

test('visuals are placed once across stage changes and revisits', async ({ page }) => {
  await openPage(page, `/#/${v.guideId}`);
  const stage = await page.locator('.visual .ruler__link').last().getAttribute('href');
  await page.evaluate((h) => { location.hash = h; }, stage);
  await expect(page.locator(`[id="${decodeURIComponent(stage.split('/').pop())}"]`)).toBeInViewport();
  await expect(page.locator('#doc .visual')).toHaveCount(1);
  await page.evaluate(() => { location.hash = '#/'; });
  await page.locator('.home').waitFor();
  await page.evaluate((id) => { location.hash = `#/${id}`; }, v.guideId);
  await ready(page);
  await expect(page.locator('#doc .visual')).toHaveCount(1);
});

test('the guide ruler stays inside the text column at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await openPage(page, `/#/${v.guideId}`);
  const box = await page.locator('.visual').evaluate((f) => {
    const rects = [...f.querySelectorAll('*')].map((e) => e.getBoundingClientRect());
    const doc = document.querySelector('#doc').getBoundingClientRect();
    const root = document.documentElement;
    return { left: Math.min(...rects.map((r) => r.left)), right: Math.max(...rects.map((r) => r.right)), docLeft: doc.left, docRight: doc.right, extra: root.scrollWidth - root.clientWidth };
  });
  expect(box.left).toBeGreaterThanOrEqual(box.docLeft);
  expect(box.right).toBeLessThanOrEqual(box.docRight);
  expect(box.extra).toBe(0);
});
