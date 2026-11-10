// 키보드만으로 모든 조작(2.1.1), 초점 표시(2.4.7), 초점 가림(2.4.11), 초점 테두리 잘림, 누르는 영역 24px(2.5.8). 계획 M7 Task 4.
import { test, expect } from '@playwright/test';
import { openPage, screens } from './helpers.mjs';
import { siteConfig } from '../../js/site-config.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/** 보이는 조작 요소마다 data-k 번호를 붙이고 개수를 돌려준다. */
const markControls = (page) => page.evaluate((sel) => {
  const els = [...document.querySelectorAll(sel)].filter((e) => e.checkVisibility({ visibilityProperty: true }));
  els.forEach((e, i) => { e.dataset.k = String(i); });
  return els.length;
}, FOCUSABLE);

/** 지금 초점 받은 요소의 상태: 번호, 초점 표시, 가림, 테두리 잘림. */
const focusState = (page) => page.evaluate(() => {
  const el = document.activeElement;
  const s = getComputedStyle(el);
  const ow = s.outlineStyle === 'none' ? 0 : parseFloat(s.outlineWidth) || 0;
  const visible = ow >= 2 || s.boxShadow !== 'none';
  const r = el.getBoundingClientRect();
  // 2.4.11: 중앙·네 모서리(안쪽 2px) 중 하나라도 그 요소(또는 자손)가 맨 위에 보이면 '완전히 가려지지 않음'.
  const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 2, r.top + 2], [r.right - 2, r.top + 2], [r.left + 2, r.bottom - 2], [r.right - 2, r.bottom - 2]];
  const shown = pts.some(([x, y]) => { const hit = document.elementFromPoint(x, y); return hit && (hit === el || el.contains(hit)); });
  // 테두리 사각형이 자르는 조상(overflow, paint 격리, content-visibility)의 안쪽 상자를 넘는지.
  const grow = ow ? ow + (parseFloat(s.outlineOffset) || 0) : 0;
  const ring = { left: r.left - grow, top: r.top - grow, right: r.right + grow, bottom: r.bottom + grow };
  let clippedBy = null;
  for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
    const ps = getComputedStyle(p);
    const paintClip = /paint|strict|content/.test(ps.contain) || ps.contentVisibility === 'auto';
    const clips = ps.overflowX !== 'visible' || ps.overflowY !== 'visible' || paintClip;
    if (!clips || p === document.body) continue;
    // overflow-clip-margin은 paint 격리와 overflow: clip에만 적용된다(스크롤 상자에는 아니다).
    const scrolls = /auto|scroll|hidden/.test(ps.overflowX + ps.overflowY);
    const m = (paintClip || ps.overflowX === 'clip') && !scrolls ? parseFloat(ps.overflowClipMargin) || 0 : 0;
    const pr = p.getBoundingClientRect();
    const box = { left: pr.left + p.clientLeft - m, top: pr.top + p.clientTop - m, right: pr.left + p.clientLeft + p.clientWidth + m, bottom: pr.top + p.clientTop + p.clientHeight + m };
    if (ring.left < box.left - 0.5 || ring.top < box.top - 0.5 || ring.right > box.right + 0.5 || ring.bottom > box.bottom + 0.5) { clippedBy = `${p.tagName}.${p.className}`; break; }
  }
  const name = `${el.tagName}.${typeof el.className === 'string' ? el.className.split(' ')[0] : ''} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 16)}"`;
  return { k: el.dataset.k, name, visible, shown, clippedBy };
});

for (const [width, height, deviceScaleFactor] of [[1280, 800, 1], [375, 812, 1], [640, 450, 2]]) {
  test.describe(`${width}px ×${deviceScaleFactor}`, () => {
    test.use({ viewport: { width, height }, deviceScaleFactor });
    for (const path of ['/#/', '/#/final']) {
      // 세 검사를 한 번의 Tab 순회로 모은다(final은 조작 요소가 수백 개라 순회를 나누면 느리다).
      test(`Tab reaches every control with a visible, unobscured, unclipped focus (${path})`, async ({ page }) => {
        await openPage(page, path);
        const total = await markControls(page);
        const reached = new Set();
        const invisible = new Set(), hidden = new Set(), clipped = new Set();
        for (let i = 0; i < total + 5; i++) {
          await page.keyboard.press('Tab');
          const f = await focusState(page);
          if (f.name.startsWith('BODY')) continue; // 마지막 요소 뒤 Tab은 브라우저 UI로 나간다.
          if (f.k !== undefined) reached.add(f.k);
          if (!f.visible) invisible.add(f.name);
          if (!f.shown) hidden.add(f.name);
          if (f.clippedBy) clipped.add(`${f.name} in ${f.clippedBy}`);
        }
        const missed = await page.evaluate((ks) => [...document.querySelectorAll('[data-k]')].filter((e) => !ks.includes(e.dataset.k))
          .map((e) => `${e.tagName}.${e.className} "${e.textContent.trim().slice(0, 16)}"`), [...reached]);
        expect({ missed, invisible: [...invisible], hidden: [...hidden], clipped: [...clipped] })
          .toEqual({ missed: [], invisible: [], hidden: [], clipped: [] });
      });
    }
  });
}

