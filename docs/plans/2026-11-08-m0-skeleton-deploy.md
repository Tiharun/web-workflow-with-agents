# M0 골격 + 즉시 배포 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4단계 시제품을 기준선으로 커밋하고, 테스트 기반(node:test + Playwright)과 공통 푸터를 더해, 사이트맵의 모든 페이지가 GitHub Pages 배포 주소에서 같은 품질의 헤더·푸터와 함께 열리게 한다.

**Architecture:** 빌드 없는 바닐라 ES 모듈 사이트(ADR 0001~0003)를 그대로 쓴다. 공통 레이아웃은 `header.js`(기존)와 `footer.js`(새 파일)가 siteConfig만 읽어서 그린다. `404.html`도 같은 두 모듈을 불러온다. 테스트 도구는 `devDependencies`에만 두고, 배포본은 파일 그대로 올린다.

**Tech Stack:** HTML·CSS·ES 모듈, marked 18.1.1·GSAP 3.15.0(`vendor/`), Node 22 내장 `node:test`, `@playwright/test` 1.64.1(Chromium), Python `http.server`, GitHub Pages(branch `main` / root).

**Spec:** [docs/specs/2026-11-08-guide-site-design.md](../specs/2026-11-08-guide-site-design.md) (M0 = §8 M0). 기준 문서: [brief](../brief.md), [DESIGN.md](../../DESIGN.md), [ADR](../adr/).

## Global Constraints

- 색·글꼴·간격·모서리·그림자는 `css/tokens.css` 토큰만 쓴다. 토큰 블록 밖에 색 값이나 `font-family`를 쓰지 않는다. 새 컴포넌트는 DESIGN.md에 먼저 적는다.
- 사이트 이름·URL·저장소 주소·가이드·UI 문구는 `js/site-config.js`에서만 가져온다. 예외는 JS 없이 보여야 하는 정적 문자열(`index.html` `<title>`·noscript, `404.html` 정적 부분)뿐이다.
- md 원문 문장은 바꾸지 않는다.
- 모션은 `transform`·`opacity`만 쓴다. `prefers-reduced-motion`이면 즉시 표시한다.
- 배포본은 빌드·npm 의존성이 없다. 테스트 도구만 `devDependencies`에 두고 `node_modules/`는 커밋하지 않는다.
- 라이브러리·도구 버전은 출시 2주 이상 지난 안정판으로 고정한다. `@playwright/test`는 `1.64.1`(2026-10-14)을 쓰고, 1.65.0(2026-11-05)은 쓰지 않는다.
- UI 문구는 합니다체로 쓴다. 푸터에는 라이선스·출처 표기를 넣지 않는다(brief '안 만들 것').
- 테스트는 이 Windows PC에서만 돌린다. 시각 기준 이미지는 win32 한 벌이다.
- 마일스톤 브랜치 `m0-skeleton` → PR → `main`에 합치면 자동 배포된다. 원격 푸시·PR 합치기·Pages 켜기는 되돌리기 어려운 작업이라 사용자 확인을 받는다.

## Review Focus

1. **Pages 하위 경로**: 배포본은 `/web-workflow-with-agents/` 아래에 있다. 로컬 테스트는 `/`에서만 돌기 때문에 md·글꼴·CSS의 상대 경로가 깨져도 테스트가 잡지 못한다. → Task 5 Step 7에서 배포본의 네트워크 404가 0개인지 확인한다.
2. **깊은 없는 경로의 404**: `/web-workflow-with-agents/a/b/c`에서 `404.html`이 base를 보정해 CSS·헤더·푸터를 제대로 불러와야 한다. → Task 5 Step 7.
3. **375px 푸터 줄바꿈**: 링크 3개와 저장소 링크가 좁은 폭에서 가로로 넘치면 안 된다. → Task 2 e2e `footer does not overflow at 375px`.
4. **지금 보는 가이드를 가리키는 푸터 링크**: `#/final`을 읽다가 맨 아래 푸터의 '최종 워크플로우'를 누르면 같은 주소라 `hashchange`가 일어나지 않는다. 그래도 맨 위로 가야 한다(smooth 아님). → Task 2 e2e `footer link to current guide returns to top`.
5. **404 페이지의 헤더 메뉴**: `404.html`에서 메가메뉴를 열면 md를 base 기준으로 불러와야 하고, 단계 링크는 `index.html`의 해시 주소로 가야 한다. → Task 3 e2e `404 header mega menu loads stages`.

