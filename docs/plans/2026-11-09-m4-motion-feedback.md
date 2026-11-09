# M4 모션·피드백·편의 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 등장 모션·진행 막대·스켈레톤·툴팁·[⬇ md]·다크 모드를 e2e로 고정하고, 측정으로 찾은 버그 3개를 고친다.

**Architecture:** 시제품 구조는 그대로 두고 다섯 파일만 고친다.
- `js/motion.js`: `reveal`의 묶음 콜백(건너뛴 블록은 즉시 표시).
- `js/md.js`: 다 불러온 문서를 바로 꺼내는 `readyDoc(guide)` 추가.
- `js/guide.js`·`js/home.js`·`js/header.js`: `readyDoc`이 있으면 스켈레톤 없이 바로 그린다.
- `js/tooltip.js`: 스크롤할 때 초점 받은 툴팁은 따라가고, 포인터 툴팁만 닫는다.

CSS·siteConfig·`main.js`·`index.html`은 바꾸지 않는다. 새 e2e 파일 4개(`motion`·`skeleton`·`tooltip`·`convenience`)에 M4 테스트를 모은다.

**Tech Stack:** 바닐라 ES 모듈, GSAP 3.15.0 + ScrollTrigger(`vendor/gsap/`), `@playwright/test` 1.64.1(Chromium), Node 22 `node:test`, `tests/serve.py`(8123).

**Spec:** [docs/specs/2026-11-08-guide-site-design.md](../specs/2026-11-08-guide-site-design.md) §2-4(모션), §5(스켈레톤·localStorage 막힘), §6(e2e·시각), §8 M4. 기준: [brief](../brief.md) '모션·피드백'·'편의'·'기능별 세부 규칙'(등장 모션·툴팁)·데이터 필드(`downloadName`).

## 측정한 출발점 (2026-11-09, Chromium, `main` 7bb26f9)

- 이미 맞는 것: 동작 줄이기에서 `#doc > *` 158개 모두 불투명·인라인 style 없음. 진행 막대 맨 아래 `scaleX(1)`. [⬇ md] 받은 이름 `최종 워크플로우 (Opus 5.5 Max).md`. 다크 모드: 기기 다크면 `aria-pressed="true"`, 토글 뒤 새로 고쳐도 유지, 저장값 없을 때 기기 설정 변경을 따름, localStorage를 막아도 오류 없이 이번 화면에 적용, `404.html`도 저장값 적용. 툴팁: Tab으로 [md]·다크 토글·용어에 초점 → 열림, Esc → 닫히고 초점 유지, 375px 탭 → 열림/다시 탭 → 닫힘, 포인터를 툴팁 위로 옮겨도 유지. 용어 툴팁 문장 26개 모두 md 원문에 있음.
- **버그 1 (멀리 이동하면 화면 안 글이 10초 넘게 안 보임)**: 모션 허용, 1280×800, `/#/final`에서 마지막 단계로 주소만 바꾸면 화면 안 블록 5개가 0.5·1.5·3·6·10초에 계속 투명, 14초에 보인다. 가운데로 즉시 스크롤해도 8개가 2초 뒤에도 투명.
  - 원인(측정): 숨은 블록의 트리거는 `isActive: true`인데 투명. `ScrollTrigger.batch`는 한 번에 지나친 블록의 onEnter를 모두 한 묶음으로 넘기고, 그 묶음에 `stagger: 0.08`이 걸려 약 130개 × 0.08초 ≈ 10초 뒤에야 화면 안 블록 차례가 온다. 묶음 동작은 [GSAP batch 문서](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.batch()) 참고(지나친 블록에도 onEnter가 오는지는 문서에 없어 측정으로 확인).
