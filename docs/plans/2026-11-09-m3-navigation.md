# M3 탐색 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메가메뉴·모바일 메뉴·목차 드로어·현재 위치 강조·smooth scroll·단계 0개 처리를 e2e로 고정하고, 측정으로 찾은 버그 5개를 고친다.

**Architecture:** 시제품 구조는 그대로 두고 두 파일만 고친다.
- `js/guide.js`: 현재 위치 강조의 기준선 계산(`trackScroll`), 목차 항목으로 닫을 때 초점(`buildToc`).
- `js/header.js`: 바깥 클릭 뒤 초점, 포커스가 메뉴 밖으로 나가면 닫기, 단계 0개일 때 메뉴 본문(`megaHtml`·`accHtml`).

CSS·siteConfig·`main.js`는 바꾸지 않는다. 새 e2e 파일 `tests/e2e/navigation.spec.mjs` 하나에 M3 테스트를 모은다.

**Tech Stack:** 바닐라 ES 모듈, `@playwright/test` 1.64.1(Chromium), Node 22 `node:test`, `tests/serve.py`(8123).

**Spec:** [docs/specs/2026-11-08-guide-site-design.md](../specs/2026-11-08-guide-site-design.md) §3(`header.js`), §5(단계 0개, 메뉴 채우기 실패), §6(e2e·시각), §8 M3. 기준: [brief](../brief.md) '화면 규칙'(메가메뉴·목차 드로어·Smooth scroll)·성공 기준 '탭 두 번', [GLOSSARY.md](../../GLOSSARY.md)(단계·세부 항목·메가메뉴·목차 드로어).

## 측정한 출발점 (2026-11-09, Chromium, `main` 05d437e)

- 이미 맞는 것: 메가메뉴 Esc → 닫히고 초점이 그 가이드 버튼. 모바일 메뉴 Esc → 초점이 햄버거. 목차 Esc·배경 클릭 → 초점이 [목차] 버튼. 메가메뉴 단계 클릭 → 가이드 전환 뒤 그 제목에 초점(1280px에서 제목 top 167px). 데스크톱 홈 → 단계는 클릭 2번(가이드 버튼 → 단계). final 메가메뉴에 단계 링크 10개.
- **버그 1 (현재 위치 강조가 전혀 안 됨)**: `/#/final` 중간까지 스크롤해도 `#toc [aria-current]` 0개. 단계로 이동한 직후 목차를 열어도 0개이고, 초점은 첫 항목 '0. 시작 전에'로 간다.
  - 원인: `trackScroll`이 `getPropertyValue('--anchor-offset')`를 `parseFloat`한다. 값이 `calc(64px + 20px)` 문자열이라 NaN → 비교가 늘 거짓.
  - 계산된 값은 `getComputedStyle(document.documentElement).scrollPaddingTop`에서 px로 나온다(측정: 1280px `84px`, 375px `137px`). `html { scroll-padding-top: var(--anchor-offset) }`이라 같은 값이다.
- **버그 2 (맨 위까지 못 오는 마지막 제목)**: 1280px에서 steps `부록-c-한-세션의-표준-시작-문구`, design `5-확인-근거`는 페이지 끝이라 기준선까지 못 올라온다. 버그 1을 고쳐도 그 제목으로 가면 강조가 앞 제목에 남는다.
- **버그 3 (메가메뉴 바깥 클릭 뒤 초점)**: 바깥(빈 곳) 클릭 → 닫히지만 초점이 `BODY`. 완료 기준 2는 연 버튼으로 돌아와야 한다.
- **버그 4 (포커스가 메뉴 밖으로 나가도 열림)**: 메가메뉴 마지막 링크에서 Tab → 다음 가이드 버튼으로 가는데 메뉴가 열린 채 남는다. 모바일 메뉴도 Tab으로 본문 [md]까지 가도 열려 있다.
  - 기준(검색 확인): [APG Disclosure Navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/) "Moving focus out of the navigation region also closes an open dropdown." 예제 코드는 `focusout`에서 `relatedTarget`이 메뉴 밖이면 닫는다.