---

## File Structure

| 파일 | 상태 | 책임 |
|---|---|---|
| `.gitignore` | 수정 | 테스트 산출물·캐시 제외 |
| `package.json` | 새 파일 | `type: module`, devDependency, 스크립트 |
| `playwright.config.mjs` | 새 파일 | webServer, 프로젝트(`e2e`, 시각 8종), 스냅숏 경로 |
| `tests/unit/site-config.test.mjs` | 새 파일 | siteConfig 정합성 |
| `tests/unit/footer.test.mjs` | 새 파일 | `footerHtml` 출력 |
| `tests/e2e/helpers.mjs` | 새 파일 | 사이트맵 목록·페이지 준비 함수(e2e·시각 공용) |
| `tests/e2e/pages.spec.mjs` | 새 파일 | 사이트맵 전 페이지 열림, 헤더·푸터 공통, 콘솔 오류 0 |
| `tests/visual/pages.spec.mjs` | 새 파일 | 화면 4개 + 푸터, 4폭 × 2모드 |
| `js/footer.js` | 새 파일 | `footerHtml(config)`, `initFooter(mount)` |
| `js/not-found-page.js` | 새 파일 | `404.html` 진입점: 헤더·푸터·툴팁 |
| `js/main.js` | 수정 | `initFooter` 호출, 같은 해시 링크 재진입 |
| `js/site-config.js` | 수정 | `ui.repo`, `site.url` |
| `index.html`, `404.html` | 수정 | 푸터 자리, 404 모듈 연결 |
| `css/site.css` | 수정 | `.site-footer` 규칙 |
| `DESIGN.md`, `docs/brief.md`, 스펙, `CLAUDE.md` | 수정 | 푸터 결정·명령·문서 지도 반영 |

---

### Task 1: 기준선 커밋 + 테스트 기반

**Files:**
- Modify: `.gitignore`
- Create: `package.json`, `playwright.config.mjs`, `tests/unit/site-config.test.mjs`, `tests/e2e/helpers.mjs`, `tests/e2e/pages.spec.mjs`
- Commit: 지금 커밋되지 않은 시제품 전부(`index.html`, `404.html`, `css/`, `js/`, `vendor/`, `CLAUDE.md`, `DESIGN.md`, `.impeccable/`, `.hallmark/log.json`, `design-system/`)

**Interfaces:**
- Produces:
  - `tests/e2e/helpers.mjs`
    - `export const pages: Array<{ name: string, path: string, h1: string }>`: 사이트맵 6개. `home` `/#/`, `final`·`steps`·`design` `/#/<id>`, `notfound` `/#/no-such-page`, `404` `/404.html`
    - `export async function openPage(page, path): Promise<void>`: 이동 → `document.fonts.ready` → 가이드면 `.doc:not([aria-busy])`가 보일 때까지 기다림
  - npm 스크립트 `test`, `test:unit`, `test:e2e`, `test:visual`
  - Playwright 프로젝트 이름 `e2e`(1280×800, light)

- [ ] **Step 1: 브랜치를 만든다**

Run: `git switch -c m0-skeleton`
Expected: `Switched to a new branch 'm0-skeleton'` (현재 `chore/init-project` HEAD에서 시작)

- [ ] **Step 2: `.gitignore`에 아래 줄을 더한다**

```
# 테스트 산출물
test-results/
playwright-report/
# 디자인 도구 캐시·스크린샷(다시 만들 수 있음)
.hallmark/shots/
.impeccable/hook.cache.json
```

- [ ] **Step 3: `package.json`을 만든다**

```json
{
  "name": "web-workflow-with-agents",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "node --test \"tests/unit/**/*.test.mjs\"",
    "test:e2e": "playwright test --project=e2e",
    "test:visual": "playwright test --project=\"visual-*\""
  },
  "devDependencies": { "@playwright/test": "1.64.1" }
}
```

`test:visual`의 프로젝트 선택이 Playwright 1.64.1에서 glob을 지원하지 않으면, 프로젝트 이름 8개를 `--project` 반복으로 적는다. 동작은 Task 4 Step 2에서 확인한다.

Run: `npm install` → `npx playwright install chromium`
Expected: `node_modules/@playwright/test` 생기고, Chromium 다운로드 완료

