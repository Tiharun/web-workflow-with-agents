// 가로 넘침: 5폭(brief 성공 기준) + 200%(1.4.4)·400%(1.4.10 Reflow) 확대(계획 M7 Task 3).
// 브라우저 확대는 CSS 뷰포트가 줄어드는 것과 같다: 1280×900 창의 200% = 640×450 @2x, 400% = 320×225 @4x.
import { test, expect } from '@playwright/test';
import { screens, overflowing, openPage } from './helpers.mjs';

const sizes = [[375, 812, 1], [768, 1024, 1], [1280, 800, 1], [1440, 900, 1], [1920, 1080, 1], [640, 450, 2], [320, 225, 4]];

for (const [width, height, deviceScaleFactor] of sizes) {
  test.describe(`${width}px ×${deviceScaleFactor}`, () => {
    test.use({ viewport: { width, height }, deviceScaleFactor });
    for (const s of screens) {
      test(`no horizontal overflow: ${s.name}`, async ({ page }) => {
        await s.open(page);
        expect(await overflowing(page)).toEqual([]);
      });
    }
  });
}

// 확대해도 내용이 사라지지 않는다(1.4.4): 머리말 조작부와 가이드 제목이 뷰포트 안에 보인다.
for (const [width, height, deviceScaleFactor] of [[640, 450, 2], [320, 225, 4]]) {
  test.describe(`zoom ${deviceScaleFactor * 100}%`, () => {
    test.use({ viewport: { width, height }, deviceScaleFactor });
    test(`zoomed ${deviceScaleFactor * 100}% keeps header controls and the title in view`, async ({ page }) => {
      await openPage(page, '/#/final');
      const off = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        return [...document.querySelectorAll('header.site-header a, header.site-header button')]
          .filter((e) => e.checkVisibility({ visibilityProperty: true }))
          .map((e) => [e.textContent.trim() || e.getAttribute('aria-label'), e.getBoundingClientRect()])
          .filter(([, r]) => r.left < 0 || r.right > vw + 0.5).map(([t]) => t);
      });
      expect(off).toEqual([]);
      await expect(page.locator('#doc h1')).toBeVisible();
      expect(await overflowing(page)).toEqual([]);
    });
  });
}

// 긴 가이드의 첫 레이아웃 비용(계획 M7 Task 6): 본문 블록은 화면에 올 때 그린다. 제목은 이동·현재 위치 기준이라 늘 그린다.
test('body blocks below the fold skip layout', async ({ page }) => {
  await openPage(page, '/#/final');
  const cv = (sel) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).contentVisibility);
  expect(await cv('#doc > p:nth-child(n+40)')).toBe('auto');
  expect(await cv('#doc > h2:nth-child(n+40)')).toBe('visible');
  expect(await cv('#doc > :nth-child(2)')).toBe('visible'); // 첫 화면 블록은 처음부터 그린다
});

// 그리지 않은 블록이 추정 높이(10rem)로 남으면 문서 길이가 실제와 달라 맨 끝으로 한 번에 가지 못한다(측정: final 28% 과대).
for (const width of [375, 1280]) {
  test.describe(`${width}px sizes`, () => {
    test.use({ viewport: { width, height: 800 } });
    test('unrendered body blocks hold their real height', async ({ page }) => {
      await openPage(page, '/#/final');
      const [before, after] = await page.evaluate(() => {
        const h = () => document.documentElement.scrollHeight;
        const a = h();
        // 모두 그린 상태가 기준이다. 격리는 화면에서와 같이 남긴다(풀면 자식 여백이 밖으로 겹쳐 높이가 달라진다).
        // content-visibility: auto가 거는 격리는 계산된 contain 값에 드러나지 않으므로 직접 건다.
        const cv = [...document.querySelectorAll('#doc > *')].filter((el) => getComputedStyle(el).contentVisibility === 'auto');
        for (const el of cv) Object.assign(el.style, { contentVisibility: 'visible', contain: 'layout style paint' });
        return [a, h()];
      });
      expect(Math.abs(before - after)).toBeLessThanOrEqual(2);
    });
  });
}

// 첫 화면 블록은 처음부터 그린다. 추정 높이로 먼저 그려지면 실제 높이로 바뀌며 아래 제목이 밀린다(측정: final h2 108px, steps 330px).
// 홈 히어로 문장도 글꼴이 오기 전 대체 글꼴로 그려지면 줄 수가 바뀌어 카드가 밀린다(측정: 31px, CLS 0.238).
test.describe('first screen does not shift', () => {
  test.use({ viewport: { width: 412, height: 823 }, reducedMotion: 'no-preference' });
  for (const path of ['/#/', '/#/final', '/#/steps', '/#/design']) {
    test(`no layout shift while ${path} loads`, async ({ page }) => {
      await page.addInitScript(() => {
        window.__shifts = [];
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            if (e.value < 0.001) continue; // 글자 한두 개의 미세한 이동은 뺀다
            window.__shifts.push(`${e.value.toFixed(3)} ${e.sources.slice(0, 2).map((s) => `${s.node?.nodeName}${s.node?.id ? '#' + s.node.id : ''} ${Math.round(s.previousRect.top)}→${Math.round(s.currentRect.top)}`).join(', ')}`);
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await openPage(page, path);
      await page.waitForTimeout(1000);
      expect(await page.evaluate(() => window.__shifts)).toEqual([]);
    });
  }
});