- **버그 2 (캐시된 문서에도 스켈레톤이 끼워짐)**: MutationObserver로 재 보니, 이미 받은 가이드를 다시 열 때 `.skeleton`, 홈으로 돌아올 때 `.ruler-skeleton`, 미리 받은 메뉴를 처음 열 때 `.menu-skeleton`이 DOM에 들어갔다 빠진다. 스펙 §5 '불러오기가 아직 안 끝났을 때만'과 다르고, 숨은 '문서를 불러오는 중' `role="status"`도 같이 끼워진다.
- **버그 3 (스크롤이 생기는 Tab 이동에서 툴팁이 바로 닫힘)**: 화면 아래 용어로 키보드 초점이 가면 브라우저가 스크롤하고, `tooltip.js`의 scroll 처리기가 툴팁을 닫는다(측정: 초점은 용어, `#tooltip` hidden). WCAG 1.4.13 '초점이 있는 동안 유지'([Understanding 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus))에 어긋난다.
- [⬇ md]는 `download` 속성으로 이름을 정한다. 같은 출처일 때만 이름이 적용되고 `Content-Disposition` 이름이 있으면 그쪽이 이긴다([MDN download](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/download)). GitHub Pages는 같은 출처라 그대로 둔다.

## 결정 (사용자 확인 필요)

1. **건너뛴 블록은 모션 없이 즉시 보인다.** 묶음이 올 때 화면 밖에 있는 블록은 바로 표시하고, 화면 안 블록만 지금 값(0.9초, `expo.out`, stagger 0.08)으로 올라온다.
2. **스크롤 중 툴팁**: 툴팁 주인이 키보드 초점을 가진 채 화면 안에 있으면 위치를 다시 잡아 유지한다. 포인터로 연 툴팁은 지금처럼 스크롤하면 닫는다.
3. **홈 단계 자 그리기 연출은 홈에 다시 올 때마다 재생**한다(지금 동작 유지). brief의 '한 번만'은 한 화면 안에서 되돌아가도 반복하지 않는다는 뜻으로 읽는다.

## Global Constraints

- 모션은 `transform`·`opacity`만, `prefers-reduced-motion: reduce`이면 즉시 표시, 스크립트가 꺼져도 글이 보인다(CSS로 숨기지 않는다).
- md 원문 문장은 바꾸지 않는다. 테스트용 지연·차단은 `page.route`로만 넣는다.
- 색·글꼴·간격은 `css/tokens.css` 토큰만. 이번 마일스톤은 CSS를 바꾸지 않는다. 바꿔야 하면 DESIGN.md부터 고친다.
- 사이트 이름·가이드 목록·UI 문구는 `js/site-config.js`에서만. 테스트도 문구·파일 이름을 하드코딩하지 않고 `siteConfig.ui`·`guides[].downloadName`·`guides[].file`을 쓴다.
- 공용 컴포넌트 재사용: `motionOK`·`focusEl`(`js/scroll.js`), `loadGuide`(`js/md.js`), `buildRuler`(`js/ruler.js`), 툴팁 `js/tooltip.js`. 같은 역할을 새로 만들지 않는다.
- 배포본은 빌드·npm 의존성 없음. 새 devDependency 없음.
- 저장은 localStorage `mode` 하나뿐. 새 저장값을 만들지 않는다.
- UI 문구는 합니다체. 새 문구를 만들지 않는다. 툴팁에 문서 밖 설명을 쓰지 않는다.
- 브랜치는 `m4-motion-feedback`(`main` 기준). 원격 푸시, PR, `main` 합치기는 사용자 확인을 받는다.
- **사소한 문제도 미루지 않는다**(사용자 결정, 2026-11-09). 리뷰 Minor도 이 마일스톤 안에서 RED→GREEN으로 고친다.

## Review Focus