test.describe('keyboard activation', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });
  test('copy, mode toggle and md download work from the keyboard', async ({ page }) => {
    const guide = siteConfig.guides.find((g) => g.id === 'final');
    await openPage(page, '/#/final');
    const copy = page.locator('#doc .btn-copy').first();
    await copy.focus();
    await page.keyboard.press('Enter');
    await expect(copy.locator('[data-copy-label]')).toHaveText(siteConfig.ui.copied);

    const mode = page.locator('.mode-toggle');
    const before = await mode.getAttribute('aria-pressed');
    await mode.focus();
    await page.keyboard.press('Space');
    await expect(mode).not.toHaveAttribute('aria-pressed', before);

    await page.locator('.guide-tools a[download]').focus();
    const [dl] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Enter')]);
    expect(dl.suggestedFilename()).toBe(guide.downloadName);
  });
});

/** 24px 미만이면서 문장 안·간격 예외에도 들지 않는 조작 요소. */
const smallTargets = (page) => page.evaluate((sel) => {
  const all = [...document.querySelectorAll(sel)].filter((e) => e.checkVisibility({ visibilityProperty: true }))
    .map((e) => ({ e, r: e.getBoundingClientRect() }));
  const inSentence = (e) => {
    if (getComputedStyle(e).display !== 'inline') return false;
    const block = e.closest('p, li, td, th, blockquote, dd, dt, figcaption');
    return !!(block && block.textContent.replace(e.textContent, '').trim());
  };
  const under = all.filter(({ e, r }) => (r.width < 24 || r.height < 24) && !inSentence(e));
  const center = (r) => [r.left + r.width / 2, r.top + r.height / 2];
  // 간격 예외(2.5.8 Spacing): 중심에 지름 24px 원을 그려 다른 대상이나 다른 작은 대상의 원과 겹치지 않으면 통과.
  const circleHitsRect = ([cx, cy], r) => Math.hypot(cx - Math.max(r.left, Math.min(cx, r.right)), cy - Math.max(r.top, Math.min(cy, r.bottom))) < 12;
  return under.filter((u) => {
    const c = center(u.r);
    return all.some((o) => o !== u && !o.e.contains(u.e) && !u.e.contains(o.e) && circleHitsRect(c, o.r))
      || under.some((o) => o !== u && Math.hypot(c[0] - center(o.r)[0], c[1] - center(o.r)[1]) < 24);
  }).map(({ e, r }) => `${e.tagName}.${e.className} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 16)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
}, FOCUSABLE);

// 2.5.8: 문장 안 링크·용어(Inline 예외)와 비활성 컨트롤을 뺀 모든 조작 요소는 24×24 CSS px 이상.
// '문장 안' = display:inline이고, 감싼 글 블록에 그 요소 말고도 글이 있다(목록에 링크만 있으면 문장이 아니다).
for (const width of [375, 1280]) {
  test.describe(`${width}px targets`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const s of screens) {
      test(`controls are at least 24px: ${s.name}`, async ({ page }) => {
        await s.open(page);
        const small = await smallTargets(page);
        expect(small).toEqual([]);
      });
    }
  });
}

// 대조군: 붙어 있는 16px 버튼 두 개는 간격 예외에 들지 않아 잡혀야 한다.
test('the target check catches two touching 16px buttons', async ({ page }) => {
  await openPage(page, '/#/');
  await page.evaluate(() => document.querySelector('main').insertAdjacentHTML('afterbegin',
    '<div><button style="all:unset;display:inline-block;width:16px;height:16px">a</button><button style="all:unset;display:inline-block;width:16px;height:16px">b</button></div>'));
  expect((await smallTargets(page)).length).toBe(2);
});
