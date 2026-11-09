// M2 md 변환 e2e: md 사이 링크·외부 링크, 프롬프트 카드 복사, 블록 종류, 전체 제목. 스펙 §6·§8 M2.
import { test, expect } from '@playwright/test';
import { pages, openPage } from './helpers.mjs';
import { siteConfig } from '../../js/site-config.js';

test('md link to another guide opens it and focuses its title', async ({ page }) => {
  await openPage(page, '/#/final');
  await page.locator('#doc').getByRole('link', { name: '웹사이트 제작 순서.md' }).click();
  await expect(page).toHaveURL(/#\/steps$/);
  await expect(page.locator('#doc h1')).toHaveText(pages.find((p) => p.name === 'steps').h1);
  await expect.poll(() => page.evaluate(() => document.activeElement === document.querySelector('#doc h1'))).toBe(true);
});

test('external md links open in a new tab', async ({ page }) => {
  await openPage(page, '/#/design');
  const a = page.locator('#doc a[href^="https://"]').first();
  await expect(a).toHaveAttribute('target', '_blank');
  await expect(a).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(a.locator('.visually-hidden')).toHaveText(` ${siteConfig.ui.newTab}`);
});