1. **목차·메가메뉴·주소로 먼 단계에 이동(모션 허용)**: 도착한 화면의 글이 2초 안에 보여야 한다. → Task 1 `jumping to the last stage shows the blocks in view within 2s`
2. **Ctrl+F로 아직 안 나타난 블록의 글을 찾음**: 브라우저가 즉시 스크롤하므로 같은 경로다(brief: 검색은 Ctrl+F). → Task 1 `an instant scroll to the middle shows the blocks there within 2s`
3. **이미 받은 문서로 돌아옴(가이드·홈·메뉴 세 곳)**: 스켈레톤과 '불러오는 중' 알림이 끼워지지 않는다. → Task 2 세 테스트
4. **키보드로 화면 아래 용어까지 Tab**: 툴팁이 열린 채 그 용어 옆에 있다. → Task 3 `tabbing to a term below the fold keeps its tooltip next to it`
5. **배포 하위 경로에서 [⬇ md]**: 받은 이름이 한글 원래 이름이다. → Task 4 `md download keeps the Korean name under the deployed sub-path`

---

### Task 1: 등장 모션·진행 막대

**Files:**
- Create: `tests/e2e/motion.spec.mjs`
- Modify: `js/motion.js` (`reveal`의 `onEnter`)

**Interfaces:**
- Consumes: `openPage`, `twoFrames`, `tocIds`(`tests/e2e/helpers.mjs`)
- Produces: 없음(`reveal(root, selector) => () => void` 시그니처 그대로)

- [ ] **Step 1: 브랜치를 만들고 이 계획을 커밋한다**

Run: `git switch -c m4-motion-feedback`
Expected: `Switched to a new branch 'm4-motion-feedback'`

```bash
git add docs/plans/2026-11-09-m4-motion-feedback.md
git commit -m "M4: 모션·피드백·편의 구현 계획 문서"
```

- [ ] **Step 2: 실패하는 테스트를 쓴다**

```js
// tests/e2e/motion.spec.mjs — 등장 모션(블록 단위, 한 번만)과 진행 막대. 스펙 §8 M4.
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
```

- [ ] **Step 3: 실패를 확인한다**

Run: `npx playwright test --project=e2e tests/e2e/motion.spec.mjs`
Expected: `jumping to the last stage…`, `blocks skipped by a jump…`, `an instant scroll to the middle…` FAIL(`Expected: 0, Received: 5`류). 나머지 PASS.

- [ ] **Step 4: `reveal`의 `onEnter`를 고친다 (`js/motion.js`)**

묶음을 받을 때 화면과 겹치는 블록(`r.bottom > 0 && r.top < innerHeight`)만 지금 값(`opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, overwrite: true`)으로 올리고, 나머지는 `gsap.set(rest, { clearProps: 'opacity,transform,translate,rotate,scale' })`로 즉시 보인다. 화면 안 블록이 0개면 tween을 만들지 않는다. 지우는 속성 문자열은 파일 안 상수 하나로 묶어 `reveal`·`drawRuler`가 같이 쓴다. 파일 머리 주석에 '건너뛴 블록은 즉시'를 한 줄 더한다.

- [ ] **Step 5: 통과를 확인한다**

Run: `npx playwright test --project=e2e tests/e2e/motion.spec.mjs`
Expected: 8 passed

- [ ] **Step 6: 기존 테스트가 그대로인지 확인한다**

Run: `npm test`
Expected: 모두 PASS(실패 0)

- [ ] **Step 7: 커밋**

```bash
git add tests/e2e/motion.spec.mjs js/motion.js
git commit -m "M4: 멀리 이동해도 화면 안 글이 바로 보이게(건너뛴 블록 즉시 표시), 등장 모션·진행 막대 e2e"
```

---

### Task 2: 스켈레톤은 불러오는 동안만

**Files:**
- Create: `tests/e2e/skeleton.spec.mjs`
- Modify: `js/md.js` (`loadGuide`, `readyDoc` 추가)
- Modify: `js/guide.js` (`renderGuide` 첫 마크업과 불러오기)
- Modify: `js/home.js` (`renderHome`의 단계 자 칸)
- Modify: `js/header.js` (`fillMenu`)

