// M2 md 변환 e2e: md 사이 링크·외부 링크, 프롬프트 카드 복사, 블록 종류, 전체 제목. 스펙 §6·§8 M2.
import { test, expect } from '@playwright/test';
import { pages, openPage } from './helpers.mjs';
import { readFileSync } from 'node:fs';
import { siteConfig } from '../../js/site-config.js';
import { marked } from '../../vendor/marked/marked.esm.js';
import { rewriteHref } from '../../js/md.js';

const { ui } = siteConfig;
const tokens = (file, type) => {
  const out = [];
  marked.walkTokens(marked.lexer(readFileSync(file, 'utf8')), (t) => { if (t.type === type) out.push(t); });
  return out;
};
// 프롬프트 카드 i번째 ↔ md 코드 블록 i번째(글자 그림은 카드가 아니라 뺀다)
const BOX = /[─│┌└┐┘├┤▶◀]/;
const codes = tokens('content/final-workflow.md', 'code').map((t) => t.text).filter((t) => !BOX.test(t));

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

test.describe('prompt card copy', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  for (const [label, pick] of [['first', () => 0], ['multi-line', () => codes.findIndex((t) => t.includes('\n'))]]) {
    test(`copy puts the exact md code block on the clipboard (${label})`, async ({ page }) => {
      const i = pick();
      await openPage(page, '/#/final');
      await expect(page.locator('#doc .prompt')).toHaveCount(codes.length);
      const btn = page.locator('#doc .prompt').nth(i).locator('button[data-copy]');
      await btn.click();
      await expect(btn).toHaveText(ui.copied);
      await expect(page.locator('#live')).toHaveText(ui.copied);
      const clip = await page.evaluate(() => navigator.clipboard.readText());
      // Windows 클립보드는 줄바꿈을 \r\n으로 바꿔 돌려준다.
      expect(clip.replace(/\r\n/g, '\n')).toBe(codes[i]);
      await expect(btn).toHaveText(ui.copy, { timeout: 3000 });
    });
  }
});

for (const [name, execResult, label] of [['copy falls back to execCommand', true, ui.copied], ['copy failure shows the failed label', false, ui.copyFailed]]) {
  test(name, async ({ page }) => {
    await page.addInitScript((ok) => {
      Object.defineProperty(Clipboard.prototype, 'writeText', { value: () => Promise.reject(new Error('blocked')) });
      document.execCommand = () => ok;
    }, execResult);
    await openPage(page, '/#/final');
    const btn = page.locator('#doc .prompt button[data-copy]').first();
    await btn.click();
    await expect(btn).toHaveText(label);
    await expect(page.locator('#live')).toHaveText(label);
    // 숨긴 textarea로 옮겨 갔던 초점이 버튼으로 돌아와야 한다(키보드·낭독기 위치 유지).
    await expect(btn).toBeFocused();
  });
}

test.describe('copy announcements', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('copying again soon is announced again', async ({ page }) => {
    await openPage(page, '/#/final');
    await page.evaluate(() => {
      const live = document.getElementById('live');
      window.__live = [];
      new MutationObserver(() => window.__live.push(live.textContent)).observe(live, { childList: true, characterData: true, subtree: true });
    });
    const btns = page.locator('#doc .prompt button[data-copy]');
    await btns.nth(0).click();
    await expect(page.locator('#live')).toHaveText(ui.copied);
    const from = await page.evaluate(() => window.__live.length);
    await btns.nth(1).click();
    await expect(btns.nth(1)).toHaveText(ui.copied);
    // 같은 글을 다시 넣기 전에 한 번 비워야 낭독기가 다시 읽는다.
    await expect.poll(() => page.evaluate((n) => window.__live.slice(n), from)).toEqual(['', ui.copied]);
  });

  test('the copy timer leaves other announcements alone', async ({ page }) => {
    await openPage(page, '/#/final');
    await page.locator('#doc .prompt button[data-copy]').first().click();
    await expect(page.locator('#live')).toHaveText(ui.copied);
    await page.evaluate(() => { document.getElementById('live').textContent = 'other'; });
    await page.waitForTimeout(2200);
    await expect(page.locator('#live')).toHaveText('other');
  });
});

test('md link with a heading fragment opens that heading in the other guide', async ({ page }) => {
  await openPage(page, '/#/steps');
  const id = await page.locator('#doc h2').nth(2).getAttribute('id');
  const { href } = rewriteHref(`웹사이트 제작 순서.md#${encodeURIComponent(id)}`, siteConfig.guides.find((g) => g.id === 'final'));
  await openPage(page, '/#/final');
  await page.evaluate((h) => {
    const a = Object.assign(document.createElement('a'), { href: h, textContent: 'to steps', id: 'probe-link' });
    document.querySelector('#doc p').prepend(a);
  }, href);
  await page.locator('#probe-link').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`#/steps/${encodeURIComponent(id)}$`));
  await expect.poll(() => page.evaluate((i) => document.activeElement?.id === i, id)).toBe(true);
});

test('final guide shows every block kind', async ({ page }) => {
  await openPage(page, '/#/final');
  for (const sel of ['.table-wrap table', 'ul.checklist', 'li.is-warn', '.badge', '.prompt']) {
    const all = page.locator(`#doc ${sel}`);
    expect(await all.count(), sel).toBeGreaterThan(0);
    await all.first().scrollIntoViewIfNeeded();
    await expect(all.first(), sel).toBeVisible();
  }
});

for (const g of siteConfig.guides) {
  test(`every md heading is on screen (${g.id})`, async ({ page }) => {
    const want = [1, 2, 3, 4, 5, 6].map((d) => tokens(g.file, 'heading').filter((t) => t.depth === d).length);
    await openPage(page, `/#/${g.id}`);
    const got = await page.evaluate(() => [1, 2, 3, 4, 5, 6].map((d) => document.querySelectorAll(`#doc h${d}`).length));
    expect(got).toEqual(want);
    const ids = await page.locator('#doc :is(h1, h2, h3, h4, h5, h6)').evaluateAll((hs) => hs.map((h) => h.id));
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
}
