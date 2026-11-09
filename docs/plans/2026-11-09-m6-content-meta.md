# M6 콘텐츠·메타 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** md 제목 4곳에 비주얼을 붙이고, siteConfig로 옮긴 원문이 md와 같은지 테스트로 묶고, description·favicon·OG 메타를 정리한다.

**Architecture:** 새 파일 `js/diagrams.js`가 md 구역(제목 다음부터 같은 수준 제목 전까지)의 표·제목을 읽어 비주얼 4종을 DOM으로 만든다. 글자·링크는 HTML(`ol`·`a`), 선·기호·화살표만 `aria-hidden` SVG(`js/icons.js`)다. `js/visuals.js`는 type을 등록하고 builder에 설정 항목을 함께 넘긴다. 메타 이미지(favicon PNG·OG PNG)는 `tools/make-images.mjs`가 Playwright Chromium으로 SVG·HTML을 찍어 만든다(개발 도구, 배포본 의존성 아님).

**Tech Stack:** 바닐라 ES 모듈, `@playwright/test` 1.64.1(Chromium), Node `node:test`, `tests/serve.py`(8123).

**Spec:** [docs/specs/2026-11-08-guide-site-design.md](../specs/2026-11-08-guide-site-design.md) §2(전역 제약 1·2·3·6), §8 M6. 기준: [brief](../brief.md) '비주얼'·데이터 필드, [그림 규칙](../웹%20비주얼%20디자인%20v3%20작업%20규칙.md) B1·B2·B4-1·B8·B9-2·B9-3·B12, [DESIGN.md](../../DESIGN.md) 'Stage Ruler'.

**브랜치:** `main`(b2dca35, M5 병합)에서 `m6-content-meta`.

## 결정 (2026-11-09 사용자 확정)

