// 탐색(M3): 현재 위치 강조, 메가메뉴·모바일 메뉴, 목차 드로어, smooth scroll, 단계 0개.
import { test, expect } from '@playwright/test';
import { openPage, twoFrames, tocIds } from './helpers.mjs';
import { siteConfig } from '../../js/site-config.js';

const current = (page) => page.locator('#toc a[aria-current="location"]');
const middle = (ids) => ids[Math.floor(ids.length / 2)];

test.describe('current location', () => {
  for (const width of [1280, 375]) {
    test.describe(`${width}px`, () => {
      test.use({ viewport: { width, height: 800 } });
      test('scrolling to a heading highlights it', async ({ page }) => {
        await openPage(page, '/#/final');
        const id = middle(await tocIds(page));
        await page.evaluate((i) => document.getElementById(i).scrollIntoView({ block: 'start', behavior: 'instant' }), id);
        await twoFrames(page);
        await expect(current(page)).toHaveCount(1);
        await expect(current(page)).toHaveAttribute('data-toc-id', id);
      });
    });
  }

  test('opening the toc after a stage jump shows and focuses that stage', async ({ page }) => {
    await openPage(page, '/#/final');
    const id = middle(await tocIds(page));
    await openPage(page, `/#/final/${encodeURIComponent(id)}`);
    await twoFrames(page);
    await page.locator('[data-toc-open]').click();
    await expect(current(page)).toHaveCount(1);
    await expect(current(page)).toHaveAttribute('data-toc-id', id);
    await expect(current(page)).toBeFocused();
  });

  for (const width of [1280, 375]) {
    test(`a stage jump stops the heading just below the sticky bars (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openPage(page, '/#/final');
      const id = middle(await tocIds(page));
      await openPage(page, `/#/final/${encodeURIComponent(id)}`);
      await twoFrames(page);
      // 멈춤선 = html scroll-padding-top(헤더 + 80rem 미만 도구 막대 + 20px). 한 번만 적용돼야 한다.
      const { top, pad } = await page.evaluate((i) => ({
        top: document.getElementById(i).getBoundingClientRect().top,
        pad: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),
      }), id);
      expect(Math.abs(top - pad)).toBeLessThanOrEqual(1);
    });
  }

  for (const g of siteConfig.guides) {
    test(`page bottom highlights the last heading (${g.id})`, async ({ page }) => {
      await openPage(page, `/#/${g.id}`);
      const ids = await tocIds(page);
      await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      await twoFrames(page);
      await expect(current(page)).toHaveAttribute('data-toc-id', ids.at(-1));
    });
  }

  // 끝 근처라 멈춤선까지 못 오는 제목으로 이동하면 페이지 끝이어도 고른 제목을 강조한다.
  for (const [width, height] of [[1440, 900], [768, 1024]]) {
    test(`jumping to a heading that cannot reach the top highlights it (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/#/design');
      const id = (await tocIds(page)).at(-2);
      await openPage(page, `/#/design/${encodeURIComponent(id)}`);
      await twoFrames(page);
      expect(await page.evaluate(() => scrollY >= document.documentElement.scrollHeight - innerHeight - 1)).toBe(true);
      await expect(current(page)).toHaveAttribute('data-toc-id', id);
    });
  }
});

// 스크롤 위치를 모두 기록한다. 즉시 이동이면 중간값이 없고, 부드러운 이동이면 생긴다(pages.spec와 같은 방식).
const record = (page) => page.evaluate(() => { window.__ys = []; addEventListener('scroll', () => window.__ys.push(Math.round(scrollY))); });
const guideBtn = (page, id) => page.locator(`.guide-nav__btn[data-guide="${id}"]`);
const idFromHref = (href) => decodeURIComponent(href.split('/').pop());
// 전제 고정: 그 점은 헤더 밖이고 조작 요소가 아니다(바깥 '빈 곳' 클릭).
const expectBlank = async (page, x, y) => expect(await page.evaluate(([px, py]) => {
  const el = document.elementFromPoint(px, py);
  return { inHeader: !!el.closest('.site-header'), control: !!el.closest('a,button,[tabindex]') };
}, [x, y])).toEqual({ inHeader: false, control: false });

