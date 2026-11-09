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

  for (const g of siteConfig.guides) {
    test(`page bottom highlights the last heading (${g.id})`, async ({ page }) => {
      await openPage(page, `/#/${g.id}`);
      const ids = await tocIds(page);
      await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      await twoFrames(page);
      await expect(current(page)).toHaveAttribute('data-toc-id', ids.at(-1));
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