- [ ] **Step 4: 실패하는 단위 테스트를 쓴다 — `tests/unit/site-config.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { siteConfig } from '../../js/site-config.js';

test('site identity', () => {
  assert.equal(siteConfig.site.name, '웹사이트 제작 워크플로우');
  assert.equal(siteConfig.site.repoUrl, 'https://github.com/Tiharun/web-workflow-with-agents');
});
test('guide ids are unique lowercase words', () => {
  const ids = siteConfig.guides.map((g) => g.id);
  assert.deepEqual(ids, ['final', 'steps', 'design']);
  assert.equal(new Set(ids).size, ids.length);
});
test('every guide file exists and download name ends with .md', () => {
  for (const g of siteConfig.guides) {
    assert.ok(existsSync(g.file), g.file);
    assert.match(g.downloadName, /\.md$/);
  }
});
test('every visual points at a known guide', () => {
  const ids = new Set(siteConfig.guides.map((g) => g.id));
  for (const v of siteConfig.visuals) assert.ok(ids.has(v.guideId), v.guideId);
});
```

Run: `npm run test:unit`
Expected: PASS 4. 시제품 설정이 이미 맞으므로 처음부터 통과해도 된다(스펙 §6 마지막 줄). 실패하면 설정을 고치지 말고 원인을 보고한다.

- [ ] **Step 5: `playwright.config.mjs`를 쓴다**

- `testDir: './tests'`
- `webServer: { command: 'python -m http.server 8000 --bind 127.0.0.1', url: 'http://127.0.0.1:8000', reuseExistingServer: true }`
- `use: { baseURL: 'http://127.0.0.1:8000', reducedMotion: 'reduce' }`
- `snapshotPathTemplate: '{testFileDir}/__screenshots__/{platform}/{projectName}/{arg}{ext}'`
- `expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002 } }`
- `projects`:
  - `{ name: 'e2e', testMatch: '**/e2e/**/*.spec.mjs', use: { viewport: { width: 1280, height: 800 }, colorScheme: 'light' } }`
  - 시각 프로젝트 8개는 `[375, 768, 1280, 1440] × ['light', 'dark']`를 돌며 만든다. 이름 `visual-${w}-${scheme}`, `testMatch: '**/visual/**/*.spec.mjs'`, `use: { viewport: { width: w, height: 900 }, colorScheme: scheme }`

`reducedMotion: 'reduce'`를 전체에 거는 이유: Playwright는 CSS·Web Animations만 끄고 GSAP(JS)는 끄지 못한다(playwright.dev/docs/test-snapshots).

- [ ] **Step 6: e2e 테스트를 쓴다 — `tests/e2e/helpers.mjs`, `tests/e2e/pages.spec.mjs`**

`helpers.mjs`의 `pages[].h1`:
- home → `siteConfig.site.name`
- 가이드 3개 → 각 `guide.file`의 첫 `# ` 줄에서 `# `를 뗀 값. 테스트에서 `readFileSync`로 읽는다
- notfound → `siteConfig.ui.notFoundTitle`
- 404 → `'찾을 수 없는 페이지입니다'`. 정적 HTML이라 문자열을 그대로 쓴다. 일치 검사는 M1에서 한다

`pages.spec.mjs`, 이 Task에서 쓰는 테스트:

```js
for (const p of pages) {
  test(`${p.name} opens with its title`, async ({ page }) => {
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await openPage(page, p.path);
    await expect(page.locator('h1').first()).toHaveText(p.h1);
    expect(errors).toEqual([]);
  });
}
```

Run: `npm run test:e2e`
Expected: PASS 6

- [ ] **Step 7: 커밋한다**

```bash
git add .gitignore package.json package-lock.json playwright.config.mjs tests index.html 404.html css js vendor CLAUDE.md DESIGN.md .impeccable .hallmark/log.json design-system
git commit -m "M0: 4단계 시제품 기준선과 테스트 기반(node:test, Playwright)"
```

Run: `git status --short`
Expected: 남은 변경 없음. `docs/웹 비주얼 디자인 v3 작업 규칙.md`는 원래 무시되는 파일이라 나오지 않는다.

---

### Task 2: 공통 푸터