test.describe('mega menu', () => {
  for (const g of siteConfig.guides) {
    test(`home to any stage in two clicks (${g.id})`, async ({ page }) => {
      await openPage(page, '/#/');
      await guideBtn(page, g.id).click(); // 1
      const mega = page.locator(`#mega-${g.id}`);
      await mega.locator('a').first().waitFor();
      const target = (await mega.locator('.mega__stage').count()) ? mega.locator('.mega__stage').last() : mega.locator('.mega__link').last();
      const href = await target.getAttribute('href');
      await target.click(); // 2
      await expect.poll(() => page.evaluate(() => decodeURIComponent(location.hash))).toBe(href);
      const heading = page.locator(`[id="${idFromHref(href)}"]`);
      await expect(heading).toBeFocused();
      await expect(heading).toBeInViewport();
      for (const other of siteConfig.guides) {
        if (other.id === g.id) await expect(guideBtn(page, other.id)).toHaveAttribute('aria-current', 'page');
        else await expect(guideBtn(page, other.id)).not.toHaveAttribute('aria-current');
      }
    });
  }

  test('mega closes on Escape from inside and focus returns to its button', async ({ page }) => {
    await openPage(page, '/#/');
    const btn = guideBtn(page, 'final');
    await btn.focus();
    await page.keyboard.press('Enter');
    await page.locator('#mega-final a').first().waitFor();
    await page.keyboard.press('Tab');
    await expect(page.locator('#mega-final a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mega-final')).toBeHidden();
    await expect(btn).toBeFocused();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('mega closes on outside click and focus returns to its button', async ({ page }) => {
    await openPage(page, '/#/');
    const btn = guideBtn(page, 'final');
    await btn.click();
    await page.locator('#mega-final a').first().waitFor();
    // 메가메뉴는 폭 전체를 덮는다(1280px에서 위 58~488px). 그 아래 빈 곳을 누른다.
    await expectBlank(page, 640, 700);
    await page.mouse.click(640, 700);
    await expect(page.locator('#mega-final')).toBeHidden();
    await expect(btn).toBeFocused();
  });

  test.describe(() => {
    test.use({ permissions: ['clipboard-read', 'clipboard-write'] });
    // [목차]는 메가메뉴에 덮여 누를 수 없다. 메가메뉴 아래로 보이는 본문 조작 요소(복사 버튼)를 누른다.
    test('outside click on another control keeps its focus', async ({ page }) => {
      await openPage(page, '/#/final');
      const copy = page.locator('#doc .prompt button[data-copy]').first();
      await copy.evaluate((el) => scrollBy({ top: el.getBoundingClientRect().top - 650, behavior: 'instant' }));
      await guideBtn(page, 'final').click();
      await page.locator('#mega-final a').first().waitFor();
      await copy.click();
      await expect(page.locator('#mega-final')).toBeHidden();
      await expect(copy).toBeFocused();
    });

    // macOS Safari·Firefox는 버튼을 눌러도 초점을 주지 않는다(합성 클릭으로 재현). 그래도 연 버튼으로 초점을 끌어오지 않는다.
    test('outside click on a control that takes no focus leaves focus alone', async ({ page }) => {
      await openPage(page, '/#/final');
      const copy = page.locator('#doc .prompt button[data-copy]').first();
      await copy.evaluate((el) => scrollBy({ top: el.getBoundingClientRect().top - 650, behavior: 'instant' }));
      await guideBtn(page, 'final').click();
      await page.locator('#mega-final a').first().waitFor();
      await page.evaluate(() => document.activeElement.blur());
      await copy.dispatchEvent('click');
      await expect(page.locator('#mega-final')).toBeHidden();
      expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    });
  });

  test('tabbing out of the mega menu closes it without moving focus', async ({ page }) => {
    await openPage(page, '/#/');
    await guideBtn(page, 'final').click();
    await page.locator('#mega-final a').first().waitFor();
    await page.locator('#mega-final a').last().focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#mega-final')).toBeHidden();
    await expect(guideBtn(page, 'steps')).toBeFocused();
  });
});

// 메가메뉴는 48rem 이상에서 보인다. 가장 좁은 폭에서도 항목이 화면 밖으로 넘치거나 낱자로 쪼개지지 않아야 한다.
for (const width of [768, 1024]) {
  test.describe(`${width}px mega menu`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const g of siteConfig.guides) {
      test(`mega items fit the viewport (${g.id})`, async ({ page }) => {
        await openPage(page, '/#/');
        await guideBtn(page, g.id).click();
        await page.locator(`#mega-${g.id} a`).last().waitFor();
        const bad = await page.locator(`#mega-${g.id} a`).evaluateAll((as, w) => as
          .map((a) => ({ t: a.textContent.trim().slice(0, 12), r: a.getBoundingClientRect(), sw: a.scrollWidth, cw: a.clientWidth, item: !a.matches('.mega__top') }))
          // 단계·장 항목은 최소 120px(낱자 줄바꿈 방지). '처음부터 읽기'는 글자 폭만큼인 인라인 링크라 제외.
          .filter(({ r, sw, cw, item }) => r.right > w || (item && r.width < 120) || sw > cw + 1)
          .map(({ t }) => t), width);
        expect(bad).toEqual([]);
      });
    }
  });
}