**Interfaces:**
- Consumes: `loadGuide(guide) => Promise<Doc>`(`js/md.js`)
- Produces: `readyDoc(guide: { id: string }) => Doc | null` — 성공한 문서만 돌려준다. 불러오는 중·실패면 `null`. 실패해도 지우지 않는다(성공한 적 없으면 원래 없음).

- [ ] **Step 1: 실패하는 테스트를 쓴다**

```js
// tests/e2e/skeleton.spec.mjs — 스켈레톤은 md를 실제로 불러오는 동안에만(스펙 §5).
import { test, expect } from '@playwright/test';
import { openPage } from './helpers.mjs';

// 페이지가 뜨기 전부터 스켈레톤 3종이 DOM에 들어오는지 기록한다.
const watch = () => {
  window.__sk = [];
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
    if (n.nodeType !== 1) return;
    const sel = '.skeleton, .ruler-skeleton, .menu-skeleton';
    if (n.matches(sel)) window.__sk.push(n.className);
    n.querySelectorAll(sel).forEach((x) => window.__sk.push(x.className));
  }))).observe(document, { subtree: true, childList: true });
};
const go = async (page, hash) => {
  await page.evaluate((h) => { window.__sk.length = 0; location.hash = h; }, hash);
};
const inserted = (page) => page.evaluate(() => window.__sk.slice());

test.beforeEach(async ({ page }) => { await page.addInitScript(watch); });

test('first open with a slow md shows the skeleton until the body arrives', async ({ page }) => {
  await page.route('**/content/final-workflow.md', async (r) => { await new Promise((ok) => setTimeout(ok, 600)); await r.continue(); });
  await page.goto('/#/final');
  await expect(page.locator('#doc .skeleton')).toBeVisible();
  await expect(page.locator('#doc')).toHaveAttribute('aria-busy', 'true');
  await page.locator('#doc[data-loaded]').waitFor();
  await expect(page.locator('#doc .skeleton')).toHaveCount(0);
  await expect(page.locator('#doc')).not.toHaveAttribute('aria-busy');
});

test('revisiting a loaded guide never inserts the skeleton', async ({ page }) => {
  await openPage(page, '/#/final');
  await go(page, '#/steps');
  await page.locator('.guide[data-guide="steps"] #doc[data-loaded]').waitFor();
  await go(page, '#/final');
  await page.locator('.guide[data-guide="final"] #doc[data-loaded]').waitFor();
  expect(await inserted(page)).toEqual([]);
});

test('returning home with the md loaded never inserts the ruler skeleton', async ({ page }) => {
  await openPage(page, '/#/final');
  await go(page, '#/');
  await expect(page.locator('.hero__visual .ruler')).toBeVisible();
  expect(await inserted(page)).toEqual([]);
});

test('opening a menu whose md is loaded never inserts the menu skeleton', async ({ page }) => {
  await openPage(page, '/#/final');
  await page.evaluate(() => { window.__sk.length = 0; });
  await page.locator('.guide-nav__btn[data-guide="final"]').click();
  await expect(page.locator('#mega-final a').first()).toBeVisible();
  expect(await inserted(page)).toEqual([]);
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx playwright test --project=e2e tests/e2e/skeleton.spec.mjs`
Expected: `revisiting…` FAIL(`["skeleton"]`), `returning home…` FAIL(`["ruler-skeleton"]`), `opening a menu…` FAIL(`["menu-skeleton"]`). `first open…` PASS.

- [ ] **Step 3: `readyDoc(guide)`를 만든다 (`js/md.js`)**

모듈 안 `const ready = new Map()`. `loadGuide`의 마지막 `.then`에서 `buildDoc` 결과를 `ready.set(guide.id, doc)` 한 뒤 돌려준다. `export const readyDoc = (guide) => ready.get(guide.id) ?? null;` 기존 `isLoaded`(어디서도 안 씀, 불러오는 중에도 true)는 지우지 않고 보고에 적는다.