**Files:**
- Create: `js/footer.js`, `tests/unit/footer.test.mjs`
- Modify: `js/site-config.js`(`ui.repo`), `js/main.js`, `index.html`, `css/site.css`, `DESIGN.md`, `docs/brief.md`, `docs/specs/2026-11-08-guide-site-design.md`
- Test: `tests/e2e/pages.spec.mjs`

**Interfaces:**
- Consumes: `siteConfig.{site, guides, ui}`, Task 1 `pages`·`openPage`
- Produces:
  - `export function footerHtml(config: { site, guides, ui }): string`: `.site-footer__inner` 안쪽 HTML. DOM에 의존하지 않아 Node에서 테스트할 수 있다. `header.js`를 import하지 않는다(그 모듈은 맨 위에서 `matchMedia`를 불러 Node에서 깨진다)
  - `export function initFooter(mount: HTMLElement): void`: `mount.innerHTML = footerHtml(siteConfig)`
  - `siteConfig.ui.repo = 'GitHub 저장소'`
  - 마크업 클래스 `.site-footer`, `.site-footer__inner`, `.site-footer__nav`, `.site-footer__list`, `.site-footer__link`. 사이트 이름은 기존 `.brand`를 쓴다

- [ ] **Step 1: 문서에 결정을 먼저 적는다**