test.describe('375px mobile menu', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  const toggle = (page) => page.locator('.nav-toggle');

  test('Escape returns focus to the menu button', async ({ page }) => {
    await openPage(page, '/#/final');
    await toggle(page).click();
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-nav')).toBeHidden();
    await expect(toggle(page)).toBeFocused();
    await expect(toggle(page)).toHaveAttribute('aria-label', siteConfig.ui.openMenu);
  });

  test('outside click returns focus to the menu button', async ({ page }) => {
    await openPage(page, '/#/final');
    await toggle(page).click();
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await expectBlank(page, 187, 800);
    await page.mouse.click(187, 800);
    await expect(page.locator('#mobile-nav')).toBeHidden();
    await expect(toggle(page)).toBeFocused();
  });

  test('tabbing out of the mobile menu closes it', async ({ page }) => {
    await openPage(page, '/#/final');
    await toggle(page).click();
    await page.locator('.acc__btn').last().focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#mobile-nav')).toBeHidden();
    expect(await page.evaluate(() => !document.querySelector('.site-header').contains(document.activeElement))).toBe(true);
  });
});

test.describe('motion allowed', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('mega stage link scrolls smoothly into another guide', async ({ page }) => {
    await openPage(page, '/#/');
    await record(page);
    await guideBtn(page, 'final').click();
    await page.locator('#mega-final .mega__stage').last().click();
    await expect.poll(() => page.evaluate(() => window.__ys.length), { timeout: 3000 }).toBeGreaterThan(2);
  });
});

