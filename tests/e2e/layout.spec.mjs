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
