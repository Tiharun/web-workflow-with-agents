// 도식 비주얼 기준 이미지: 비주얼마다 4폭 × 라이트·다크(계획 M6 Task 2~4). 목록은 siteConfig에서 읽는다.
import { test, expect } from '@playwright/test';
import { siteConfig } from '../../js/site-config.js';
import { openPage } from '../e2e/helpers.mjs';

for (const v of siteConfig.visuals.filter((x) => x.type !== 'stage-ruler')) {
  test(`${v.type} visual`, async ({ page }) => {
    await openPage(page, `/#/${v.guideId}/${encodeURIComponent(v.headingId)}`);
    await expect(page.locator(`[id="${v.headingId}"] + figure.visual`)).toHaveScreenshot(`${v.type}.png`);
  });
}