1. **비주얼 구조 = HTML 목록 + 장식 SVG.** 글자·링크는 HTML이라 폭에 따라 가로↔세로로 재배치되고, 낭독기·Ctrl+F가 그대로 동작한다. SVG는 기호·화살표·선만 그리고 `aria-hidden`이다. 고정 크기 SVG 한 장은 375px에서 글자가 6~8px로 줄어 쓰지 않는다.
2. **흐름 비주얼은 링크다.** '웹사이트 제작 순서' 10단계, 디자인 [1]~[9], 빠른 경로의 [n]은 그 제목으로 가는 `data-smooth` 링크(단계 자와 같다). 문서 지도는 링크가 없고, 바로 아래 표와 내용이 같으므로 `aria-hidden="true"`다.
3. **메타 = description + favicon(SVG·PNG 32·apple-touch-icon 180) + OG.** OG는 스펙 밖 추가 범위다(사용자 결정). og:image는 절대 https 주소, 1200×630([검색: 상대 경로는 크롤러가 못 읽음, 1200×630 권장](https://frontendchecklist.io/rules/seo/og-image-size)). Safari의 SVG favicon·그 안의 다크 모드 지원은 보고가 엇갈려(검색: [WebKit Bugzilla](https://bugs.webkit.org/show_bug.cgi?id=309949)) PNG 대체를 함께 둔다.
4. **비주얼 글자는 모두 md에서 읽는다.** 새 설명 문구는 없다. 비주얼 이름은 `aria-labelledby`로 붙을 제목을 가리킨다. 표 열 이름도 md 원문이라 siteConfig의 비주얼 항목에 둔다.
5. **비주얼 안 모션은 없다.** 비주얼은 `#doc` 직계 `figure`라 기존 `reveal(article)`이 한 번 등장시킨다. 무한 반복 애니메이션 금지(그림 규칙 B2-4).

## 측정한 출발점 (2026-11-09, `main` b2dca35)

- `summary` 3개·`home.lead`·`ruler.loop.label`은 지금 md에 그대로 있다(Node `includes` 모두 true). 원문 대조 테스트는 없다.
- `index.html`·`404.html`: `<link rel="icon" href="data:,">`, OG 없음. description은 `static-copy.spec.mjs`가 이미 검사한다. `tests/unit/html-head.test.mjs`는 `<link rel="icon" href="...">` 정규식만 본다.
- 대상 제목 id(`slugify` 규칙으로 계산): `steps` `전체-흐름-한눈에-보기`, `design` `1-전체-흐름-한눈에-보기`·`3-상황별-빠른-경로`, `final` `2-문서-지도--어떤-파일이-무엇의-기준인가`. Task 2의 `every configured visual renders on its guide`가 실제 md로 확인한다.
- 대상 구역 내용: 제작 순서 = 표(열 `단계|이름|코드 작성|핵심 결과물|권장 노력 수준`, 10행, 코드 작성 `✗`·`△ (1페이지만)`·`○`). 디자인 [1]~[9] = 코드 블록, 단계 제목은 `### [n] 이름 — \`스킬\``([3]은 `(선택)`). 빠른 경로 = 표(`상황|순서`, 6행, 마지막 행은 `→` 없는 괄호 메모). 문서 지도 = 표(`파일|만드는 단계·스킬|역할|규칙`, 11행, `DESIGN.md` 행만 역할이 **굵게**, 단계 칸 첫 토큰 `1~3`·`4`·`5`·`5·7`·`6`).
- 시각 기준 이미지 64장의 화면(홈·final 첫 화면 등)에는 새 비주얼 자리가 들어가지 않는다(final의 '2. 문서 지도'는 첫 화면 아래).

## Global Constraints

- 색·글꼴·간격·모서리는 `css/tokens.css` 토큰만. SVG는 `currentColor`로 칠한다. 새 값이 필요하면 `DESIGN.md`부터 고친다. 예외: favicon SVG는 페이지 CSS 변수를 못 읽으므로 토큰 값(hex)을 그대로 쓰고, 테스트가 `tokens.css`와 같은지 검사한다.
- 사이트 이름·URL·아이콘·OG 이미지 경로·비주얼 목록·표 열 이름은 `js/site-config.js`에서만. HTML의 정적 메타 값은 e2e·단위 테스트가 siteConfig와 대조한다(스펙 §2-2 예외 조항).
- md 원문 문장은 바꾸지 않는다. 비주얼 글자는 md에서 읽고 `textContent`로만 넣는다(`innerHTML`에 md 글자를 넣지 않는다).
- 모션은 `transform`·`opacity`만, 동작 줄이기면 즉시 표시. 비주얼 자체 모션 없음.
- 공용 컴포넌트 재사용: 아이콘 `js/icons.js`의 `icon()`, 단계 이름 `parseStage`·`stagesFromDoc`(`js/ruler.js`), 이동 `data-smooth`(`js/main.js`). 같은 역할을 새로 만들지 않는다.
- 비주얼 제작 절차(그림 규칙 B8, 노력 '기본'): 초안 1개 → 렌더(시각 테스트 스크린샷) → PNG를 직접 열어 보기 → 가장 나쁜 것 하나 고치기, 3회. 수정마다 `R1 나쁨 → 수정 → 결과`를 기록해 마무리 보고에 붙인다(B12).
- Three.js는 쓰지 않는다(스펙 M6·§9).
- 콘솔 오류 0. 리뷰 Minor도 같은 작업 안에서 테스트로 고친다(CLAUDE.md 규칙 7).

## Review Focus

1. **md 글자가 HTML로 해석됨** — 표 칸·제목에 `<b>`·`&`가 있으면 글자 그대로 보여야 한다(실제 예: 빠른 경로의 `/hallmark redesign <경로>`) → Task 2 DOM `md text is inserted as text, not markup`, Task 4 Step 1에 `<경로>` 칩 글자 검사.
2. **md 구조가 바뀜(표 없음, 열 이름 변경, `→` 없는 행)** — 그 비주얼만 숨거나 그 행만 빠지고 글·목차는 그대로, 배포 전 테스트가 실패 → Task 2·3·4 DOM `… returns null without its table`, `rows without a path are skipped`, Task 2 `every configured visual renders on its guide`.
3. **375px에서 긴 파일 이름이 넘침** — `docs/superpowers/specs/<날짜>-<주제>-design.md`처럼 공백 없는 칩 → Task 5 e2e `every visual fits the text column at 375px`.
4. **다크 모드에서 선·기호가 안 보임(색 하드코딩)** → Task 2 단위 `diagrams.js has no color literals`, Task 5 시각 기준 이미지(라이트·다크).
5. **링크가 없는 제목을 가리키거나 이동 뒤 비주얼이 두 번 붙음** → Task 2·4 DOM `links point to headings in the doc`, Task 5 e2e `a flow link scrolls to its stage and keeps one visual`.

---

### Task 1: siteConfig 원문 = md 대조 테스트

**Files:**
- Test: `tests/unit/source-text.test.mjs` (새 파일)

시제품 값이 이미 맞으므로 처음부터 통과한다. 대신 Step 2에서 일부러 한 글자를 바꿔 실패하는지 확인한다(스펙 M6 완료 기준 2).

- [ ] **Step 1: 테스트 작성**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { siteConfig, guideById } from '../../js/site-config.js';

const md = (id) => readFileSync(guideById(id).file, 'utf8');

for (const g of siteConfig.guides) {
  test(`${g.id} summary is verbatim from its md`, () => assert.ok(md(g.id).includes(g.summary), g.summary));
}
test('home lead is verbatim from the featured md', () => {
  assert.ok(md(siteConfig.home.featuredGuideId).includes(siteConfig.home.lead));
});
test('ruler loop label is verbatim from the ruler md', () => {
  assert.ok(md(siteConfig.ruler.guideId).includes(siteConfig.ruler.loop.label));
});
```

- [ ] **Step 2: 실행 → 통과, 한 글자 바꿔 실패 확인 → 되돌림**

Run: `npm run test:unit`
Expected: PASS. 그다음 `js/site-config.js`의 `steps` summary 마지막 `다.`를 `요.`로 바꿔 다시 실행 → `steps summary is verbatim from its md` FAIL. 되돌리고 PASS 확인(`git diff js/site-config.js` 빈 출력).

- [ ] **Step 3: 커밋**

```bash
git add tests/unit/source-text.test.mjs
git commit -m "M6: siteConfig 원문(summary·lead·루프 라벨)이 md와 같은지 단위 테스트"
```

---

### Task 2: 흐름 비주얼 2개 (`steps-flow`, `design-flow`)와 공용 구역 읽기

**Files:**
- Create: `js/diagrams.js`
- Modify: `js/visuals.js` (`placeVisuals`가 builder를 `build(doc, guide, item)`으로 부름, `steps-flow`·`design-flow` 등록. 나머지 2종은 Task 3·4가 등록)
- Modify: `js/icons.js` (`PATHS`에 `mark-none`·`mark-part`·`mark-full` 추가)
- Modify: `js/site-config.js` (`visuals`에 2항목)
- Modify: `DESIGN.md` (Components에 'Diagrams' 절 추가), `css/site.css` (`.flow` 블록, `.ruler` 블록 바로 뒤)
- Test: `tests/unit/diagrams.test.mjs` (새), `tests/dom/diagrams.spec.mjs` (새), `tests/visual/visuals.spec.mjs` (새)

**Interfaces:**
- Consumes: `parseStage(title)`(`js/ruler.js`), `icon(name, cls)`, 문서 `{ template, headings: { id, title, level, parentId }[] }`
- Produces (`js/diagrams.js`, 최상위에서 DOM을 쓰지 않는다 — Node 단위 테스트가 `visuals.js`를 import한다):
  - `sectionOf(doc, headingId) → Element[]` — `doc.template.content`의 직계 자식 중 그 제목 다음부터, 수준이 같거나 높은 다음 제목 전까지. 제목이 없으면 `[]`.
  - `firstTable(nodes) → { heads: string[], rows: Element[][] } | null` — 구역 안 첫 `table`(`.table-wrap` 안 포함). `heads`는 `th` 글자(trim), `rows`는 `tbody tr`의 칸 요소.
  - `col(table, name) → number` — 열 이름의 위치, 없으면 `-1`.
  - `parseBracket(title) → { num: string, name: string, optional: boolean } | null` — `"[3] 시각 탐색 (선택) — playground"` → `{ num: '3', name: '시각 탐색', optional: true }`. `[n]`으로 시작하지 않으면 `null`.
  - `buildFlow(items, labelledBy, legend = null) → HTMLElement` — `items: { num, name, href, key?, optional?, mark? }[]`, `mark ∈ 'none' | 'part' | 'full' | undefined`, `legend: { title: string, marks: [mark, char][] } | null`.
  - `stepsFlow(doc, guide, item) → HTMLElement | null`, `designFlow(doc, guide, item) → HTMLElement | null`
- Produces (`js/visuals.js`): builder 시그니처 `(doc, guide, item) => Element | null`. `stage-ruler`는 세 번째 인자를 무시한다.

**siteConfig 항목**(제목 id는 측정값, 열 이름은 md 원문):

```js
{ guideId: 'steps', headingId: '전체-흐름-한눈에-보기', type: 'steps-flow', column: '코드 작성' },
{ guideId: 'design', headingId: '1-전체-흐름-한눈에-보기', type: 'design-flow' },
```

**규칙:**
- `stepsFlow`: 항목 = `doc.headings` 중 level 2이고 `parseStage(title).num`이 있는 제목(제작 순서 1~10단계). `name`·`key`(★)는 `parseStage`. `href = #/${guide.id}/${id}`. `mark`: 구역 첫 표에서 첫 열 글자 = `num`인 행의 `item.column` 칸 첫 글자 `✗→none`, `△→part`, `○→full`, 그 밖은 없음. 범례 = `{ title: item.column, marks: 표에 나온 순서의 [mark, 원문 첫 글자] 중복 제거 }`. 표나 열이 없으면 `null`. 항목이 2개 미만이면 `null`.
- `designFlow`: 항목 = level 3 제목 중 `parseBracket`이 `null`이 아닌 것, `optional` 그대로, `key` 없음, 범례 없음. 2개 미만이면 `null`.
- `buildFlow` 마크업: `<nav class="flow" aria-labelledby="${labelledBy}"><ol class="flow__list" style="--n:N">` + 항목마다 `<li class="flow__step[ is-key][ is-optional]" data-mark="…"><a class="flow__link" href data-smooth><span class="flow__num" aria-hidden="true">${num}</span>${glyph}<span class="flow__name">${name}</span></a></li>`. `glyph`는 `mark`가 있을 때 `icon('mark-<mark>', 'icon flow__mark')`. 링크의 접근 이름이 번호를 잃지 않게 `flow__name` 앞에 `<span class="visually-hidden">${num} </span>`. 범례는 `ol` 뒤 `<p class="flow__legend" aria-hidden="true">`(제목 + 기호·원문 글자). md 글자는 모두 `textContent`로 넣는다.
- 아이콘(24 그리드, 기존 1.75 선): `mark-none` = 원 r 7, `mark-part` = 원 r 7 + 왼쪽 반원 `fill="currentColor"`, `mark-full` = 원 r 7 `fill="currentColor"`.
- CSS(토큰만, `.ruler`와 같은 말투): 컨테이너 쿼리 `40rem` 이상이면 가로 `grid-template-columns: repeat(var(--n), minmax(0,1fr))`, 1px `--color-rule-strong` 축, 이름은 기호 아래 `--text-xs`; 미만이면 세로 목록(왼쪽 1px 축, 번호·기호·이름 한 줄). `is-key` 번호·기호 `--color-accent`, `is-optional` 번호 칸 1px dashed `--color-rule-2`. 링크 누르는 영역 24px 이상, `:focus-visible`은 `.ruler__link`와 같은 윤곽선. 한국어 `word-break: keep-all`, `overflow-wrap: anywhere`.
- `DESIGN.md` 'Diagrams' 절: 위 값(축·기호·key·optional·칩·브레이크포인트 40rem)을 토큰 이름으로 적는다. CSS보다 먼저 쓴다(CLAUDE.md 규칙 1).

- [ ] **Step 1: 단위 테스트 작성** — `tests/unit/diagrams.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseBracket } from '../../js/diagrams.js';

test('parseBracket reads number, name and the optional mark', () => {
  assert.deepEqual(parseBracket('[3] 시각 탐색 (선택) — playground'), { num: '3', name: '시각 탐색', optional: true });
  assert.deepEqual(parseBracket('[1] 맥락 정리 — impeccable init'), { num: '1', name: '맥락 정리', optional: false });
  assert.equal(parseBracket('0. 핵심 원칙 5가지'), null);
});

test('diagrams.js has no color literals', () => {
  assert.doesNotMatch(readFileSync('js/diagrams.js', 'utf8'), /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);
});
```

- [ ] **Step 2: DOM 테스트 작성** — `tests/dom/diagrams.spec.mjs`

파일 안 도우미 `build(page, md, guideId, item)`: `tests/dom/helpers.mjs`의 `render`와 같은 방식으로 `blank.html`에서 `buildDoc` → `#doc`에 템플릿 복제 → `visualTypes[item.type](doc, guide, item)`의 결과를 `#doc` 뒤 `#out`(없으면 만듦)에 넣고 `{ ok: 결과가 있음, ids: #doc 안 모든 [id] }`를 돌려준다. 파일 맨 위 Node 쪽 도우미: `const md = (id) => readFileSync(guideById(id).file, 'utf8')`, `const item = (type) => siteConfig.visuals.find((v) => v.type === type)`.

```js
test('steps flow: one link per stage with the code marks from the table', async ({ page }) => {
  const r = await build(page, md('steps'), 'steps', item('steps-flow'));
  expect(r.ok).toBe(true);
  const links = page.locator('#out .flow__link');
  await expect(links).toHaveCount(10);
  expect(await page.locator('#out .flow__step').evaluateAll((s) => s.map((x) => x.dataset.mark)))
    .toEqual(['none', 'none', 'none', 'part', 'none', 'full', 'full', 'full', 'full', 'full']);
  await expect(page.locator('#out .flow__step.is-key .flow__num')).toHaveText('4');
  await expect(page.locator('#out .flow')).toHaveAttribute('aria-labelledby', item('steps-flow').headingId);
});

test('design flow: [1]~[9] with [3] optional', async ({ page }) => {
  await build(page, md('design'), 'design', item('design-flow'));
  await expect(page.locator('#out .flow__link')).toHaveCount(9);
  await expect(page.locator('#out .flow__step.is-optional .flow__num')).toHaveText('3');
});

test('links point to headings in the doc', async ({ page }) => {
  for (const [id, type] of [['steps', 'steps-flow'], ['design', 'design-flow']]) {
    const r = await build(page, md(id), id, item(type));
    const targets = await page.locator('#out a').evaluateAll((as) => as.map((a) => decodeURIComponent(a.hash).split('/')));
    for (const [, g, h] of targets) { expect(g).toBe(id); expect(r.ids).toContain(h); }
  }
});

test('steps flow returns null without its table', async ({ page }) => {
  const r = await build(page, '# T\n\n## 전체 흐름 한눈에 보기\n\n글만 있음.\n\n## 1단계. 범위 정의\n\n## 2단계. 구조 설계\n', 'steps', item('steps-flow'));
  expect(r.ok).toBe(false);
});

test('md text is inserted as text, not markup', async ({ page }) => {
  await build(page, '# T\n\n## 1. 전체 흐름 한눈에 보기\n\n## 2. 사용법\n\n### [1] a &lt;b&gt;x&lt;/b&gt; — s\n\n### [2] 둘 — s\n', 'design', item('design-flow'));
  await expect(page.locator('#out b')).toHaveCount(0);
  await expect(page.locator('#out .flow__name').first()).toContainText('<b>x</b>');
});
```

M5의 `tests/dom/visuals.spec.mjs` `every configured visual renders on its guide`가 새 항목도 실제 md로 그려 본다(바꾸지 않는다).

- [ ] **Step 3: 시각 테스트 작성** — `tests/visual/visuals.spec.mjs`. `siteConfig.visuals`의 `stage-ruler`가 아닌 항목마다 `openPage(page, '/#/<guideId>/<headingId>')` → `page.locator('[id="<headingId>"] + figure.visual').toHaveScreenshot('<type>.png')`. 8개 시각 프로젝트(375·768·1280·1440 × 라이트·다크)에서 돈다.

- [ ] **Step 4: 실행해 실패 확인**

Run: `npm run test:unit` 그리고 `npx playwright test --project=dom tests/dom/diagrams.spec.mjs`
Expected: FAIL — `js/diagrams.js` 없음.

- [ ] **Step 5: `DESIGN.md` 'Diagrams' 절 → `js/icons.js` 아이콘 3개 → `js/diagrams.js` → `js/visuals.js` → siteConfig 2항목 → `css/site.css` `.flow`** (위 규칙대로)

- [ ] **Step 6: 실행해 통과 확인**

Run: `npm test`
Expected: 단위·DOM·e2e PASS(기존 `every configured type is registered`, `every configured visual renders on its guide` 포함).

- [ ] **Step 7: 그림 규칙 B8 루프(초안 1개, 수정 3회)**

Run: `npx playwright test --project="visual-*" tests/visual/visuals.spec.mjs --update-snapshots`
그다음 `tests/visual/__screenshots__/win32/visual-{375,768,1440}-{light,dark}/{steps-flow,design-flow}.png`를 직접 연다. 가장 나쁜 것 하나(글자 겹침, 축과 기호 어긋남, 다크에서 흐림, 1x에서 기호 구분 안 됨)를 고치고 다시 찍는다. 3회, 수정마다 `R1 나쁨 → 수정 → 결과` 기록. 끝나면 `npm run test:visual`이 모두 PASS.

- [ ] **Step 8: 커밋**

```bash
git add js/diagrams.js js/visuals.js js/icons.js js/site-config.js css/site.css DESIGN.md tests/unit/diagrams.test.mjs tests/dom/diagrams.spec.mjs tests/visual/visuals.spec.mjs tests/visual/__screenshots__
git commit -m "M6: 흐름 비주얼(제작 순서 10단계·디자인 [1]~[9]) — md 표·제목에서 읽는 HTML 목록 + 장식 SVG, 단계 링크"
```

---

### Task 3: 문서 지도 비주얼 (`doc-map`)

**Files:**
- Modify: `js/diagrams.js` (`docMap` 추가), `js/visuals.js` (등록), `js/site-config.js` (항목), `css/site.css` (`.docmap`), `DESIGN.md` 'Diagrams'에 문서 지도 줄
- Test: `tests/dom/diagrams.spec.mjs`, `tests/visual/visuals.spec.mjs`(항목이 siteConfig에서 오므로 코드 변경 없음, 기준 이미지 추가)

**Interfaces:**
- Consumes: `sectionOf`, `firstTable`, `col`(Task 2), `stagesFromDoc(doc)`(`js/ruler.js`)
- Produces: `docMap(doc, guide, item) → HTMLElement | null`

**siteConfig 항목:**

```js
{ guideId: 'final', headingId: '2-문서-지도--어떤-파일이-무엇의-기준인가', type: 'doc-map', columns: { file: '파일', stage: '만드는 단계·스킬', role: '역할' } },
```

**규칙:**
- 행마다 단계 토큰 = 단계 칸 글자 맨 앞 `/^[\d~]+/`(예 `5·7 writing-plans` → `5`). 토큰이 없는 행은 빠진다. 같은 토큰끼리 처음 나온 순서대로 칸(lane)을 만든다 → `1~3`, `4`, `5`, `6`.
- 칸 머리 = 토큰 + `stagesFromDoc(doc)`에서 `num === 토큰`인 단계의 `name`(없으면 토큰만).
- 칩 = 파일 칸 글자. 역할 칸에 `strong`이 있으면 칩에 `is-key`와 그 `strong` 글자를 작은 라벨로 붙인다(`DESIGN.md` → '디자인 기준').
- 마크업: `<div class="docmap" aria-hidden="true"><ol class="docmap__lanes">` + 칸마다 `<li class="docmap__lane"><p class="docmap__head"><span class="docmap__num">…</span><span>…</span></p><ul class="docmap__files"><li class="docmap__file[ is-key]">…</li></ul></li>`. 칸 사이 순서는 `icon('right', 'icon docmap__arrow')`(`aria-hidden` 전체 안).
- CSS: 컨테이너 `40rem` 이상 칸 가로 배치(`repeat(var(--n), minmax(0,1fr))`), 미만 세로. 칩은 1px `--color-rule-2`, `--radius-input`, `--color-paper-2`, `--font-outlier` `--text-xs`, `overflow-wrap: anywhere`. `is-key` 칩은 `--color-accent` 테두리 + `--color-accent-wash`.
- 표나 파일·단계 열이 없거나 칸이 0개면 `null`.

- [ ] **Step 1: DOM 테스트 추가**

```js
test('doc map groups files into stage lanes and marks the design source', async ({ page }) => {
  await build(page, md('final'), 'final', item('doc-map'));
  expect(await page.locator('#out .docmap__num').allTextContents()).toEqual(['1~3', '4', '5', '6']);
  await expect(page.locator('#out .docmap__file')).toHaveCount(11);
  await expect(page.locator('#out .docmap__file.is-key')).toHaveCount(1);
  await expect(page.locator('#out .docmap__file.is-key')).toContainText('DESIGN.md');
  await expect(page.locator('#out .docmap')).toHaveAttribute('aria-hidden', 'true');
});

test('doc map returns null without its table', async ({ page }) => {
  const r = await build(page, '# T\n\n## 2. 문서 지도 — 어떤 파일이 무엇의 기준인가\n\n표 없음.\n', 'final', item('doc-map'));
  expect(r.ok).toBe(false);
});
```

- [ ] **Step 2: 실행해 실패 확인** — Run: `npx playwright test --project=dom tests/dom/diagrams.spec.mjs` → Expected: 새 2개 FAIL(`item('doc-map')` 없음).

- [ ] **Step 3: 구현**(위 규칙, `DESIGN.md` 줄 먼저)

- [ ] **Step 4: 통과 확인** — Run: `npm test` → PASS.

- [ ] **Step 5: B8 루프(초안 1개, 수정 3회)** — Task 2 Step 7과 같은 명령, 대상 `doc-map.png`. 375px에서 가장 긴 칩(`docs/superpowers/specs/<날짜>-<주제>-design.md`)이 줄바꿈되는지 특히 본다.

- [ ] **Step 6: 커밋**

```bash
git add js/diagrams.js js/visuals.js js/site-config.js css/site.css DESIGN.md tests/dom/diagrams.spec.mjs tests/visual/__screenshots__
git commit -m "M6: 문서 지도 비주얼 — 표의 파일을 단계 칸으로 묶고 디자인 기준 강조"
```

---

### Task 4: 상황별 빠른 경로 비주얼 (`quick-paths`)

**Files:**
- Modify: `js/diagrams.js` (`quickPaths`), `js/visuals.js`, `js/site-config.js`, `css/site.css` (`.paths`), `DESIGN.md`
- Test: `tests/dom/diagrams.spec.mjs`, 시각 기준 이미지

**Interfaces:**
- Consumes: `sectionOf`, `firstTable`, `col`, `parseBracket`(Task 2)
- Produces: `quickPaths(doc, guide, item) → HTMLElement | null`

**siteConfig 항목:**

```js
{ guideId: 'design', headingId: '3-상황별-빠른-경로', type: 'quick-paths', columns: { name: '상황', path: '순서' } },
```

**규칙:**
- 행마다 토큰 = 순서 칸 글자를 `→`로 나눠 trim. 토큰이 2개 미만인 행은 빠진다(마지막 괄호 메모 행). 남은 행이 0개면 `null`.
- 토큰이 `/^\[(\d+)\]\s*(.*)$/`이면 단계 칩: 같은 문서 level 3 제목 중 `parseBracket(title).num`이 같은 제목으로 가는 `<a class="paths__step" href="#/${guide.id}/${id}" data-smooth><span aria-hidden="true">${n}</span><span class="visually-hidden">[${n}] ${name}</span></a>`, 나머지 글자(예 `hallmark`)가 있으면 뒤에 글자 칩. 그 번호의 제목이 없으면 글자 칩으로 둔다. 그 밖의 토큰은 글자 칩 `<span class="paths__text">`.
- 마크업: `<div class="paths" role="group" aria-labelledby="${headingId}"><ol class="paths__rows">` + 행마다 `<li class="paths__row"><p class="paths__name">${상황}</p><ol class="paths__seq">` + 토큰마다 `<li>`, 두 번째 토큰부터 앞에 `icon('right', 'icon paths__arrow')`.
- CSS: 상황 이름 위, 순서는 `flex-wrap: wrap` 줄바꿈(폭에 관계없이 넘치지 않음). 단계 칩 24px 이상 정사각, `--color-accent` 1px 테두리, 번호 `tabular-nums`. 글자 칩은 `.docmap__file`과 같은 칩 규칙을 공유한다(같은 선택자 묶음).

- [ ] **Step 1: DOM 테스트 추가**

```js
test('quick paths: one row per path, [n] steps link to their headings', async ({ page }) => {
  const r = await build(page, md('design'), 'design', item('quick-paths'));
  await expect(page.locator('#out .paths__row')).toHaveCount(5); // 6행 중 '→' 없는 메모 행 제외
  const first = page.locator('#out .paths__row').first();
  expect(await first.locator('.paths__step [aria-hidden]').allTextContents()).toEqual(['1', '2', '3', '4', '5', '6', '8', '9']);
  await expect(first.locator('.paths__text')).toHaveText(['hallmark']);
  await expect(page.locator('#out .paths__text', { hasText: '<경로>' })).toHaveCount(1); // 마크업이 아니라 글자
  const hs = await page.locator('#out a').evaluateAll((as) => as.map((a) => decodeURIComponent(a.hash).split('/')[2]));
  for (const h of hs) expect(r.ids).toContain(h);
});

test('rows without a path are skipped and an empty table gives null', async ({ page }) => {
  const r = await build(page, '# T\n\n## 3. 상황별 빠른 경로\n\n| 상황 | 순서 |\n|---|---|\n| 메모 | (설명만) |\n', 'design', item('quick-paths'));
  expect(r.ok).toBe(false);
});
```

- [ ] **Step 2: 실패 확인** — Run: `npx playwright test --project=dom tests/dom/diagrams.spec.mjs` → 새 2개 FAIL.
- [ ] **Step 3: 구현**(`DESIGN.md` 줄 먼저)
- [ ] **Step 4: 통과 확인** — Run: `npm test` → PASS.
- [ ] **Step 5: B8 루프(초안 1개, 수정 3회)** — 대상 `quick-paths.png`.
- [ ] **Step 6: 커밋**

```bash
git add js/diagrams.js js/visuals.js js/site-config.js css/site.css DESIGN.md tests/dom/diagrams.spec.mjs tests/visual/__screenshots__
git commit -m "M6: 상황별 빠른 경로 비주얼 — 순서를 칩으로, [n]은 그 단계 링크"
```

---

### Task 5: 가이드 화면에서 비주얼 4개 e2e

**Files:**
- Test: `tests/e2e/diagrams.spec.mjs` (새)

**Interfaces:**
- Consumes: `openPage`·`tocIds`(`tests/e2e/helpers.mjs`), `siteConfig.visuals`

파일 안 목록 `const items = siteConfig.visuals.filter((v) => v.type !== 'stage-ruler')`. 파일 안 도우미 `errors(page)`는 `tests/e2e/visuals.spec.mjs`의 것과 같은 방식(`pageerror`·`console.error` 수집).

```js
for (const v of items) {
  test(`${v.type} shows under its heading in light and dark`, async ({ page }) => {
    const errs = errors(page);
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: scheme });
      await openPage(page, `/#/${v.guideId}`);
      await expect(page.locator(`[id="${v.headingId}"] + figure.visual`)).toBeVisible();
    }
    expect(errs).toEqual([]);
  });

  test(`${v.type}: every visual fits the text column at 375px`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await openPage(page, `/#/${v.guideId}`);
    const r = await page.locator(`[id="${v.headingId}"] + figure.visual`).evaluate((f) => {
      const doc = document.querySelector('#doc').getBoundingClientRect();
      const boxes = [...f.querySelectorAll('*')].map((e) => e.getBoundingClientRect());
      return { left: Math.min(...boxes.map((b) => b.left)), right: Math.max(...boxes.map((b) => b.right)), docL: doc.left, docR: doc.right,
        over: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    expect(r.left).toBeGreaterThanOrEqual(r.docL);
    expect(r.right).toBeLessThanOrEqual(r.docR);
    expect(r.over).toBe(0);
  });
}

test('a flow link scrolls to its stage and keeps one visual', async ({ page }) => {
  const v = items.find((x) => x.type === 'steps-flow');
  await openPage(page, `/#/${v.guideId}`);
  const link = page.locator('.flow__link').last();
  const id = decodeURIComponent(await link.evaluate((a) => a.hash)).split('/')[2];
  await link.click();
  await expect(page.locator(`#doc [id="${id}"]`)).toBeInViewport();
  await expect(page.locator('#doc .visual .flow')).toHaveCount(1);
  expect((await tocIds(page)).length).toBeGreaterThan(0);
});
```

- [ ] **Step 1: 테스트 작성** — 위 코드.
- [ ] **Step 2: 실행** — Run: `npx playwright test --project=e2e tests/e2e/diagrams.spec.mjs` → Expected: PASS(Task 2~4 구현이 이미 있음). 실패하면 원인을 고치고(넘침은 CSS, 이동은 `data-smooth` 누락) 다시 실행.
- [ ] **Step 3: 일부러 깨 실패 확인** — `.docmap__file`의 `overflow-wrap: anywhere`를 잠시 지우고 `doc-map: every visual fits…`가 FAIL하는지 본다 → 되돌림. FAIL하지 않으면 테스트를 고친다(B9-1 '실패할 줄 알아야 통과가 의미 있다').
- [ ] **Step 4: 커밋**

```bash
git add tests/e2e/diagrams.spec.mjs
git commit -m "M6: 비주얼 4개 e2e(라이트·다크 표시, 375px 넘침 없음, 링크 이동 뒤 중복 없음)"
```

---

### Task 6: favicon·OG 메타

**Files:**
- Create: `assets/favicon.svg`, `tools/og.html`, `tools/make-images.mjs`, 생성물 `assets/favicon-32.png`·`assets/apple-touch-icon.png`·`assets/og.png`
- Modify: `js/site-config.js` (`site.icons`, `site.ogImage`), `index.html`·`404.html` (head), `package.json` (`"images": "node tools/make-images.mjs"`), `tests/unit/html-head.test.mjs`, `tests/e2e/static-copy.spec.mjs`, `tests/e2e/helpers.mjs` (`types`에 `.png: image/png`)
- Modify: `docs/specs/2026-11-08-guide-site-design.md` §2-2 예외 목록에 'favicon·OG 메타' 추가, §8 M6에 'OG 추가(2026-11-09 사용자 결정)', `CLAUDE.md` '명령'에 `npm run images`(siteConfig 이름·설명·토큰 색을 바꾸면 다시 실행)
- Test: `tests/unit/meta-assets.test.mjs` (새)

**Interfaces:**
- Produces (siteConfig `site`):

```js
ogImage: 'assets/og.png', // index.html og:image = new URL(ogImage, url)
icons: { svg: 'assets/favicon.svg', png: 'assets/favicon-32.png', apple: 'assets/apple-touch-icon.png' },
```

**규칙:**
- `assets/favicon.svg`: `viewBox="0 0 32 32"`, 모서리 둥근 정사각(rx 7) 바탕 = 라이트 `--color-accent`, 그 위 단계 자 눈금 3개(짧은·긴·짧은 세로 막대, 가운데가 주요 단계) = 라이트 `--color-accent-ink`. 내부 `<style>`의 `@media (prefers-color-scheme: dark)`에서 다크 토큰 값으로 바꾼다. hex는 `tokens.css` 값 그대로(라이트 `#2563eb`·`#ffffff`, 다크 `#6ea8fe`·`#0b1220` — 측정값, 테스트가 파일에서 다시 읽어 대조). 16px에서도 눈금 3개가 구분돼야 한다(B1 1x 가독성: 막대 폭 4 이상).
- `tools/og.html`: 1200×630 고정 화면. `css/site.css`와 글꼴을 쓰고, `js/site-config.js`를 import해 `site.name`(제목)·`site.description`(설명)을 넣고, 아래에 장식 눈금 줄(단계 자 말투, `aria-hidden`)을 둔다. 라이트 고정(`data-mode="light"`). 핵심 글자는 가장자리 60px 안쪽(메신저가 가장자리를 자른다는 보고, 검색 [Kakao devtalk](https://devtalk.kakao.com/t/do-you-have-a-page-on-your-site-for-how-you-process-open-graph-images/76906)).
- `tools/make-images.mjs`: `@playwright/test`의 `chromium`으로 브라우저를 띄우고, `page.route('http://images.local/**')`로 저장소 파일을 답해(서버 없이 ES 모듈·글꼴이 열림) 세 장을 찍는다: `og.html` 1200×630 → `assets/og.png`; `favicon.svg`를 담은 페이지 32×32(투명 바탕) → `favicon-32.png`; 180×180(`--color-paper` 바탕 위 아이콘, iOS가 투명을 검게 채우므로) → `apple-touch-icon.png`. `document.fonts.ready`를 기다린 뒤 찍는다.
- `index.html` head(`data:,` 줄을 바꾼다):
  `<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">`, `<link rel="icon" href="assets/favicon-32.png" sizes="32x32" type="image/png">`, `<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">`, `og:type`=`website`, `og:locale`=`ko_KR`, `og:site_name`·`og:title`=site.name, `og:description`=site.description, `og:url`=site.url, `og:image`=`${site.url}assets/og.png`, `og:image:width` 1200, `og:image:height` 630, `twitter:card`=`summary_large_image`.
- `404.html`: 같은 아이콘 3줄을 `site.url` 기준 절대 주소로(CSS와 같은 방식, 하위 경로에서도 맞게). OG는 넣지 않는다(`noindex` 페이지).

- [ ] **Step 1: 테스트 작성**

`tests/unit/html-head.test.mjs`의 정규식 테스트를 바꾼다:

```js
const { site } = siteConfig;
const hrefs = (html, rel) => [...html.matchAll(new RegExp(`<link rel="${rel}" href="([^"]+)"`, 'g'))].map((m) => m[1]);
test('index.html icons match siteConfig', () => {
  const html = readFileSync('index.html', 'utf8');
  assert.deepEqual(hrefs(html, 'icon'), [site.icons.svg, site.icons.png]);
  assert.deepEqual(hrefs(html, 'apple-touch-icon'), [site.icons.apple]);
});
test('404.html icons are absolute site urls', () => {
  const html = readFileSync('404.html', 'utf8');
  assert.deepEqual(hrefs(html, 'icon'), [site.url + site.icons.svg, site.url + site.icons.png]);
  assert.deepEqual(hrefs(html, 'apple-touch-icon'), [site.url + site.icons.apple]);
});
```

`tests/unit/meta-assets.test.mjs`:

```js
const png = (f) => { const b = readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; }; // IHDR 너비·높이
test('meta images have their declared sizes', () => {
  assert.deepEqual(png(site.icons.png), [32, 32]);
  assert.deepEqual(png(site.icons.apple), [180, 180]);
  assert.deepEqual(png(site.ogImage), [1200, 630]);
});
test('favicon colors are the accent tokens of both themes', () => {
  const tokens = readFileSync('css/tokens.css', 'utf8');
  const val = (name, nth) => [...tokens.matchAll(new RegExp(`--${name}: (#[0-9a-f]{6})`, 'gi'))][nth][1].toLowerCase();
  const want = new Set([val('color-accent', 0), val('color-accent-ink', 0), val('color-accent', 1), val('color-accent-ink', 1)]);
  const got = new Set(readFileSync(site.icons.svg, 'utf8').match(/#[0-9a-f]{6}/gi).map((h) => h.toLowerCase()));
  assert.deepEqual(got, want);
});
```

`tests/e2e/static-copy.spec.mjs` `index.html static copy matches siteConfig`에 추가:

```js
const meta = (p) => page.locator(`meta[property="${p}"]`);
await expect(meta('og:title')).toHaveAttribute('content', site.name);
await expect(meta('og:site_name')).toHaveAttribute('content', site.name);
await expect(meta('og:description')).toHaveAttribute('content', site.description);
await expect(meta('og:url')).toHaveAttribute('content', site.url);
await expect(meta('og:image')).toHaveAttribute('content', new URL(site.ogImage, site.url).href);
await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
```

아이콘 파일이 실제로 있는지는 `meta-assets.test.mjs`가 파일을 읽으며 함께 확인한다(없으면 `readFileSync`가 실패).

- [ ] **Step 2: 실행해 실패 확인** — Run: `npm run test:unit` → Expected: FAIL(`site.icons` 없음, 파일 없음).

- [ ] **Step 3: 구현** — siteConfig → `assets/favicon.svg` → `tools/og.html`·`tools/make-images.mjs` → `npm run images` → `index.html`·`404.html` head → `helpers.mjs` `types`.

- [ ] **Step 4: 그림 확인(B8, 수정 3회)** — `assets/og.png`, `favicon-32.png`, `apple-touch-icon.png`를 직접 연다. 16px로 줄여 본 favicon(브라우저 탭)에서 눈금이 뭉개지면 막대·간격을 고치고 `npm run images` 다시. R 기록.

- [ ] **Step 5: 통과 확인** — Run: `npm test` → PASS. 브라우저 확인: `python -m http.server 8000 --bind 127.0.0.1` → `http://127.0.0.1:8000/` 탭에 아이콘이 보이고, 네트워크에 `favicon.ico` 요청이 없다.

- [ ] **Step 6: 스펙·CLAUDE.md 줄 고침**(Files 항목대로)

- [ ] **Step 7: 커밋**

```bash
git add assets tools js/site-config.js index.html 404.html package.json tests/unit/html-head.test.mjs tests/unit/meta-assets.test.mjs tests/e2e/static-copy.spec.mjs tests/e2e/helpers.mjs docs/specs/2026-11-08-guide-site-design.md CLAUDE.md
git commit -m "M6: favicon(SVG·PNG·apple-touch)과 OG 메타, 이미지 생성 도구, siteConfig 대조 테스트"
```

---

### Task 7: 마일스톤 마무리 검사

**Files:** 없음(검사 출력·스크린샷). 문제가 나오면 고치는 파일과 재현 테스트를 이 작업에 더한다(CLAUDE.md 규칙 7). 끝나면 `CLAUDE.md` 규칙 3 목록에 `도식 js/diagrams.js`를 더한다.

- [ ] **Step 1: 전체 테스트** — Run: `npm test` 그리고 `npm run test:visual` → 실패 0. 기준 이미지 수 = 64 + 32(비주얼 4 × 8). 출력 끝부분을 보고에 붙인다.
- [ ] **Step 2: 슬롭·디자인 검사** — Run: `node ~/.claude/skills/hallmark/scripts/sloplint.mjs css/site.css index.html --genre modern-minimal --scope app`, `impeccable detect --json js/diagrams.js css/site.css` → M5 때보다 새 경고 없음(있으면 고치거나 이유를 적는다).
- [ ] **Step 3: 대비(B9-3)** — 비주얼에 쓴 글자색/바탕 조합(칩 글자 `--color-ink` / `--color-paper-2`, key 라벨 `--color-accent-deep` / `--color-accent-wash`, 흐름 이름 `--color-ink-2` / `--color-surface`)을 라이트·다크 각각 계산 → 4.5:1 이상.
- [ ] **Step 4: 브라우저 검사(chrome-devtools-mcp)** — `http://127.0.0.1:8000/#/steps`, `#/design`, `#/final`: 콘솔 오류 0, Lighthouse 데스크톱·모바일 성능·접근성 90 이상.
- [ ] **Step 5: 스크린샷** — 비주얼 4곳 × 1440·768·375 × 라이트·다크(시각 테스트 기준 이미지 경로를 보고에 적는다) + 브라우저 탭 favicon(라이트·다크).
- [ ] **Step 6: 완료 기준 대조**(스펙 §8 M6)
  1. 비주얼 4개가 라이트·다크에서 보이고 375px에서 넘치지 않는다 → Task 5 + 시각 기준 이미지
  2. siteConfig 요약 문장을 한 글자 바꾸면 테스트가 실패한다 → Task 1 Step 2
  - 추가: OG 미리보기는 배포 뒤 카카오톡·슬랙에 링크를 붙여 확인한다 — 로컬에서는 확인할 수 없으므로 "확인 못 함"으로 적고, 병합 뒤 사용자 확인 항목으로 남긴다.
- [ ] **Step 7: 보고(B12 형식)** — 결과물, 아트 디렉션 한 줄씩, R 기록(Task 2·3·4·6), 검증 수치, 확인 못 한 것(실기기 Safari favicon, 메신저 OG). PR은 사용자 확인 뒤 만든다.