for (const motion of ['reduce', 'no-preference']) {
  test.describe(`toc drawer (motion ${motion})`, () => {
    test.use({ reducedMotion: motion });
    const tocBtn = (page) => page.locator('[data-toc-open]');
    const tocOpen = (page) => page.evaluate(() => document.getElementById('toc').open);
    const openAtMiddle = async (page) => {
      await openPage(page, '/#/final');
      const id = middle(await tocIds(page));
      await openPage(page, `/#/final/${encodeURIComponent(id)}`);
      await twoFrames(page);
      return id;
    };

    test('toc opens from the keyboard on the current item', async ({ page }) => {
      await openAtMiddle(page);
      await tocBtn(page).focus();
      await page.keyboard.press('Enter');
      await expect.poll(() => tocOpen(page)).toBe(true);
      await expect(tocBtn(page)).toHaveAttribute('aria-expanded', 'true');
      await expect(current(page)).toBeFocused();
    });

    test('toc closes on Escape and focus returns to the toc button', async ({ page }) => {
      await openAtMiddle(page);
      await tocBtn(page).focus();
      await page.keyboard.press('Enter');
      await expect(current(page)).toBeFocused();
      await page.keyboard.press('Escape');
      await expect.poll(() => tocOpen(page)).toBe(false);
      await expect(tocBtn(page)).toBeFocused();
      await expect(tocBtn(page)).toHaveAttribute('aria-expanded', 'false');
    });

    test('toc closes on backdrop click and focus returns to the toc button', async ({ page }) => {
      await openAtMiddle(page);
      await tocBtn(page).click();
      await expect.poll(() => tocOpen(page)).toBe(true);
      // 드로어 폭은 min(24rem, 88vw)라 오른쪽 끝은 늘 배경이다.
      await page.mouse.click(page.viewportSize().width - 20, 400);
      await expect.poll(() => tocOpen(page)).toBe(false);
      await expect(tocBtn(page)).toBeFocused();
    });

    test('toc link focuses the chosen heading', async ({ page }) => {
      await openPage(page, '/#/final');
      await tocBtn(page).click();
      const ids = await tocIds(page);
      const id = ids[Math.floor(ids.length / 3)];
      await page.locator(`#toc a[data-toc-id="${id}"]`).click();
      await page.waitForFunction(() => { const d = document.getElementById('toc'); return !d.open && !d.classList.contains('is-closing'); });
      await twoFrames(page);
      await expect(page.locator(`[id="${id}"]`)).toBeFocused();
      expect(await page.evaluate(() => decodeURIComponent(location.hash))).toMatch(new RegExp(`/${id}$`));
    });
  });
}

const stepsGuide = siteConfig.guides.find((g) => g.id === 'steps');
const emptyStepsMd = '# 빈 가이드\n\n### 소제목\n\n본문\n';
const serveEmptySteps = (page) => page.route(`**/${stepsGuide.file}`, (route) => route.fulfill({ status: 200, contentType: 'text/markdown; charset=utf-8', body: emptyStepsMd }));

