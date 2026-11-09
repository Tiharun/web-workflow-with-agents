import { test, expect } from '@playwright/test';
import { pages, openPage } from '../e2e/helpers.mjs';

const shots = ['home', 'final', 'notfound', '404'];
for (const name of shots) {
  test(`${name} first screen`, async ({ page }) => {
    await openPage(page, pages.find((p) => p.name === name).path);
    await expect(page).toHaveScreenshot(`${name}.png`);
  });
}
test('footer', async ({ page }) => {
  await openPage(page, '/#/');
  await expect(page.locator('footer.site-footer')).toHaveScreenshot('footer.png');
});
test('md load error', async ({ page }) => {
  await page.route('**/content/final-workflow.md', (r) => r.abort());
  await page.goto('/#/final');
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('alert').waitFor();
  await expect(page).toHaveScreenshot('md-error.png');
});
// 메뉴 열림: 768px 이상은 메가메뉴, 미만은 햄버거 → 가이드 아코디언(스펙 §6 화면 목록).
test('menu open', async ({ page }) => {
  await openPage(page, '/#/');
  if (page.viewportSize().width >= 768) {
    await page.locator('.guide-nav__btn[data-guide="final"]').click();
    await page.locator('#mega-final .mega__stage').first().waitFor();
  } else {
    await page.locator('.nav-toggle').click();
    await page.locator('.acc__btn[data-guide="final"]').click();
    await page.locator('#acc-final .acc__link--sub').first().waitFor();
  }
  await expect(page).toHaveScreenshot('menu-open.png');
});
// 목차 드로어 열림: 첫 단계로 이동한 뒤 열어 현재 위치 강조가 찍히게 한다.
test('toc drawer open', async ({ page }) => {
  await openPage(page, '/#/final');
  const first = await page.locator('#toc a[data-toc-id^="0단계"]').first().getAttribute('data-toc-id');
  await openPage(page, `/#/final/${encodeURIComponent(first)}`);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  // 키보드로 연다: 현재 항목의 초점 윤곽선까지 찍히게(마우스로 열면 폭에 따라 윤곽선이 보이지 않을 수 있다).
  await page.locator('[data-toc-open]').focus();
  await page.keyboard.press('Enter');
  await page.locator('#toc a[aria-current="location"]').waitFor();
  await page.mouse.move(0, 0); // 열기 전 마우스 위치의 항목에 hover가 남지 않게
  await expect(page).toHaveScreenshot('toc-open.png');
});
