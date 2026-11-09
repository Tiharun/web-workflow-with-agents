// 라우팅·상태(M1): 찾을 수 없음, 없는 단계, md 불러오기 실패.
import { test, expect } from '@playwright/test';
import { siteConfig } from '../../js/site-config.js';
import { pages, openPage } from './helpers.mjs';

const { ui, site, guides } = siteConfig;
const finalH1 = pages.find((p) => p.name === 'final').h1;

test('unknown hash shows not-found with links to every guide', async ({ page }) => {
  await openPage(page, '/#/없는주소');
  await expect(page.locator('h1')).toHaveText(ui.notFoundTitle);
  const links = page.locator('main .state__links a');
  await expect(links).toHaveCount(guides.length);
  for (const [i, g] of guides.entries()) {
    await expect(links.nth(i)).toHaveAttribute('href', `#/${g.id}`);
    await expect(links.nth(i)).toHaveText(g.menuLabel);
  }
  await links.first().click();
  await expect(page.locator('#doc h1')).toHaveText(finalH1);
});

test('broken percent-encoding in the hash does not throw', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openPage(page, '/#/%E0%A4%A');
  await expect(page.locator('h1')).toHaveText(ui.notFoundTitle);
  await openPage(page, '/#/final/%E0%A4%A');
  await expect(page.locator('.notice')).toHaveText(ui.stageMissing);
  expect(errors).toEqual([]);
});

const stageState = (page) => page.evaluate(() => ({
  y: Math.round(scrollY),
  notices: [...document.querySelectorAll('.notice')].map((n) => n.textContent),
  first: document.querySelector('#doc').firstElementChild?.className,
  role: document.querySelector('.notice')?.getAttribute('role'),
  focus: document.activeElement === document.querySelector('#doc h1'),
}));
// 안내 문단은 보이는 글만 맡는다. 화면 낭독기 알림은 처음부터 있던 #live에 나중에 글을 넣어서 한다
// (글이 든 role="status"를 새로 끼워 넣으면 낭독기가 놓치기 쉽다).
const missingExpected = { y: 0, notices: [ui.stageMissing], first: 'notice', role: null, focus: true };
const liveText = (page) => page.evaluate(() => document.getElementById('live').textContent);

test('missing stage on first load shows guide top, notice and focus on title', async ({ page }) => {
  await openPage(page, '/#/final/없는단계');
  await expect(page.locator('#doc h1')).toHaveText(finalH1);
  expect(await stageState(page)).toEqual(missingExpected);
});

test('missing stage after an in-guide change matches first load', async ({ page }) => {
  await openPage(page, '/#/final/0단계-준비');
  await page.evaluate(() => { location.hash = '#/final/없는단계'; });
  await expect(page.locator('.notice')).toBeVisible();
  expect(await stageState(page)).toEqual(missingExpected);
});

test('repeated missing stages keep one notice; guide root clears it', async ({ page }) => {
  await openPage(page, '/#/final/0단계-준비');
  await page.evaluate(() => { location.hash = '#/final/없는단계'; });
  await page.evaluate(() => { location.hash = '#/final/또없음'; });
  // 두 번째 hashchange 처리가 끝난 뒤 센다(바로 세면 첫 안내만 보고 통과한다).
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await expect(page.locator('.notice')).toHaveCount(1);
  await page.evaluate(() => { location.hash = '#/final'; });
  await expect(page.locator('.notice')).toHaveCount(0);
});

test('missing stage is announced through the page live region and cleared at the guide root', async ({ page }) => {
  await openPage(page, '/#/final/없는단계');
  await expect.poll(() => liveText(page)).toBe(ui.stageMissing);
  await page.evaluate(() => { location.hash = '#/final'; });
  await expect.poll(() => liveText(page)).toBe('');
  await page.evaluate(() => { location.hash = '#/final/또없음'; });
  await expect.poll(() => liveText(page)).toBe(ui.stageMissing);
});

const finalFile = guides.find((g) => g.id === 'final').file;
async function blockFinal(page) {
  const ctl = { blocked: true, requests: 0 };
  await page.route(`**/${finalFile}`, (r) => { ctl.requests++; return ctl.blocked ? r.abort() : r.continue(); });
  return ctl;
}

test('blocked md shows the error; retry renders the body with a new request', async ({ page }) => {
  const ctl = await blockFinal(page);
  await page.goto('/#/final');
  const alert = page.getByRole('alert');
  await expect(alert.locator('h1')).toHaveText(ui.loadError);
  const src = alert.getByRole('link');
  await expect(src).toHaveAttribute('href', `${site.repoUrl}/blob/${site.branch}/${finalFile}`);
  await expect(src).toHaveAttribute('target', '_blank');
  ctl.blocked = false;
  await alert.getByRole('button', { name: ui.retry }).click();
  await expect(page.locator('#doc h1')).toHaveText(finalH1);
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(ctl.requests).toBeGreaterThanOrEqual(2);
});

test('changing stage while the error is shown retries instead of a notice', async ({ page }) => {
  const ctl = await blockFinal(page);
  await page.goto('/#/final');
  await expect(page.getByRole('alert')).toBeVisible();
  ctl.blocked = false;
  await page.evaluate(() => { location.hash = '#/final/0단계-준비'; });
  await expect(page.locator('[id="0단계-준비"]')).toBeInViewport();
  await expect(page.locator('.notice')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

// 다시 시도 버튼은 다시 그릴 때 사라진다. 초점이 body로 떨어지지 않고 결과 화면의 제목으로 와야 한다.
test('retry moves keyboard focus to the title of the result', async ({ page }) => {
  const ctl = await blockFinal(page);
  await page.goto('/#/final');
  const retry = () => page.getByRole('alert').getByRole('button', { name: ui.retry }).press('Enter');
  await retry();
  await expect.poll(() => page.evaluate(() => document.activeElement?.matches('[role="alert"] h1'))).toBe(true);
  ctl.blocked = false;
  await retry();
  await expect(page.locator('#doc h1')).toHaveText(finalH1);
  await expect.poll(() => page.evaluate(() => document.activeElement === document.querySelector('#doc h1'))).toBe(true);
});

test('leaving a retried guide stops progress tracking', async ({ page }) => {
  const ctl = await blockFinal(page);
  await page.goto('/#/final');
  await expect(page.getByRole('alert')).toBeVisible();
  ctl.blocked = false;
  await page.getByRole('button', { name: ui.retry }).click();
  await expect(page.locator('#doc h1')).toHaveText(finalH1);
  await page.evaluate(() => { location.hash = '#/'; });
  await expect(page.locator('html')).toHaveAttribute('data-view', 'home');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  // 스크롤 처리기는 다음 프레임에 막대를 고친다. 두 프레임을 기다린 뒤 본다(바로 보면 늘 통과한다).
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await expect(page.locator('.progress__bar')).toHaveAttribute('style', /scaleX\(0\)/);
});
