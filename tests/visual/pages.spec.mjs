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