- [ ] **Step 4: 세 화면이 `readyDoc`을 먼저 본다**

- `renderGuide`(`js/guide.js`): `const cached = readyDoc(guide)`. 있으면 `<article class="doc" id="doc">`를 빈 채로 만들고 `await` 없이 바로 그린다. 없을 때만 `aria-busy="true"`와 `skeleton()`을 넣고 지금처럼 `await loadGuide` → 실패 처리 → `main.contains(article)` 검사를 거친다. 그 뒤(본문 복제부터 정리 함수 반환까지)는 두 경로가 같은 코드를 쓴다.
- `renderHome`(`js/home.js`): 칸을 채우는 부분을 `showRuler(slot, doc)`(단계 자를 만들고, 없으면 `slot.hidden = true`, 있으면 넣고 `drawRuler`) 하나로 묶는다. `readyDoc`이 있으면 첫 마크업에 `.ruler-skeleton`을 넣지 않고 바로 `showRuler`, 없으면 지금처럼 스켈레톤 + `loadGuide(...).then(doc => showRuler(slot, doc)).catch(...)`.
- `fillMenu`(`js/header.js`): 본문을 채우는 두 줄을 지역 함수로 묶고, `readyDoc(guide)`가 있으면 스켈레톤 없이 바로 채운 뒤 끝낸다.

- [ ] **Step 5: 통과를 확인한다**

Run: `npx playwright test --project=e2e tests/e2e/skeleton.spec.mjs`
Expected: 4 passed

- [ ] **Step 6: 전체 테스트**

Run: `npm test`
Expected: 모두 PASS. 특히 `opening a guide does not shift the layout while the md loads`, `menu fill failure shows the error and retries on reopen`, `blocked md shows the error; retry renders the body with a new request`.

- [ ] **Step 7: 커밋**

```bash
git add tests/e2e/skeleton.spec.mjs js/md.js js/guide.js js/home.js js/header.js
git commit -m "M4: 이미 받은 문서면 스켈레톤 없이 바로 그림(가이드·홈 단계 자·메뉴), readyDoc"
```

---

### Task 3: 툴팁

**Files:**
- Create: `tests/e2e/tooltip.spec.mjs`
- Modify: `js/tooltip.js` (scroll 처리기)

**Interfaces:**
- Consumes: `openPage`(`tests/e2e/helpers.mjs`), `siteConfig.ui.downloadLabel`·`ui.darkMode`, `guides[].file`
- Produces: 없음

- [ ] **Step 1: 실패하는 테스트를 쓴다**

```js
// tests/e2e/tooltip.spec.mjs — 툴팁: 탭·키보드 포커스로 열림, Esc로 닫힘, 문서 밖 설명 없음(WCAG 1.4.13, brief).
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { openPage } from './helpers.mjs';
import { siteConfig } from '../../js/site-config.js';

const { ui, guides } = siteConfig;
const tip = (page) => page.locator('#tooltip');

test('keyboard focus opens an icon button tooltip; Escape closes it and keeps focus', async ({ page }) => {
  await openPage(page, '/#/final');
  await page.locator('[data-toc-open]').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('.guide-tools a[download]')).toBeFocused();
  await expect(tip(page)).toBeVisible();
  await expect(tip(page)).toHaveText(ui.downloadLabel);
  await page.keyboard.press('Escape');
  await expect(tip(page)).toBeHidden();
  await expect(page.locator('.guide-tools a[download]')).toBeFocused();
});

for (const g of guides) {
  test(`term tooltips only use md sentences (${g.id})`, async ({ page }) => {
    await openPage(page, `/#/${g.id}`);
    const md = readFileSync(g.file, 'utf8');
    const lines = await page.locator('.term').evaluateAll((bs) => bs.flatMap((b) => b.dataset.tip.split('\n')));
    expect(lines.filter((l) => !md.includes(l))).toEqual([]);
  });
}