- **버그 5 (모션 켜면 목차 항목 뒤 초점이 버튼)**: 동작 줄이기 없음에서 목차 항목 클릭 → 1.5초 뒤 초점이 제목이 아니라 [목차] 버튼. 동작 줄이기에서는 제목(정상).
  - 원인(추측, Task 3 RED로 확인): 닫힘 애니메이션 동안 모달이 열려 있어 뒤 문서가 inert → 라우터의 제목 초점이 실패하고, 400ms 뒤 `dialog.close()`가 초점을 연 버튼으로 되돌린다([W3C H102](https://www.w3.org/WAI/WCAG22/Techniques/html/H102): 닫으면 초점이 연 요소로 돌아감).
- **버그 6 (단계 0개)**: steps md를 `# 빈 가이드\n\n### 소제목\n\n본문\n`으로 바꾸면 메가메뉴에 빈 `<ol class="mega__chapters"></ol>`, 아코디언에 빈 `<ol class="acc__list"></ol>`이 남는다. 스펙 §5: '처음부터 읽기'만 둔다.

## 결정 (사용자 확인 필요)

- **완료 기준 1 '탭 두 번'은 데스크톱(768px 이상)으로 잰다.** 768px 미만은 brief의 '햄버거 → 가이드별 아코디언' 구조상 햄버거 → 가이드 → 단계 3번이다. 2번으로 줄이려면 아코디언을 처음부터 펼쳐야 하는데 brief에 없는 동작이라 이 플랜은 하지 않는다.

## Global Constraints

- md 원문 문장은 바꾸지 않는다. 테스트용 md 조각은 `page.route`로만 넣는다.
- 색·글꼴·간격은 `css/tokens.css` 토큰만. 이번 마일스톤은 CSS를 바꾸지 않는다. 바꿔야 하면 DESIGN.md부터 고친다.
- 사이트 이름·가이드 목록·UI 문구는 `js/site-config.js`에서만. 테스트도 문구를 하드코딩하지 않고 `siteConfig.ui`·`guides`를 쓴다. 한글 제목 id도 가능하면 화면(`[data-toc-id]`, `.mega__stage`)에서 읽는다.
- 공용 컴포넌트 재사용: 초점 `focusEl`·스크롤 `scrollToTarget`(`js/scroll.js`), 아이콘 `icon()`. 같은 역할을 새로 만들지 않는다.
- 배포본은 빌드·npm 의존성 없음. 새 devDependency 없음.
- 모션은 `transform`·`opacity`만, `prefers-reduced-motion`이면 즉시. smooth scroll은 메가메뉴·목차 이동에만(brief).
- UI 문구는 합니다체. 새 문구를 만들지 않는다(`ui.guideTop`·`loadError`·`toc`·`openMenu`·`closeMenu`를 쓴다).
- 브랜치는 `m3-navigation`(`main` 기준). 원격 푸시, PR, `main` 합치기는 사용자 확인을 받는다.
- **사소한 문제도 미루지 않는다**(사용자 결정, 2026-11-09). 리뷰 Minor도 이 마일스톤 안에서 RED→GREEN으로 고친다. executing-plans의 'Minor는 ledger로 미룸'보다 우선한다.

## Review Focus

1. **페이지 끝이라 맨 위까지 못 오는 제목으로 이동**: 목차 강조가 그 제목이어야 한다. → Task 1 `page bottom highlights the last heading`
2. **좁은 화면의 큰 오프셋**(375px, 137px): 기준선이 그 값을 따라야 강조가 한 칸 밀리지 않는다. → Task 1 `scrolling to a heading highlights it` 375px 경우
3. **메뉴가 열린 채 다른 조작 요소를 누름**(예: [목차]): 메뉴는 닫히되 초점을 연 버튼으로 뺏어 오면 안 된다. → Task 2 `outside click on another control keeps its focus`
4. **모션을 켠 채 목차 항목 선택**: 키보드 사용자는 고른 제목에서 이어 읽어야 한다. → Task 3 `toc link focuses the chosen heading (motion allowed)`
5. **메뉴 채우기 실패 뒤 다시 열기**: 오류 문구 + 가이드 링크가 보이고, 다시 열면 다시 불러온다(스펙 §5). → Task 4 `menu fill failure shows the error and retries on reopen`

---

### Task 1: 현재 위치 강조

**Files:**
- Create: `tests/e2e/navigation.spec.mjs`
- Modify: `js/guide.js`(`trackScroll`), `tests/e2e/helpers.mjs`(도우미 2개)

**Interfaces:**
- Consumes: `openPage(page, path)`(`tests/e2e/helpers.mjs`)
- Produces (helpers.mjs):
  - `twoFrames(page) → Promise<void>` — `requestAnimationFrame` 두 번 기다림
  - `tocIds(page) → Promise<string[]>` — `#toc a[data-toc-id]`의 id를 문서 순서로
  - 목차 강조 표시는 지금처럼 `#toc a[aria-current="location"]` 하나다(Task 3·6이 이걸 본다)

- [ ] **Step 0: 브랜치**

```bash
git switch main
git switch -c m3-navigation
```

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/e2e/navigation.spec.mjs`, 파일 머리 주석 `// 탐색(M3): 현재 위치 강조, 메가메뉴·모바일 메뉴, 목차 드로어, smooth scroll, 단계 0개.`

```js
const current = (page) => page.locator('#toc a[aria-current="location"]');

for (const width of [1280, 375]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });
    test('scrolling to a heading highlights it', async ({ page }) => {
      await openPage(page, '/#/final');
      const ids = await tocIds(page);
      const id = ids[Math.floor(ids.length / 2)];
      await page.evaluate((i) => document.getElementById(i).scrollIntoView({ block: 'start', behavior: 'instant' }), id);
      await twoFrames(page);
      await expect(current(page)).toHaveCount(1);
      await expect(current(page)).toHaveAttribute('data-toc-id', id);
    });
  });
}

test('opening the toc after a stage jump shows and focuses that stage', async ({ page }) => {
  // /#/final/<가운데 단계 id>로 연 뒤 [목차] → current 1개, data-toc-id === 그 id, toBeFocused()
});

for (const g of siteConfig.guides) {
  test(`page bottom highlights the last heading (${g.id})`, async ({ page }) => {
    // 1280×800, /#/<g.id> → scrollTo(0, scrollHeight) → twoFrames → current의 data-toc-id === tocIds 마지막
  });
}
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `npx playwright test --project=e2e tests/e2e/navigation.spec.mjs`
Expected: FAIL — `current` 개수 0(버그 1). steps·design의 맨 끝 테스트는 버그 1만 고쳐도 FAIL로 남아야 한다(버그 2).

- [ ] **Step 3: `trackScroll(main, article, doc)` 수정** in `js/guide.js`

- 기준선 오프셋은 `parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0`. `measure()`에서 다시 읽는다(폭이 바뀌면 오프셋도 바뀐다: 84px ↔ 137px).
- `line = scrollY + offset + 8`은 그대로 둔다.
- 페이지 끝(`max > 0 && scrollY >= max - 1`)이면 `idx = heads.length - 1`.
- `--anchor-offset` 문자열을 읽던 줄은 지운다.

- [ ] **Step 4: 통과 확인**

Run: `npx playwright test --project=e2e tests/e2e/navigation.spec.mjs` → Expected: PASS
Run: `npm test` → Expected: 0 failed(특히 `pages.spec` 'toc link scrolls smoothly').

- [ ] **Step 5: 커밋**

```bash
git add tests/e2e/navigation.spec.mjs tests/e2e/helpers.mjs js/guide.js
git commit -m "M3: 현재 위치 강조 기준선을 계산된 scroll-padding으로, 페이지 끝이면 마지막 제목 강조"
```

---

### Task 2: 메가메뉴·모바일 메뉴 — 닫기와 초점, 탭 두 번, smooth scroll

**Files:**
- Modify: `js/header.js`(바깥 클릭·focusout 처리), `tests/e2e/navigation.spec.mjs`

**Interfaces:**
- Consumes: `twoFrames`, `tocIds`(Task 1)
- Produces: `header.js` 안의 비공개 도우미 `openMenuButton() → HTMLButtonElement | null`(열린 메가메뉴의 가이드 버튼, 아니면 모바일 메뉴가 열렸을 때 `.nav-toggle`). Esc 처리도 이걸 쓴다. export는 바뀌지 않는다.

- [ ] **Step 1: 실패하는 테스트 작성** — 1280×800(e2e 기본)

- `home to any stage in two clicks (<g.id>)` — 가이드 3개마다: `/#/`에서 `.guide-nav__btn[data-guide=g.id]` 클릭 → 단계 링크 클릭(`.mega__stage` 마지막, 없으면 `.mega__link` 마지막). 클릭 수는 2. 이어서 `location.hash` === 그 링크의 `href`, 대상 제목 `toBeFocused()`, `toBeInViewport()`. 열린 가이드 버튼은 `aria-current="page"`, 나머지 둘은 없다.
- `mega closes on Escape from inside and focus returns to its button` — 버튼에 초점 → Enter로 열기 → Tab으로 첫 링크 → Escape → `#mega-final` hidden, 버튼 `toBeFocused()`, `aria-expanded="false"`.
- `mega closes on outside click and focus returns to its button` — 열고 `#home-title` 클릭(초점 받지 않는 요소) → hidden, 버튼 `toBeFocused()`.
- `outside click on another control keeps its focus` — `/#/final`에서 메가메뉴를 열고 `[data-toc-open]` 클릭 → 메가메뉴 hidden, `#toc` 열림, 초점이 `#toc` 안(`page.locator('#toc :focus')` 1개).
- `tabbing out of the mega menu closes it without moving focus` — 열고 `#mega-final a` 마지막에 초점 → Tab → hidden, 초점 = `.guide-nav__btn[data-guide="steps"]`.
- `describe('375px mobile menu')`, `test.use({ viewport: { width: 375, height: 812 } })`, `/#/final`:
  - `Escape returns focus to the menu button` — `.nav-toggle` 클릭 → Escape → `#mobile-nav` hidden, `.nav-toggle` 초점, `aria-label` === `ui.openMenu`.
  - `outside click returns focus to the menu button` — 열고 `page.mouse.click(187, 800)`. 먼저 그 점의 `elementFromPoint`가 헤더 밖이고 `closest('a,button,[tabindex]')`가 null임을 `expect`로 확인(전제 고정) → hidden, `.nav-toggle` 초점.
  - `tabbing out of the mobile menu closes it` — 열고 `.acc__btn` 마지막에 초점 → Tab → hidden, 초점은 헤더 밖.
- `describe('motion allowed')`, `reducedMotion: 'no-preference'`: `mega stage link scrolls smoothly into another guide` — `/#/`에서 스크롤 기록 시작(`pages.spec`의 `record`와 같은 방식, 이 파일에 둔다) → final 메가메뉴 단계 클릭 → `__ys` 길이 > 2(timeout 3000). 시제품이 이미 맞으면 처음부터 통과해도 된다.

- [ ] **Step 2: 실행해 실패 확인**

Run: `npx playwright test --project=e2e tests/e2e/navigation.spec.mjs -g "mega|mobile|two clicks"`
Expected: FAIL — 바깥 클릭 2개(초점 BODY, 버그 3), Tab으로 나가기 2개(열린 채, 버그 4). 나머지는 PASS여도 된다.

- [ ] **Step 3: `js/header.js` 수정**

- `openMenuButton()`를 만들고 Esc 핸들러가 이를 쓰게 한다(동작은 그대로).
- 문서 클릭(헤더 밖): `const opener = openMenuButton(); closeMenus();` 뒤 `document.activeElement`가 `body`·`null`이거나 방금 닫힌 메뉴 안이면 `opener.focus()`. 다른 조작 요소가 초점을 가졌으면 두다.
- `header`에 `focusout`: `e.relatedTarget`이 null이면 무시(빈 곳 클릭은 위 클릭 처리가 맡는다). 열린 메뉴의 범위 밖이면 `closeMenus()`만 부르고 초점은 옮기지 않는다. 범위 = 메가메뉴는 그 버튼의 `.guide-nav__item`, 모바일은 `.nav-toggle`과 `#mobile-nav`.

- [ ] **Step 4: 통과 확인**

Run: `npx playwright test --project=e2e tests/e2e/navigation.spec.mjs` → Expected: PASS
Run: `npm test` → Expected: 0 failed(`pages.spec` '404 header mega menu loads stages' 포함).

- [ ] **Step 5: 커밋**

```bash
git add js/header.js tests/e2e/navigation.spec.mjs
git commit -m "M3: 메뉴 바깥 클릭 뒤 연 버튼으로 초점, 포커스가 메뉴 밖으로 나가면 닫기, 탭 두 번·smooth scroll e2e"
```

---

### Task 3: 목차 드로어 — 닫기와 초점

**Files:**
- Modify: `js/guide.js`(`buildToc`), `tests/e2e/navigation.spec.mjs`

**Interfaces:**
- Consumes: `tocIds`, `twoFrames`(Task 1), 강조 표시 `aria-current="location"`(Task 1)
- Produces: 없음

- [ ] **Step 1: 실패하는 테스트 작성** — 같은 테스트를 `reducedMotion` `'reduce'`와 `'no-preference'` 두 describe로 돌린다(`for (const motion of [...])`).

- `toc opens from the keyboard on the current item` — `/#/final/<가운데 id>` → `[data-toc-open]` 초점 → Enter → `#toc` 열림, 버튼 `aria-expanded="true"`, 초점 = `current` 링크.
- `toc closes on Escape and focus returns to the toc button` — 이어서 Escape → `expect.poll(() => #toc.open)` false, 버튼 `toBeFocused()`, `aria-expanded="false"`.
- `toc closes on backdrop click and focus returns to the toc button` — 열고 `page.mouse.click(viewport.width - 20, 400)`(드로어 폭은 `min(24rem, 88vw)`라 오른쪽 끝은 늘 배경) → 닫힘, 버튼 초점.
- `toc link focuses the chosen heading` — 열고 `tocIds` 가운데 항목 클릭 → `page.waitForFunction`으로 `#toc`가 닫히고 `is-closing`도 없어질 때까지 기다림 → `twoFrames` → 그 제목 `toBeFocused()`, `decodeURIComponent(location.hash)`가 `/${id}`로 끝난다.

- [ ] **Step 2: 실행해 실패 확인**

Run: `npx playwright test --project=e2e tests/e2e/navigation.spec.mjs -g "toc"`
Expected: FAIL — `no-preference`의 `toc link focuses the chosen heading`만(초점이 [목차] 버튼, 버그 5). 원인 추측이 틀리면 `superpowers:systematic-debugging`으로 먼저 원인을 확인한다.

- [ ] **Step 3: `buildToc(main, guide, doc)` 수정** in `js/guide.js`

- 목차 링크 클릭으로 닫을 때 그 링크의 `data-toc-id`를 기억한다.
- `close` 이벤트(초점 복귀 뒤에 온다)에서 기억한 id가 있으면 `focusEl(main.querySelector('#doc').querySelector('#' + CSS.escape(id)))` 후 비운다. Esc·배경·[←]로 닫을 때는 기억하지 않으므로 지금처럼 버튼으로 돌아간다.

- [ ] **Step 4: 통과 확인**

Run: `npx playwright test --project=e2e tests/e2e/navigation.spec.mjs` → Expected: PASS
Run: `npm test` → Expected: 0 failed.

- [ ] **Step 5: 커밋**

```bash
git add js/guide.js tests/e2e/navigation.spec.mjs
git commit -m "M3: 목차 항목으로 닫으면 닫힘 애니메이션 뒤에도 고른 제목에 초점, 목차 키보드 e2e"
```

---

### Task 4: 메뉴 본문 상태 — 단계 규칙, 단계 0개, 채우기 실패

**Files:**
- Modify: `js/header.js`(`megaHtml`, `accHtml`), `tests/dom/headings.spec.mjs`, `tests/e2e/navigation.spec.mjs`

**Interfaces:**
- Consumes: `render(page, md, guideId)`(`tests/dom/helpers.mjs`, 반환 `{ headings, stages, title }`), `buildDoc`의 `stages: (Heading & { children: Heading[] })[]`
- Produces: 없음

- [ ] **Step 1: DOM 테스트(단계 규칙, 스펙 §6)** — `tests/dom/headings.spec.mjs`에 `stageRule picks level-2 stages and expands only listed chapters`. 시제품이 이미 맞으면 처음부터 통과해도 된다.

```js
const md = '# T\n\n## 1. 개요\n\n### 가\n\n## 3. 단계별 진행과 프롬프트\n\n### 0단계\n\n### 1단계\n\n#### 세부\n';
const { stages } = await render(page, md, 'final');
expect(stages.map((s) => s.id)).toEqual(['1-개요', '3-단계별-진행과-프롬프트']);
expect(stages[0].children).toEqual([]);
expect(stages[1].children.map((c) => c.id)).toEqual(['0단계', '1단계']);
expect((await render(page, md, 'steps')).stages.every((s) => s.children.length === 0)).toBe(true);
expect((await render(page, '# T\n\n### 가\n', 'steps')).stages).toEqual([]);
```

- [ ] **Step 2: e2e 실패하는 테스트 작성** — `navigation.spec.mjs`. steps md를 `page.route('**/content/website-steps.md', …)`로 `'# 빈 가이드\n\n### 소제목\n\n본문\n'`(`text/markdown; charset=utf-8`)로 바꾼다.

- `zero stages: mega shows only the guide-top link` — `/#/`에서 steps 메가메뉴 → `#mega-steps a` 1개, 텍스트 `ui.guideTop`, `href` `#/steps`, `#mega-steps ol` 0개.
- `zero stages: accordion shows only the guide-top link` — 375×812에서 햄버거 → steps 아코디언 → `#acc-steps a` 1개(`ui.guideTop`), `ol` 0개.
- `menu fill failure shows the error and retries on reopen` — 첫 요청만 `route.abort()`, 이후 `route.continue()`(호출 수를 센다). `/#/`에서 steps 메가메뉴 → `.menu-error` 보임, 그 안에 `ui.loadError`와 `#/steps` 링크. 닫고 다시 열기 → `.mega__link` 1개 이상, 요청 수 2. 첫 화면 뒤 미리 받기(`requestIdleCallback`)가 요청을 먼저 쓰지 않게 `addInitScript`로 `window.requestIdleCallback = () => 0`.

- [ ] **Step 3: 실행해 실패 확인**

Run: `npx playwright test --project=e2e tests/e2e/navigation.spec.mjs -g "zero stages|fill failure"`
Expected: FAIL — `zero stages` 2개(빈 `ol`, 버그 6). 채우기 실패 테스트는 PASS여도 된다.

- [ ] **Step 4: `megaHtml`·`accHtml` 수정** in `js/header.js`

- `doc.stages.length === 0`이면 메가메뉴는 `.mega__col--head` 열만, 아코디언은 `.acc__top` 링크만 돌려준다. 나머지 모양은 그대로.

- [ ] **Step 5: 통과 확인**

Run: `npm test` → Expected: 0 failed.

- [ ] **Step 6: 커밋**

```bash
git add js/header.js tests/dom/headings.spec.mjs tests/e2e/navigation.spec.mjs
git commit -m "M3: 단계 0개면 메뉴에 '처음부터 읽기'만, 단계 규칙 DOM 테스트, 메뉴 채우기 실패 e2e"
```

---

### Task 5: 시각 기준 — 메뉴 열림, 목차 드로어 열림

**Files:**
- Modify: `tests/visual/pages.spec.mjs`
- Create: 기준 이미지 16장(`tests/visual/__screenshots__/win32/visual-*/menu-open.png`, `toc-open.png`)

**Interfaces:**
- Consumes: `openPage`(helpers), 목차 강조(Task 1)
- Produces: 없음

- [ ] **Step 1: 테스트 추가**(스펙 §6 화면 목록)

- `menu open` — `/#/`. 폭 768 이상(`page.viewportSize().width >= 768`)이면 final 가이드 버튼 클릭 → `.mega__stage` 첫 개 대기. 768 미만이면 `.nav-toggle` → final 아코디언 → `.acc__link--sub` 첫 개 대기. `toHaveScreenshot('menu-open.png')`.
- `toc drawer open` — `/#/final/<첫 단계 id>`(`#mega-final`이 아니라 화면 `[data-toc-id]`에서 `0단계`로 시작하는 첫 id를 읽는다) → `[data-toc-open]` 클릭 → `#toc a[aria-current="location"]` 대기 → `toHaveScreenshot('toc-open.png')`. 강조된 항목이 찍혀야 한다.

- [ ] **Step 2: 새 기준 이미지만 만들기**

Run: `npm run test:visual -- --update-snapshots=missing`
Expected: 새 16장만 생기고 기존 48장은 그대로(`git status`에 기존 png 변경 없음).

- [ ] **Step 3: 직접 확인** — 새 16장을 열어 본다. 메가메뉴·아코디언이 잘리지 않고, 목차 강조가 보이고, 다크에서 대비가 맞는지. 이상하면 원인을 고친 뒤 그 장만 지우고 다시 만든다.

- [ ] **Step 4: 전체 확인**

Run: `npm run test:visual` → Expected: 64 passed.

- [ ] **Step 5: 커밋**

```bash
git add tests/visual
git commit -m "M3: 메뉴 열림·목차 드로어 열림 시각 기준(4폭 × 라이트·다크)"
```

---

### Task 6: 마일스톤 마무리

**Files:** 없음(검사·스크린샷만). 기존 기준 이미지가 바뀌면 원인을 찾는다. 갱신하지 않는다.

- [ ] **Step 1: 전체 확인**

- `npm test` → Expected: 0 failed.
- `npm run test:visual` → Expected: 64 passed.
- `node ~/.claude/skills/hallmark/scripts/sloplint.mjs css/site.css index.html --genre modern-minimal --scope app` → Expected: FAIL 0.
- `impeccable detect --json index.html 404.html` → Expected: M2보다 늘지 않는다.

- [ ] **Step 2: 브라우저 확인과 스크린샷**(CLAUDE.md 규칙 6)

- chrome-devtools-mcp로 `#/final` 콘솔 오류 0개, Lighthouse 접근성 90 이상.
- 1440·768·375px × 라이트·다크: 메가메뉴(768 미만은 아코디언) 열림, 목차 드로어 열림(강조 보임), 단계로 이동한 화면.
- 키보드만으로 홈 → 단계, 목차 열기·닫기를 한 번 직접 해 본다.

- [ ] **Step 3: 푸시·PR (사용자 확인 후)**

- 승인하면 `git push -u origin m3-navigation` 후 PR. 합치기는 다시 승인받는다.
- 배포 뒤 배포 주소에서 완료 기준 1~3을 확인한다.
