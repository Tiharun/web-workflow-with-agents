// 등장 모션(블록 단위, 한 번만)과 진행 막대. 스펙 §8 M4.
import { test, expect } from '@playwright/test';
import { openPage, twoFrames, tocIds } from './helpers.mjs';

// 화면 안(아래 10%는 아직 트리거 전이라 뺀다)에서 아직 읽기 어려운(불투명도 0.9 미만) 블록 수.
// 모션 끝(정확히 1)까지 기다리면 부하에 따라 흔들리므로 읽을 수 있는 시점으로 잰다.
const hiddenInView = (page) => page.locator('#doc > *').evaluateAll((els) => els.filter((e) => {
  const r = e.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight * 0.9 && +getComputedStyle(e).opacity < 0.9;
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
    // 그려지는 블록만 센다(hr처럼 높이 0인 요소는 모션 대상이 아니다). 1280×800에서 첫 화면 아래
    const block = page.locator('#doc > *').filter({ visible: true }).nth(30);
    await expect(block).toHaveCSS('opacity', '0');
    await block.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(block).toHaveCSS('opacity', '1', { timeout: 2000 });
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await block.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await twoFrames(page);
    expect(await block.evaluate((el) => getComputedStyle(el).opacity)).toBe('1'); // 다시 숨었다 올라오지 않는다
    expect(await block.getAttribute('style') ?? '').not.toMatch(/opacity/);
  });

  test('scrolling blocks into view leaves no console warnings', async ({ page }) => {
    // 한 묶음이 모두 화면 안이면 '지나친 블록' 목록이 비어, 빈 목록을 gsap.set에 넘기면 'GSAP target  not found' 경고가 났다(M6 Lighthouse 측정)
    const warns = [];
    page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') warns.push(m.text()); });
    await openPage(page, '/#/final');
    // 읽듯이 조금씩 내리면 새로 들어온 블록이 모두 화면 안이다
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(150);
    }
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(1000);
    expect(warns).toEqual([]);
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

  test('a big batch starts within 0.3s of its first block (total stagger is capped)', async ({ page }) => {
    await openPage(page, '/#/design');
    // 블록마다 처음 보이기 시작한 시각을 재서, 첫 블록과 마지막 블록의 간격을 본다(부하로 전체가 밀려도 간격은 그대로).
    const starts = await page.evaluate(async () => {
      scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' });
      const seen = new Map();
      const t0 = performance.now();
      while (performance.now() - t0 < 1800) {
        await new Promise((ok) => requestAnimationFrame(ok));
        for (const e of document.querySelectorAll('#doc > *')) {
          const r = e.getBoundingClientRect();
          if (r.bottom > 0 && r.top < innerHeight * 0.9 && !seen.has(e) && +getComputedStyle(e).opacity > 0.05) seen.set(e, performance.now());
        }
      }
      return [...seen.values()];
    });
    expect(starts.length).toBeGreaterThan(5); // 큰 묶음이어야 의미가 있다
    expect(Math.max(...starts) - Math.min(...starts)).toBeLessThan(300);
  });

  // 스크롤이 멈출 때까지 기다린다(부드러운 스크롤 끝).
  const scrollSettled = (page) => page.evaluate(async () => {
    let last = -1, still = 0;
    while (still < 6) { await new Promise((ok) => requestAnimationFrame(ok)); still = scrollY === last ? still + 1 : 0; last = scrollY; }
  });

  test('a smooth toc jump to the last stage is readable within 1s of the scroll ending', async ({ page }) => {
    await openPage(page, '/#/final');
    await page.locator('[data-toc-open]').click();
    await page.locator('.toc__nav a:visible').last().click();
    await page.waitForTimeout(300); // 대화상자가 닫히고 스크롤이 시작되기를 기다린다
    await scrollSettled(page);
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(5000); // 실제로 멀리 이동했다
    await expect.poll(() => hiddenInView(page), { timeout: 1000 }).toBe(0);
  });

  test('find-in-page (Ctrl+F) to text in a block not yet revealed shows it within 2s', async ({ page }) => {
    await openPage(page, '/#/final');
    const word = await page.locator('#doc > p').evaluateAll((ps) => {
      const p = ps[Math.floor(ps.length * 0.7)];
      return p.textContent.trim().slice(0, 12);
    });
    expect(await page.evaluate((w) => window.find(w), word)).toBe(true); // 브라우저 찾기와 같은 즉시 스크롤
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(2000);
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

// GSAP는 필요할 때 받는다(계획 M7 Task 5). 첫 화면은 GSAP를 기다리지 않고, 받지 못해도 글과 단계 자가 보인다.
const delayGsap = (page, ms) => page.route('**/vendor/gsap/**', async (route) => { await new Promise((ok) => setTimeout(ok, ms)); await route.continue(); });
const notOpaque = (page, sel, inViewOnly) => page.locator(sel).evaluateAll((els, only) => els.filter((e) => {
  const r = e.getBoundingClientRect();
  if (only && !(r.bottom > 0 && r.top < innerHeight)) return false;
  return getComputedStyle(e).opacity !== '1';
}).length, inViewOnly);
const scrollToEnd = (page) => page.evaluate(async () => {
  for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
    scrollTo({ top: y, behavior: 'instant' });
    await new Promise((ok) => setTimeout(ok, 30));
  }
});

test('reduced motion never downloads GSAP', async ({ page }) => {
  const gsapRequests = [];
  page.on('request', (r) => { if (r.url().includes('/vendor/gsap/')) gsapRequests.push(r.url()); });
  for (const path of ['/#/', '/#/final']) {
    await openPage(page, path);
    await scrollToEnd(page);
  }
  expect(gsapRequests).toEqual([]);
});

test.describe('lazy GSAP', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 1280, height: 800 } });

  test('the first screen does not wait for GSAP', async ({ page }) => {
    await delayGsap(page, 3000);
    // load 이벤트는 모듈 그래프 전체를 기다리므로 응답 시작(commit)부터 잰다.
    await page.goto('/#/', { waitUntil: 'commit' });
    await expect(page.locator('.hero__lead')).toBeVisible({ timeout: 1000 });
    await page.goto('/#/final', { waitUntil: 'commit' });
    await page.reload({ waitUntil: 'commit' });
    await expect(page.locator('#doc h1')).toBeVisible({ timeout: 1000 });
  });

  test('blocks already in view when GSAP arrives are never hidden', async ({ page }) => {
    await delayGsap(page, 1000);
    await page.goto('/#/final');
    await page.locator('.doc:not([aria-busy])').waitFor();
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' }));
    await page.waitForTimeout(1500);
    expect(await notOpaque(page, '#doc > *', true)).toBe(0);
  });

  // 화면 맨 아래 8% 띠(IO rootMargin이 빼는 곳)에 이미 보이는 블록도 GSAP가 온 뒤 숨으면 안 된다.
  for (const path of ['/#/final', '/#/']) {
    test(`a block already showing in the bottom band stays visible when GSAP arrives (${path})`, async ({ page }) => {
      // GSAP 응답을 붙잡아 두었다가 블록을 띠에 놓은 뒤에 보낸다.
      let release; const gate = new Promise((ok) => { release = ok; });
      let requested = false;
      await page.route('**/vendor/gsap/**', async (route) => { requested = true; await gate; await route.continue(); });
      if (path === '/#/') await page.setViewportSize({ width: 1280, height: 520 }); // 홈은 카드가 화면 아래에 있어야 한다
      await page.goto(path);
      // 가이드는 블록 높이를 다 잰 뒤(그 전엔 위치가 바뀐다) 둔다.
      await page.locator(path === '/#/' ? '.home:not([data-font-wait])' : '#doc[data-sized]').waitFor({ state: 'attached' });
      const sel = path === '/#/' ? '.hero__visual, .entry__grid > li' : '#doc > *';
      // 아래쪽 블록 하나의 윗변이 화면 높이의 96%에 오도록 스크롤한다.
      const placed = await page.locator(sel).evaluateAll((els) => {
        const el = els.find((e) => e.getBoundingClientRect().top > innerHeight);
        if (!el) return false;
        scrollTo({ top: scrollY + el.getBoundingClientRect().top - innerHeight * 0.96, behavior: 'instant' });
        el.dataset.band = '';
        const t = el.getBoundingClientRect().top;
        return t > innerHeight * 0.92 && t < innerHeight;
      });
      expect(placed).toBe(true);
      await expect.poll(() => requested).toBe(true);
      await page.waitForTimeout(300);
      release();
      await page.waitForTimeout(1500);
      expect(await page.locator('[data-band]').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
      expect(await notOpaque(page, sel, true)).toBe(0);
    });
  }

  test('leaving before GSAP arrives leaves the next guide visible', async ({ page }) => {
    await delayGsap(page, 1000);
    await page.goto('/#/final');
    await page.locator('.doc:not([aria-busy])').waitFor();
    await page.evaluate(() => { location.hash = '#/steps'; });
    await page.locator('#doc[data-loaded]').waitFor();
    await page.waitForTimeout(2000);
    expect(await notOpaque(page, '#doc > *', true)).toBe(0);
    await scrollToEnd(page);
    await page.waitForTimeout(1200);
    expect(await notOpaque(page, '#doc > *', false)).toBe(0);
  });

  test('blocked GSAP still shows every block and the ruler', async ({ page }) => {
    await page.route('**/vendor/gsap/**', (route) => route.abort());
    await page.goto('/#/');
    await expect(page.locator('.ruler')).toBeVisible();
    await expect(page.locator('.ruler-skeleton')).toBeHidden();
    await page.goto('/#/final');
    await page.locator('.doc:not([aria-busy])').waitFor();
    await scrollToEnd(page);
    expect(await notOpaque(page, '#doc > *', false)).toBe(0);
  });

  test('the home ruler still draws on a first visit', async ({ page }) => {
    await delayGsap(page, 500);
    // 단계 자가 붙은 뒤 첫 그림 직전(rAF)의 --draw 값을 잡는다. GSAP 타임라인은 다음 rAF 틱에서 첫 값을 넣으므로
    // 그보다 늦게 등록한 이 rAF가 같은 프레임의 그림 전 상태를 본다.
    await page.addInitScript(() => {
      new MutationObserver((_, mo) => {
        const list = document.querySelector('.ruler__list');
        if (!list) return;
        mo.disconnect();
        requestAnimationFrame(() => { window.__firstDraw = list.style.getPropertyValue('--draw'); });
      }).observe(document, { childList: true, subtree: true });
    });
    await page.goto('/#/');
    await page.locator('.ruler').waitFor();
    const first = await page.waitForFunction(() => window.__firstDraw !== undefined).then(() => page.evaluate(() => window.__firstDraw));
    expect(first).not.toBe('');
    expect(Number(first)).toBeLessThan(1);
    await page.waitForTimeout(2000);
    expect(await page.locator('.ruler__list').evaluate((el) => el.style.getPropertyValue('--draw'))).toBe('');
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
