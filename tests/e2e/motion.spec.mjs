// 등장 모션(블록 단위, 한 번만)과 진행 막대. 스펙 §8 M4.
import { test, expect } from '@playwright/test';
import { openPage, twoFrames, tocIds } from './helpers.mjs';

// 화면 안(아래 10%는 아직 트리거 전이라 뺀다)에서 불투명하지 않은 블록 수
const hiddenInView = (page) => page.locator('#doc > *').evaluateAll((els) => els.filter((e) => {
  const r = e.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight * 0.9 && getComputedStyle(e).opacity !== '1';
}).length);
const styled = (page, sel) => page.locator(sel).evaluateAll((els) => els.filter((e) => /opacity|transform|translate/.test(e.getAttribute('style') ?? '') || getComputedStyle(e).opacity !== '1').length);

test('reduced motion shows every block at once (guide and home)', async ({ page }) => {
  await openPage(page, '/#/final');
  expect(await styled(page, '#doc > *')).toBe(0);
  await openPage(page, '/#/');
  expect(await styled(page, '.hero__visual, .entry__grid > li')).toBe(0);
});

test.describe('motion allowed', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 1280, height: 800 } });

  test('a block below the fold appears once it scrolls in, and stays', async ({ page }) => {
    await openPage(page, '/#/final');
    const block = page.locator('#doc > *').nth(30); // 1280×800에서 첫 화면 아래
    await expect(block).toHaveCSS('opacity', '0');
    await block.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(block).toHaveCSS('opacity', '1', { timeout: 2000 });
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await block.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await twoFrames(page);
    expect(await block.evaluate((el) => getComputedStyle(el).opacity)).toBe('1'); // 다시 숨었다 올라오지 않는다
    expect(await block.getAttribute('style') ?? '').not.toMatch(/opacity/);
  });

  test('jumping to the last stage shows the blocks in view within 2s', async ({ page }) => {
    await openPage(page, '/#/final');
    const ids = await tocIds(page);
    await page.evaluate((id) => { location.hash = `#/final/${id}`; }, ids.at(-1));
    await expect.poll(() => hiddenInView(page), { timeout: 2000 }).toBe(0);
  });

  test('blocks skipped by a jump are already visible on the way back', async ({ page }) => {
    await openPage(page, '/#/final');
    const ids = await tocIds(page);
    await page.evaluate((id) => { location.hash = `#/final/${id}`; }, ids.at(-1));
    await expect.poll(() => hiddenInView(page), { timeout: 2000 }).toBe(0);
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' }));
    await expect.poll(() => hiddenInView(page), { timeout: 500 }).toBe(0);
  });

  test('an instant scroll to the middle shows the blocks there within 2s', async ({ page }) => {
    await openPage(page, '/#/final');
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' }));
    await expect.poll(() => hiddenInView(page), { timeout: 2000 }).toBe(0);
  });

  test('opening a deep stage address shows its blocks within 2s', async ({ page }) => {
    await openPage(page, '/#/final');
    const ids = await tocIds(page);
    await page.goto(`/#/final/${ids.at(-1)}`); // 해시만 다른 goto는 문서를 다시 읽지 않으므로
    await page.reload(); // 새로 읽어 '처음 들어온' 경로로 만든다
    await page.locator('#doc[data-loaded]').waitFor();
    await expect.poll(() => hiddenInView(page), { timeout: 2000 }).toBe(0);
  });
});

test.describe('progress bar', () => {
  const scale = (page) => page.locator('.progress__bar').evaluate((el) => Number(el.style.transform.match(/scaleX\(([\d.]+)\)/)?.[1]));

  test('is empty at the top, half way in the middle and full at the bottom', async ({ page }) => {
    await openPage(page, '/#/final');
    expect(await scale(page)).toBe(0);
    await page.evaluate(() => scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) / 2, behavior: 'instant' }));
    await twoFrames(page);
    expect(Math.abs(await scale(page) - 0.5)).toBeLessThan(0.02);
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await twoFrames(page);
    expect(await scale(page)).toBe(1);
  });

  test('shows only on guide screens', async ({ page }) => {
    await openPage(page, '/#/');
    await expect(page.locator('.progress')).toBeHidden();
    await openPage(page, '/#/final');
    await expect(page.locator('.progress')).toBeVisible();
    await expect(page.locator('.progress')).toHaveAttribute('aria-hidden', 'true');
  });
});