test.describe('menu body states', () => {
  test('zero stages: mega shows only the guide-top link', async ({ page }) => {
    await serveEmptySteps(page);
    await openPage(page, '/#/');
    await guideBtn(page, 'steps').click();
    const mega = page.locator('#mega-steps');
    await expect(mega.locator('a')).toHaveCount(1);
    await expect(mega.locator('a')).toHaveText(siteConfig.ui.guideTop);
    await expect(mega.locator('a')).toHaveAttribute('href', '#/steps');
    await expect(mega.locator('ol')).toHaveCount(0);
  });

  test.describe('375px', () => {
    test.use({ viewport: { width: 375, height: 812 } });
    test('zero stages: accordion shows only the guide-top link', async ({ page }) => {
      await serveEmptySteps(page);
      await openPage(page, '/#/');
      await page.locator('.nav-toggle').click();
      await page.locator('.acc__btn[data-guide="steps"]').click();
      const acc = page.locator('#acc-steps');
      await expect(acc.locator('a')).toHaveCount(1);
      await expect(acc.locator('a')).toHaveText(siteConfig.ui.guideTop);
      await expect(acc.locator('ol')).toHaveCount(0);
    });
  });

  test('menu fill failure shows the error and retries on reopen', async ({ page }) => {
    // 첫 화면 뒤 미리 받기가 요청을 먼저 쓰지 않게 막는다.
    await page.addInitScript(() => { window.requestIdleCallback = () => 0; });
    let calls = 0;
    await page.route(`**/${stepsGuide.file}`, (route) => (++calls === 1 ? route.abort() : route.continue()));
    await openPage(page, '/#/');
    const btn = guideBtn(page, 'steps');
    await btn.click();
    const error = page.locator('#mega-steps .menu-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText(siteConfig.ui.loadError);
    await expect(error.locator('a[href="#/steps"]')).toHaveCount(1);
    await btn.click(); // 닫기
    await btn.click(); // 다시 열기
    await expect(page.locator('#mega-steps .mega__link').first()).toBeVisible();
    expect(calls).toBe(2);
  });
});

// 늘 보이는 sticky 막대(헤더·가이드 도구)의 조작 요소는 초점을 받아도 페이지를 굴리지 않는다.
// 루트 scroll-padding-top 영역 안이라 Chrome이 '가려졌다'고 보고 수백 px 굴렸다(측정 375px 490px, 1280px 460px).
test.describe('focus on sticky bars keeps the reading position', () => {
  const stickyControls = '.site-header .brand, .guide-nav__btn, .site-header__tools :is(a, button), .guide-tools :is(a, button)';
  for (const width of [375, 768, 1280]) {
    test(`focusing each sticky control does not scroll (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openPage(page, '/#/final');
      const moved = await page.evaluate((sel) => [...document.querySelectorAll(sel)]
        .filter((el) => el.getClientRects().length)
        .map((el) => { scrollTo({ top: 8000, behavior: 'instant' }); el.focus(); return [el.className, scrollY - 8000]; })
        .filter(([, d]) => d !== 0), stickyControls);
      expect(moved).toEqual([]);
    });
  }

  test('Escape from the mega menu returns focus without scrolling', async ({ page }) => {
    await openPage(page, '/#/final');
    await page.evaluate(() => scrollTo({ top: 8000, behavior: 'instant' }));
    await guideBtn(page, 'final').click();
    await page.locator('#mega-final a').first().waitFor();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');
    await expect(guideBtn(page, 'final')).toBeFocused();
    await twoFrames(page);
    expect(await page.evaluate(() => scrollY)).toBe(8000);
  });

  // 키가 낮은 창(확대 포함)은 메가메뉴 안에서 스크롤한다. 뒤로 탭해도 초점 항목이 보이고 페이지는 그대로다(WCAG 2.4.11).
  test('tabbing through a short mega menu keeps each link visible and the page still', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 400 });
    await openPage(page, '/#/final');
    await page.evaluate(() => scrollTo({ top: 3000, behavior: 'instant' }));
    await guideBtn(page, 'final').evaluate((b) => b.focus());
    await page.keyboard.press('Enter');
    await page.locator('#mega-final .mega__stage').first().waitFor();
    const n = await page.locator('#mega-final a').count();
    const visible = () => page.evaluate(() => {
      const a = document.activeElement;
      const box = a.closest('.mega__inner').getBoundingClientRect();
      const r = a.getBoundingClientRect();
      return Math.min(r.bottom, box.bottom, innerHeight) - Math.max(r.top, box.top, 0) > 0;
    });
    const hidden = [];
    for (let i = 0; i < n; i++) { await page.keyboard.press('Tab'); if (!(await visible())) hidden.push(`tab ${i}`); }
    for (let i = 0; i < n - 1; i++) { await page.keyboard.press('Shift+Tab'); if (!(await visible())) hidden.push(`back ${i}`); }
    expect(hidden).toEqual([]);
    expect(await page.evaluate(() => scrollY)).toBe(3000);
  });

  test.describe('375px', () => {
    test.use({ viewport: { width: 375, height: 812 } });
    test('tabbing into the mobile menu does not scroll the page', async ({ page }) => {
      await openPage(page, '/#/final');
      await page.locator('.nav-toggle').evaluate((b) => b.focus());
      await page.evaluate(() => scrollTo({ top: 3000, behavior: 'instant' }));
      await page.keyboard.press('Enter');
      await expect(page.locator('#mobile-nav')).toBeVisible();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await twoFrames(page);
      expect(await page.evaluate(() => scrollY)).toBe(3000);
      await page.keyboard.press('Escape');
      await expect(page.locator('.nav-toggle')).toBeFocused();
      await twoFrames(page);
      expect(await page.evaluate(() => scrollY)).toBe(3000);
    });
  });

  test.describe('375px', () => {

    test.use({ viewport: { width: 375, height: 812 } });
    test('closing the toc returns focus to its button without scrolling', async ({ page }) => {
      await openPage(page, '/#/final');
      await page.locator('[data-toc-open]').evaluate((b) => b.focus());
      await page.evaluate(() => scrollTo({ top: 8000, behavior: 'instant' }));
      await page.keyboard.press('Enter');
      await expect.poll(() => page.evaluate(() => document.getElementById('toc').open)).toBe(true);
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-toc-open]')).toBeFocused();
      await twoFrames(page);
      expect(await page.evaluate(() => scrollY)).toBe(8000);
    });
  });
});
