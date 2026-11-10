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

// content-visibility의 paint 격리는 블록 밖으로 나온 장식(통과 조건 상자의 테이프 등)을 자른다.
// 블록 종류마다 하나씩, 블록 바깥 12px 띠의 픽셀을 격리를 푼 상태와 비교한다(안쪽 글자의 1px 미만 어긋남은 보지 않는다).
test('content-visibility does not clip decorations outside body blocks', async ({ page }) => {
  await openPage(page, '/#/final');
  const kinds = await page.locator('#doc > *').evaluateAll((els) => {
    const seen = new Set();
    return els.map((el, i) => [el, i]).filter(([el]) => {
      if (getComputedStyle(el).contentVisibility !== 'auto') return false;
      const k = `${el.tagName}.${el.className}`;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    }).map(([el, i]) => ({ i, k: `${el.tagName}.${el.className}` }));
  });
  const clipped = [];
  for (const { i, k } of kinds) {
    const el = page.locator('#doc > *').nth(i);
    await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(80);
    const box = await el.boundingBox();
    const m = 12;
    const clip = { x: Math.max(0, box.x - m), y: Math.max(0, box.y - m), width: box.width + 2 * m, height: box.height + 2 * m };
    const a = (await page.screenshot({ clip })).toString('base64');
    await el.evaluate((e) => { e.style.contentVisibility = 'visible'; });
    await page.waitForTimeout(80);
    const b = (await page.screenshot({ clip })).toString('base64');
    await el.evaluate((e) => { e.style.contentVisibility = ''; });
    const diff = await page.evaluate(async ({ a, b, inner }) => {
      const read = async (png) => {
        const img = new Image(); img.src = `data:image/png;base64,${png}`; await img.decode();
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
        const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
        return { d: ctx.getImageData(0, 0, img.width, img.height).data, w: img.width, h: img.height };
      };
      const [p, q] = [await read(a), await read(b)];
      let n = 0;
      for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
        if (x >= inner.x && x < inner.x + inner.w && y >= inner.y && y < inner.y + inner.h) continue;
        const o = (y * p.w + x) * 4;
        if (Math.abs(p.d[o] - q.d[o]) + Math.abs(p.d[o + 1] - q.d[o + 1]) + Math.abs(p.d[o + 2] - q.d[o + 2]) > 24) n++;
      }
      return n;
    }, { a, b, inner: { x: box.x - clip.x, y: box.y - clip.y, w: box.width, h: box.height } });
    if (diff > 4) clipped.push(`${k} ${diff}px`);
  }
  expect(kinds.length).toBeGreaterThan(3);
  expect(clipped).toEqual([]);
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

    // 웹폰트가 늦게 오면 대체 글꼴로 잰 높이가 남는다(리뷰 측정: 375px에서 10블록, 합계 300px). 글꼴이 오면 다시 잰다.
    test('unrendered body blocks hold their real height after late web fonts', async ({ page }) => {
      await page.route('**/*.woff2', async (route) => { await new Promise((ok) => setTimeout(ok, 1500)); await route.continue(); });
      await openPage(page, '/#/final');
      const gap = () => page.evaluate(() => {
        const h = () => document.documentElement.scrollHeight;
        const a = h();
        const cv = [...document.querySelectorAll('#doc > *')].filter((el) => getComputedStyle(el).contentVisibility === 'auto');
        for (const el of cv) Object.assign(el.style, { contentVisibility: 'visible', contain: 'layout style paint' });
        const b = h();
        for (const el of cv) { el.style.removeProperty('content-visibility'); el.style.removeProperty('contain'); }
        return Math.abs(a - b);
      });
      await page.evaluate(() => document.fonts.ready);
      await expect.poll(gap, { timeout: 8000 }).toBeLessThanOrEqual(2);
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