test('pointer can move from a term onto its tooltip without it closing', async ({ page }) => {
  await openPage(page, '/#/final');
  const term = page.locator('.term').first();
  await term.scrollIntoViewIfNeeded();
  await term.hover();
  const box = await tip(page).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
  await page.waitForTimeout(300); // 닫힘 지연(150ms)보다 길게
  await expect(tip(page)).toBeVisible();
});

test('scrolling closes a tooltip opened by the pointer', async ({ page }) => {
  await openPage(page, '/#/final');
  const term = page.locator('.term').first();
  await term.scrollIntoViewIfNeeded();
  await term.hover();
  await expect(tip(page)).toBeVisible();
  await page.mouse.wheel(0, 300);
  await expect(tip(page)).toBeHidden();
});

test('tabbing to a term below the fold keeps its tooltip next to it', async ({ page }) => {
  await openPage(page, '/#/final');
  const term = page.locator('.term').filter({ visible: true }).nth(5);
  expect((await term.boundingBox()).y).toBeGreaterThan(800); // 화면 아래에서 시작
  await page.keyboard.press('Tab'); // 키보드 입력 뒤라 다음 focus()가 :focus-visible
  await term.focus(); // 브라우저가 스크롤한다(Tab으로 갈 때와 같은 경로)
  await page.waitForTimeout(300);
  await expect(term).toBeFocused();
  await expect(tip(page)).toBeVisible();
  const near = async () => {
    const [t, b] = [await term.boundingBox(), await tip(page).boundingBox()];
    return Math.min(Math.abs(b.y - (t.y + t.height + 8)), Math.abs(b.y + b.height - (t.y - 8)));
  };
  expect(await near()).toBeLessThan(2);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(200);
  await expect(tip(page)).toBeVisible();
  expect(await near()).toBeLessThan(2);
});

test.describe('touch 375px', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 812 } });

  test('tapping a term toggles its tooltip; tapping elsewhere closes it', async ({ page }) => {
    await openPage(page, '/#/final');
    const term = page.locator('.term').first();
    await term.scrollIntoViewIfNeeded();
    await term.tap();
    await expect(tip(page)).toBeVisible();
    await expect(term).toHaveAttribute('aria-describedby', 'tooltip');
    await term.tap();
    await expect(tip(page)).toBeHidden();
    await term.tap();
    await expect(tip(page)).toBeVisible();
    // 바깥 = 용어가 든 블록의 오른쪽 아래 구석(마지막 줄 끝의 빈 곳). 스크롤로 닫힌 게 아님을 함께 확인한다.
    const block = await term.locator('xpath=ancestor::*[parent::article]').boundingBox();
    const y0 = await page.evaluate(() => scrollY);
    await page.touchscreen.tap(block.x + block.width - 2, block.y + block.height - 2);
    expect(await page.evaluate(() => scrollY)).toBe(y0);
    await expect(tip(page)).toBeHidden();
    await expect(term).not.toHaveAttribute('aria-describedby');
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx playwright test --project=e2e tests/e2e/tooltip.spec.mjs`
Expected: `tabbing to a term below the fold…` FAIL(`#tooltip` hidden). 나머지 PASS.

- [ ] **Step 3: scroll 처리기를 고친다 (`js/tooltip.js` `initTooltips`)**

열린 툴팁이 있을 때: 주인이 `document.activeElement`이고 화면과 겹치면(`r.bottom > 0 && r.top < innerHeight`) `place(owner)`로 다시 놓고, 아니면 지금처럼 `hide()`. 파일 머리 주석에 '초점 툴팁은 스크롤해도 따라간다'를 더한다.

- [ ] **Step 4: 통과를 확인한다**

Run: `npx playwright test --project=e2e tests/e2e/tooltip.spec.mjs`
Expected: 8 passed

- [ ] **Step 5: 전체 테스트 후 커밋**

Run: `npm test` → Expected: 모두 PASS

```bash
git add tests/e2e/tooltip.spec.mjs js/tooltip.js
git commit -m "M4: 키보드 초점 툴팁은 스크롤해도 유지(WCAG 1.4.13), 툴팁 e2e"
```

---

### Task 4: [⬇ md] 다운로드·다크 모드

이미 맞게 동작한다(측정). 테스트로 고정만 하며 처음부터 통과해도 된다(스펙 §6). 실패하면 그 자리에서 원인을 찾아 고친다.

**Files:**
- Create: `tests/e2e/convenience.spec.mjs`

**Interfaces:**
- Consumes: `openPage`, `serveAsPages`(`tests/e2e/helpers.mjs`), `siteConfig.site.url`, `guides[].downloadName`·`file`
- Produces: 없음

- [ ] **Step 1: 테스트를 쓴다**

```js
// tests/e2e/convenience.spec.mjs — [⬇ md] 한글 원래 이름, 다크 모드(기기 설정 + 토글 기억). 스펙 §8 M4.
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { openPage, serveAsPages } from './helpers.mjs';
import { siteConfig } from '../../js/site-config.js';

const { guides, site } = siteConfig;
const download = async (page) => {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('.guide-tools a[download]').click()]);
  return dl;
};

for (const g of guides) {
  test(`md download keeps the Korean name and the exact bytes (${g.id})`, async ({ page }) => {
    await openPage(page, `/#/${g.id}`);
    const dl = await download(page);
    expect(dl.suggestedFilename()).toBe(g.downloadName);
    expect(readFileSync(await dl.path())).toEqual(readFileSync(g.file));
  });
}