- `docs/brief.md` '핵심 기능 3. 탐색'에 한 줄을 더한다: "모든 화면 아래에 푸터: 사이트 이름, 가이드 3개 링크, GitHub 저장소 링크(새 탭). 라이선스·출처 표기는 없다."
- `DESIGN.md` `### Navigation` 아래에 `### Footer` 절을 더한다:
  - 위 1px `rule` 선, `paper` 바탕, 위아래 여백 `xl`(40px)
  - 왼쪽 `.brand`, 가운데 가이드 링크, 오른쪽 저장소 링크
  - 링크는 label(0.9375rem, 600), `ink-2` 글자, 최소 높이 40px. 올리면 `accent` 글자와 밑줄
  - 48rem 미만에서는 세로로 쌓고, 간격은 `md`(16px)
  - 화살표 없음(Don't 규칙). 다크 모드는 토큰 그대로
- 스펙 §3 표에 `js/footer.js` 줄을 더하고, §8 M0에 "공통 푸터(2026-11-08 사용자 결정)"를 적는다.

- [ ] **Step 2: 실패하는 단위 테스트를 쓴다 — `tests/unit/footer.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siteConfig } from '../../js/site-config.js';
import { footerHtml } from '../../js/footer.js';

const html = footerHtml(siteConfig);
test('footer shows site name linking home', () => {
  assert.match(html, /<a class="brand" href="#\/">웹사이트 제작 워크플로우<\/a>/);
});
test('footer lists the three guides in config order', () => {
  const hrefs = [...html.matchAll(/class="site-footer__link" href="(#\/[a-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(hrefs, ['#/final', '#/steps', '#/design']);
  for (const g of siteConfig.guides) assert.ok(html.includes(`>${g.menuLabel}<`));
});
test('repo link opens in a new tab and says so', () => {
  assert.match(html, /href="https:\/\/github\.com\/Tiharun\/web-workflow-with-agents" target="_blank" rel="noopener noreferrer">GitHub 저장소<span class="visually-hidden"> \(새 탭\)<\/span>/);
});
test('footer has no license or source notice', () => {
  assert.doesNotMatch(html, /라이선스|License|©|출처/);
});
```

Run: `npm run test:unit`
Expected: FAIL, `Cannot find module '…/js/footer.js'`

- [ ] **Step 3: `js/footer.js`를 쓰고 `ui.repo`를 더한다**

마크업 순서: `.brand` → `<nav class="site-footer__nav" aria-label="${ui.guides}"><ul class="site-footer__list" role="list">`(가이드마다 `<li><a class="site-footer__link" href="#/${id}">${menuLabel}</a></li>`) → 저장소 링크(`class="site-footer__link"`, `target="_blank" rel="noopener noreferrer"`, 숨김 문구 `ui.newTab`). 모두 `<div class="container site-footer__inner">`로 감싼다.

Run: `npm run test:unit`
Expected: PASS 8

- [ ] **Step 4: 실패하는 e2e 테스트를 `tests/e2e/pages.spec.mjs`에 더한다**

```js
for (const p of pages) {
  test(`${p.name} has the shared footer`, async ({ page }) => {
    await openPage(page, p.path);
    const f = page.locator('footer.site-footer');
    await expect(f.locator('.brand')).toHaveText(siteConfig.site.name);
    await expect(f.locator('.site-footer__list a')).toHaveText(siteConfig.guides.map((g) => g.menuLabel));
    await expect(f.getByRole('link', { name: /GitHub 저장소/ })).toHaveAttribute('target', '_blank');
  });
}
test('footer does not overflow at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await openPage(page, '/#/');
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(over).toBeLessThanOrEqual(0);
});
test('footer link to current guide returns to top', async ({ page }) => {
  await openPage(page, '/#/final');
  await page.locator('footer.site-footer').getByRole('link', { name: '최종 워크플로우' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});
```

`404`는 Task 3에서 고치므로, 이 Task에서는 `404 has the shared footer`가 실패하는 것이 맞다.

Run: `npm run test:e2e`
Expected: FAIL. SPA 5개는 `footer.site-footer` 없음, `returns to top`은 scrollY ≠ 0

- [ ] **Step 5: 푸터를 붙이고 같은 해시 링크를 처리한다**

- `index.html`: `</main>` 바로 뒤에 `<footer class="site-footer" id="site-footer"></footer>`를 둔다
- `js/main.js`: `initHeader` 다음 줄에서 `initFooter(document.getElementById('site-footer'))`를 부른다
- `js/main.js`의 기존 `a[data-smooth]` 클릭 처리를 넓힌다. 대상은 `a[href^="#/"]`이고, `href === location.hash`이면 `preventDefault()` 뒤 `route()`를 부른다. `smoothNext = true`는 `data-smooth`가 있을 때만 켠다(brief: smooth scroll은 메가메뉴·목차에만). 수정 키 무시 조건은 그대로 둔다
- `css/site.css`: header 절 뒤에 `/* ---------- footer ---------- */` 절을 두고 Step 1의 DESIGN 값대로 쓴다. 쓰는 토큰은 `--rule-hair`, `--color-rule`, `--color-paper`, `--space-xl`·`--space-lg`·`--space-md`·`--space-2xs`, `--text-sm`, `--color-ink-2`, `--color-accent`. 48rem 미만은 세로 쌓기

Run: `npm run test:unit && npm run test:e2e`
Expected: unit PASS 8. e2e는 `404 has the shared footer` 하나만 FAIL, 나머지 PASS

- [ ] **Step 6: 슬롭·디자인 검사를 돌린다**

Run: `node ~/.claude/skills/hallmark/scripts/sloplint.mjs css/site.css index.html --genre modern-minimal --scope app`
Run: `impeccable detect --json css/site.css`
Expected: 새 footer 규칙에 대한 지적 0개(기존 waive 항목은 제외). 지적이 나오면 고친 뒤 다시 돌린다.

- [ ] **Step 7: 커밋한다**

```bash
git add js/footer.js js/main.js js/site-config.js index.html css/site.css tests DESIGN.md docs/brief.md docs/specs/2026-11-08-guide-site-design.md
git commit -m "M0: 공통 푸터(사이트 이름, 가이드 링크, 저장소 링크)"
```

---

### Task 3: 404 페이지를 같은 헤더·푸터로

**Files:**
- Create: `js/not-found-page.js`
- Modify: `404.html`
- Test: `tests/e2e/pages.spec.mjs`

**Interfaces:**
- Consumes: `initHeader(mount)` (`js/header.js`), `initFooter(mount)` (Task 2), `initTooltips()` (`js/tooltip.js`)
- Produces: `404.html`이 `<header class="site-header" id="site-header">`(정적 사이트 이름은 JS가 없을 때를 위해 남김)와 `<footer class="site-footer" id="site-footer">`를 가진다

- [ ] **Step 1: 실패하는 e2e 테스트를 더한다**

```js
for (const p of pages) {
  test(`${p.name} has the shared header`, async ({ page }) => {
    await openPage(page, p.path);
    const h = page.locator('header.site-header');
    await expect(h.locator('.brand')).toHaveText(siteConfig.site.name);
    await expect(h.locator('.guide-nav__btn')).toHaveText(siteConfig.guides.map((g) => g.menuLabel));
    await expect(h.locator('.mode-toggle')).toBeVisible();
  });
}
test('404 header mega menu loads stages', async ({ page }) => {
  await openPage(page, '/404.html');
  await page.locator('.guide-nav__btn[data-guide="final"]').click();
  const link = page.locator('#mega-final a.mega__stage').first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/#\/final\//);
  await expect(page.locator('.doc:not([aria-busy]) h1')).toBeVisible();
});
```

Run: `npm run test:e2e`
Expected: FAIL 3개(`404 has the shared header`, `404 has the shared footer`, `404 header mega menu loads stages`), 나머지 PASS

- [ ] **Step 2: `js/not-found-page.js`를 쓰고 `404.html`에 연결한다**

- `js/not-found-page.js`: `initHeader(document.getElementById('site-header'))`, `initFooter(document.getElementById('site-footer'))`, `initTooltips()`
- `404.html`:
  - `<header>`에 `id="site-header"`를 붙인다
  - `</main>` 뒤에 `<footer class="site-footer" id="site-footer"></footer>`를 둔다
  - `<head>`의 base 스크립트 바로 뒤에 `<script type="module" src="js/not-found-page.js"></script>`를 둔다. base 요소가 먼저 생겨야 상대 경로가 맞는다
  - 기존 정적 문구와 base 보정 스크립트는 바꾸지 않는다

Run: `npm run test:e2e`
Expected: PASS 전부

- [ ] **Step 3: 커밋한다**

```bash
git add js/not-found-page.js 404.html tests/e2e/pages.spec.mjs
git commit -m "M0: 404 페이지에 공통 헤더·푸터"
```

---

### Task 4: 시각 기준 이미지

**Files:**
- Create: `tests/visual/pages.spec.mjs`, `tests/visual/__screenshots__/win32/…`(생성됨)

**Interfaces:**
- Consumes: Task 1 `pages`·`openPage`, 시각 프로젝트 8개

- [ ] **Step 1: 시각 테스트를 쓴다**

```js
const shots = ['home', 'final', 'notfound', '404'];
for (const name of shots) {
  test(`${name} first screen`, async ({ page }) => {
    await openPage(page, pages.find((p) => p.name === name).path);
    await expect(page).toHaveScreenshot(`${name}.png`);
  });
}
test('footer', async ({ page }) => {
  await openPage(page, '/#/');
  await expect(page.locator('footer.site-footer')).toHaveScreenshot('footer.png');
});
```

- [ ] **Step 2: 기준 이미지를 만든다**

Run: `npm run test:visual -- --update-snapshots`
Expected: 40장(화면 5개 × 프로젝트 8개)이 `tests/visual/__screenshots__/win32/visual-<폭>-<모드>/`에 생긴다. `--project="visual-*"`가 안 먹으면 Task 1 Step 3 메모대로 스크립트를 고친다.

- [ ] **Step 3: 기준 이미지를 직접 확인한다**

이미지 40장을 Read로 연다. 확인할 것:
- 헤더·푸터가 홈과 같은 모양이다
- 다크 모드에서 글자가 읽힌다
- 375px에서 넘침이나 잘림이 없다
- 스켈레톤이 찍히지 않았다

이상이 있으면 원인을 고친 뒤 Step 2를 다시 한다.

- [ ] **Step 4: 다시 돌려 안정적인지 확인한다**

Run: `npm run test:visual`
Expected: PASS 40. 두 번 연속 통과해야 한다(깜빡이는 테스트 없음).

- [ ] **Step 5: 커밋한다**

```bash
git add tests/visual
git commit -m "M0: 시각 기준 이미지(375·768·1280·1440 × 라이트·다크)"
```

---

### Task 5: 배포 주소 설정 + 자동 배포

**Files:**
- Modify: `js/site-config.js`(`site.url`), `tests/unit/site-config.test.mjs`, `CLAUDE.md`

**Interfaces:**
- Produces: `siteConfig.site.url === 'https://tiharun.github.io/web-workflow-with-agents/'`

- [ ] **Step 1: 실패하는 단위 테스트를 더한다**

```js
test('deploy url is the project Pages address', () => {
  assert.equal(siteConfig.site.url, 'https://tiharun.github.io/web-workflow-with-agents/');
});
```

Run: `npm run test:unit`
Expected: FAIL (`''` !== 주소)

- [ ] **Step 2: `site.url`을 채우고 `CLAUDE.md`를 고친다**

- `site.url`을 위 주소로 채우고, "Pages를 켠 뒤 채운다" 주석을 지운다. 주소 형식 `<owner>.github.io/<repo>/`는 Step 6에서 실제 값과 대조한다
- `CLAUDE.md` '명령'의 테스트 줄을 바꾼다: `npm test`(단위+e2e), `npm run test:visual`(시각), 갱신은 `-- --update-snapshots`. 기존 슬롭·디자인·브라우저 검사 줄은 남긴다
- `CLAUDE.md` 문서 지도의 `docs/specs/`·`docs/plans/` 줄에서 "아직 없음"을 지우고 실제 파일 이름을 적는다

Run: `npm test`
Expected: unit PASS 9, e2e PASS 전부

- [ ] **Step 3: 커밋한다**

```bash
git add js/site-config.js tests/unit/site-config.test.mjs CLAUDE.md
git commit -m "M0: 배포 주소 설정과 테스트 명령 문서화"
```

- [ ] **Step 4: 원격을 연결하고 푸시한다** — 사용자 확인 후

원격 저장소 `Tiharun/web-workflow-with-agents`는 공개이고 비어 있다(측정, 2026-11-08). 푸시는 외부 공개 작업이므로 아래 명령을 보여 주고 승인을 받는다.

```bash
git remote add origin https://github.com/Tiharun/web-workflow-with-agents.git
git push -u origin main
git push -u origin m0-skeleton
```

Expected: `main`(3df3e56)과 `m0-skeleton`이 원격에 생긴다

- [ ] **Step 5: PR을 열고 합친다** — 합치기는 사용자 확인 후

Run: `gh pr create --base main --head m0-skeleton --title "M0: 골격 + 즉시 배포" --body-file <M0 완료 기준·테스트 출력 요약 파일>`
그다음 `ccd_pr get_status`로 PR을 연결한다. 사용자가 승인하면 `gh pr merge --merge`로 합친다.
Expected: `main`에 M0 커밋이 들어간다

- [ ] **Step 6: Pages를 켜고 주소를 확인한다** — 사용자가 직접

사용자에게 안내한다: 저장소 Settings → Pages → Build and deployment → Source "Deploy from a branch" → Branch `main` / `/ (root)` → Save.

Run: `gh api repos/Tiharun/web-workflow-with-agents/pages --jq .html_url`
Expected: `https://tiharun.github.io/web-workflow-with-agents/`. 다르면 `site.url`과 테스트를 그 값으로 고쳐 다음 PR로 올린다.

Run: `gh api repos/Tiharun/web-workflow-with-agents/pages/builds/latest --jq .status`
Expected: `built`

- [ ] **Step 7: 배포본에서 완료 기준을 확인한다** (chrome-devtools-mcp, 1280·375 각각, 라이트·다크)

| 주소(배포 주소 뒤) | 기대 |
|---|---|
| `#/` | h1 '웹사이트 제작 워크플로우', 헤더·푸터 |
| `#/final`, `#/steps`, `#/design` | 각 md 첫 제목, 본문, 헤더·푸터 |
| `#/no-such-page` | '찾을 수 없는 주소입니다', 헤더·푸터 |
| `a/b/c`(없는 깊은 경로) | `404.html`, CSS 적용, 헤더·푸터, 메가메뉴 열림 |

- 각 주소에서 콘솔 오류 0개, 네트워크 404 0개(md·글꼴·CSS·JS)
- 스크린샷 1280·375 × 라이트·다크를 보고에 붙인다
- 휴대폰 실기기 확인은 직접 할 수 없다. 보고에 "사용자 확인 필요: 휴대폰에서 배포 주소 열기"로 적는다

---

## M0 완료 기준 (스펙 §8 + 사용자 요청)

1. 배포 주소에서 사이트맵의 모든 페이지(홈, 가이드 3개, 찾을 수 없음, `404.html`)가 열린다. → Task 5 Step 7
2. 모든 페이지의 헤더·푸터가 홈과 같은 품질이다. 같은 모듈이 그리고, 같은 e2e·시각 기준으로 확인한다. → Task 2·3·4
3. `npm test`가 통과한다. → Task 5 Step 2
4. 휴대폰과 PC에서 배포 주소가 열린다. 휴대폰은 사용자가 확인한다. → Task 5 Step 7

참고: 요청의 "사이트맵 전 페이지(제목만)"는 시제품이 이미 제목 이상(본문 전체)을 그리고 있어서 그대로 둔다. 스펙 §1 '기준선 유지' 결정을 따른다.