test('md download keeps the Korean name under the deployed sub-path', async ({ page }) => {
  await serveAsPages(page);
  await page.goto(`${site.url}#/${guides[0].id}`);
  await page.locator('#doc[data-loaded]').waitFor();
  expect((await download(page)).suggestedFilename()).toBe(guides[0].downloadName);
});

const mode = (page) => page.evaluate(() => ({
  saved: document.documentElement.dataset.mode ?? null,
  scheme: getComputedStyle(document.documentElement).colorScheme,
  pressed: document.querySelector('.mode-toggle').getAttribute('aria-pressed'),
}));
const toggle = (page) => page.locator('.mode-toggle').click();

test.describe('device dark', () => {
  test.use({ colorScheme: 'dark' });
  test('follows the device setting when nothing is saved', async ({ page }) => {
    await openPage(page, '/#/');
    expect(await mode(page)).toEqual({ saved: null, scheme: 'dark', pressed: 'true' });
  });
});

test.describe('device light', () => {
  test.use({ colorScheme: 'light' });

  test('the toggle choice survives a reload and is set before the body paints', async ({ page }) => {
    await page.addInitScript(() => {
      new MutationObserver((_, o) => {
        if (!document.body) return;
        window.__modeAtBody = document.documentElement.dataset.mode ?? null;
        o.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });
    await openPage(page, '/#/');
    await toggle(page);
    expect(await mode(page)).toEqual({ saved: 'dark', scheme: 'dark', pressed: 'true' });
    await page.reload();
    expect(await page.evaluate(() => window.__modeAtBody)).toBe('dark');
    expect(await mode(page)).toEqual({ saved: 'dark', scheme: 'dark', pressed: 'true' });
  });

  test('a saved choice wins over later device changes', async ({ page }) => {
    await openPage(page, '/#/');
    await toggle(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.emulateMedia({ colorScheme: 'light' });
    expect(await mode(page)).toEqual({ saved: 'dark', scheme: 'dark', pressed: 'true' });
  });

  test('device changes are followed while nothing is saved', async ({ page }) => {
    await openPage(page, '/#/');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(async () => (await mode(page)).pressed).toBe('true');
    expect((await mode(page)).scheme).toBe('dark');
  });

  test('an unknown saved value is ignored', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mode', 'blue'));
    await openPage(page, '/#/');
    expect(await mode(page)).toEqual({ saved: null, scheme: 'light', pressed: 'false' });
  });

  test('blocked storage still switches this page without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }));
    await openPage(page, '/#/');
    await toggle(page);
    expect(await mode(page)).toEqual({ saved: 'dark', scheme: 'dark', pressed: 'true' });
    expect(errors).toEqual([]);
  });

  test('404 page uses the saved mode', async ({ page }) => {
    await openPage(page, '/#/');
    await toggle(page);
    await openPage(page, '/404.html');
    expect(await page.evaluate(() => [document.documentElement.dataset.mode, getComputedStyle(document.documentElement).colorScheme])).toEqual(['dark', 'dark']);
  });
});
```

- [ ] **Step 2: 실행한다**

Run: `npx playwright test --project=e2e tests/e2e/convenience.spec.mjs`
Expected: 11 passed. 실패하면 systematic-debugging으로 원인을 찾고, 고친 파일을 이 Task 커밋에 넣는다.

- [ ] **Step 3: 커밋**

```bash
git add tests/e2e/convenience.spec.mjs
git commit -m "M4: [⬇ md] 한글 이름·하위 경로, 다크 모드(기기 설정·기억·막힌 저장소·404) e2e"
```

---

### Task 5: 마무리 검사·문서

**Files:**
- Modify: `docs/specs/2026-11-08-guide-site-design.md` (§5 '스켈레톤' 행 상태)

**Interfaces:**
- Consumes: Task 1~4 결과
- Produces: 완료 보고(CLAUDE.md 규칙 6)

- [ ] **Step 1: 스펙 상태를 고친다**

§5 표 '스켈레톤' 행의 상태 `고칠 것(M4)`을 `구현됨`으로 바꾼다. 다른 문장은 그대로 둔다.

- [ ] **Step 2: 전체·시각 테스트**

Run: `npm test` → Expected: 실패 0
Run: `npm run test:visual` → Expected: 실패 0(CSS를 바꾸지 않았으므로 기준 이미지 그대로). 차이가 나면 차이 이미지를 직접 보고 원인을 고친다. 기준 이미지 갱신은 의도한 변화일 때만, 사용자에게 알린 뒤 한다.

- [ ] **Step 3: 수동 검사**

Run: `node ~/.claude/skills/hallmark/scripts/sloplint.mjs css/site.css index.html --genre modern-minimal --scope app` → 출력 첨부
Run: `impeccable detect --json css/site.css` 와 `impeccable detect --json index.html` → 출력 첨부

- [ ] **Step 4: 브라우저 검사 (chrome-devtools-mcp, `python -m http.server 8000 --bind 127.0.0.1`)**

- `/#/final`, `/#/` 콘솔 오류 0.
- Lighthouse(데스크톱·모바일) `/#/final`: 성능·접근성 90 이상. 점수 첨부.
- 동작 줄이기 끔 상태에서 목차로 마지막 단계 이동 → 글이 바로 보이는지 눈으로 확인.
- 스크린샷 `/#/final` 1440·768·375px × 라이트·다크 6장 첨부.

- [ ] **Step 5: 커밋, 푸시·PR은 확인 후**

```bash
git add docs/specs/2026-11-08-guide-site-design.md
git commit -m "M4: 스펙 §5 스켈레톤 상태 갱신"
```

푸시·PR·`main` 합치기는 사용자 확인 뒤에 한다. 보고에 적을 것: 근본 원인 3개, 테스트·검사 출력, 스크린샷, 확인 못 한 항목(실제 휴대폰 다운로드, iOS Safari), 손대지 않은 죽은 코드 `isLoaded`(`js/md.js`).
