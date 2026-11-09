// 도식 비주얼(js/diagrams.js): 실제 md와 고정 md 조각으로 builder를 바로 불러 본다(계획 M6 Task 2~4).
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { siteConfig, guideById } from '../../js/site-config.js';

const md = (id) => readFileSync(guideById(id).file, 'utf8');
const item = (type) => siteConfig.visuals.find((v) => v.type === type);

/** 빈 페이지에서 md를 #doc에 그리고, visualTypes[item.type](doc, guide, item)의 결과를 #out에 넣는다. */
async function build(page, text, guideId, it) {
  if (!page.url().endsWith('/tests/dom/blank.html')) await page.goto('/tests/dom/blank.html');
  return page.evaluate(async ([src, id, entry]) => {
    const { buildDoc } = await import('/js/md.js');
    const { guideById: byId } = await import('/js/site-config.js');
    const { visualTypes } = await import('/js/visuals.js');
    const guide = byId(id);
    const doc = buildDoc(guide, src);
    const slot = (sid, tag) => {
      let el = document.getElementById(sid);
      if (!el) {
        el = document.createElement(tag);
        el.id = sid;
        document.body.append(el);
      }
      return el;
    };
    const article = slot('doc', 'article');
    article.replaceChildren(doc.template.content.cloneNode(true));
    const out = slot('out', 'div');
    const el = visualTypes[entry.type](doc, guide, entry);
    out.replaceChildren(...(el ? [el] : []));
    return { ok: !!el, ids: [...article.querySelectorAll('[id]')].map((e) => e.id) };
  }, [text, guideId, it]);
}

test('steps flow: one link per stage with the code marks from the table', async ({ page }) => {
  const r = await build(page, md('steps'), 'steps', item('steps-flow'));
  expect(r.ok).toBe(true);
  await expect(page.locator('#out .flow__link')).toHaveCount(10);
  expect(await page.locator('#out .flow__step').evaluateAll((s) => s.map((x) => x.dataset.mark)))
    .toEqual(['none', 'none', 'none', 'part', 'none', 'full', 'full', 'full', 'full', 'full']);
  await expect(page.locator('#out .flow__step.is-key .flow__num')).toHaveText('4');
  await expect(page.locator('#out .flow')).toHaveAttribute('aria-labelledby', item('steps-flow').headingId);
  await expect(page.locator('#out .flow__legend')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#out .flow__legend')).toContainText(item('steps-flow').column);
});

test('design flow: [1]~[9] with [3] optional', async ({ page }) => {
  await build(page, md('design'), 'design', item('design-flow'));
  await expect(page.locator('#out .flow__link')).toHaveCount(9);
  await expect(page.locator('#out .flow__step.is-optional .flow__num')).toHaveText('3');
  await expect(page.locator('#out .flow__legend')).toHaveCount(0);
});

test('flow links keep their number in the accessible name', async ({ page }) => {
  await build(page, md('design'), 'design', item('design-flow'));
  await expect(page.locator('#out .flow__link').first()).toHaveAccessibleName('[1] 맥락 정리');
  await build(page, md('steps'), 'steps', item('steps-flow'));
  await expect(page.locator('#out .flow__link').first()).toHaveAccessibleName('1단계 범위 정의');
});

test('links point to headings in the doc', async ({ page }) => {
  for (const [id, type] of [['steps', 'steps-flow'], ['design', 'design-flow']]) {
    const r = await build(page, md(id), id, item(type));
    const targets = await page.locator('#out a').evaluateAll((as) => as.map((a) => decodeURIComponent(a.hash).split('/')));
    expect(targets.length).toBeGreaterThan(0);
    for (const [, g, h] of targets) {
      expect(g).toBe(id);
      expect(r.ids).toContain(h);
    }
    for (const a of await page.locator('#out a').all()) await expect(a).toHaveAttribute('data-smooth', '');
  }
});

test('steps flow returns null without its table', async ({ page }) => {
  const r = await build(page, '# T\n\n## 전체 흐름 한눈에 보기\n\n글만 있음.\n\n## 1단계. 범위 정의\n\n## 2단계. 구조 설계\n', 'steps', item('steps-flow'));
  expect(r.ok).toBe(false);
});

test('design flow returns null with fewer than two steps', async ({ page }) => {
  const r = await build(page, '# T\n\n## 1. 전체 흐름 한눈에 보기\n\n### [1] 하나 — s\n', 'design', item('design-flow'));
  expect(r.ok).toBe(false);
});

test('md text is inserted as text, not markup', async ({ page }) => {
  await build(page, '# T\n\n## 1. 전체 흐름 한눈에 보기\n\n## 2. 사용법\n\n### [1] a &lt;b&gt;x&lt;/b&gt; — s\n\n### [2] 둘 — s\n', 'design', item('design-flow'));
  await expect(page.locator('#out b')).toHaveCount(0);
  await expect(page.locator('#out .flow__name').first()).toContainText('<b>x</b>');
});

test('doc map groups files into stage lanes and marks the design source', async ({ page }) => {
  const r = await build(page, md('final'), 'final', item('doc-map'));
  expect(r.ok).toBe(true);
  expect(await page.locator('#out .docmap__num').allTextContents()).toEqual(['1~3', '4', '5', '6']);
  await expect(page.locator('#out .docmap__file')).toHaveCount(11);
  await expect(page.locator('#out .docmap__file.is-key')).toHaveCount(1);
  await expect(page.locator('#out .docmap__file.is-key')).toContainText('DESIGN.md');
  await expect(page.locator('#out .docmap__file.is-key .docmap__tag')).toHaveText('디자인 기준');
  await expect(page.locator('#out .docmap')).toHaveAttribute('aria-hidden', 'true');
  // 칸 머리 이름은 같은 문서의 단계 제목에서 온다
  await expect(page.locator('#out .docmap__head').nth(1)).toContainText('디자인 방향 고정');
});

test('doc map returns null without its table', async ({ page }) => {
  const r = await build(page, '# T\n\n## 2. 문서 지도 — 어떤 파일이 무엇의 기준인가\n\n표 없음.\n', 'final', item('doc-map'));
  expect(r.ok).toBe(false);
});

test('quick paths: one row per path, [n] steps link to their headings', async ({ page }) => {
  const r = await build(page, md('design'), 'design', item('quick-paths'));
  expect(r.ok).toBe(true);
  await expect(page.locator('#out .paths__row')).toHaveCount(5); // 6행 중 '→' 없는 메모 행 제외
  const first = page.locator('#out .paths__row').first();
  expect(await first.locator('.paths__step [aria-hidden]').allTextContents()).toEqual(['1', '2', '3', '4', '5', '6', '8', '9']);
  await expect(first.locator('.paths__text')).toHaveText(['hallmark']);
  await expect(first.locator('.paths__step').first()).toHaveAccessibleName('[1] 맥락 정리');
  await expect(page.locator('#out .paths__text', { hasText: '<경로>' })).toHaveCount(1); // 마크업이 아니라 글자
  const hs = await page.locator('#out a').evaluateAll((as) => as.map((a) => decodeURIComponent(a.hash).split('/')[2]));
  expect(hs.length).toBeGreaterThan(0);
  for (const h of hs) expect(r.ids).toContain(h);
  await expect(page.locator('#out .paths')).toHaveAttribute('aria-labelledby', item('quick-paths').headingId);
});

test('a step number without its heading stays as text', async ({ page }) => {
  await build(page, '# T\n\n## 3. 상황별 빠른 경로\n\n| 상황 | 순서 |\n|---|---|\n| 가 | [1] → [7] 없음 |\n\n### [1] 하나 — s\n', 'design', item('quick-paths'));
  await expect(page.locator('#out .paths__step')).toHaveCount(1);
  await expect(page.locator('#out .paths__text')).toHaveText(['[7] 없음']);
});

test('rows without a path are skipped and an empty table gives null', async ({ page }) => {
  const r = await build(page, '# T\n\n## 3. 상황별 빠른 경로\n\n| 상황 | 순서 |\n|---|---|\n| 메모 | (설명만) |\n', 'design', item('quick-paths'));
  expect(r.ok).toBe(false);
});

test('quick paths keep md code spans as code pieces', async ({ page }) => {
  await build(page, md('design'), 'design', item('quick-paths'));
  await expect(page.locator('#out .paths__code', { hasText: '/hallmark redesign <경로>' })).toHaveCount(1);
  await expect(page.locator('#out .paths__text', { hasText: '로 진단' }).locator('.paths__code')).toHaveText('/interfaces:better-interface');
});

test('a step with no code (✗) is drawn as a cross, never as the circle md uses for ○', async ({ page }) => {
  await build(page, md('steps'), 'steps', item('steps-flow'));
  await expect(page.locator('#out .flow__step[data-mark="none"] .flow__mark circle')).toHaveCount(0);
  await expect(page.locator('#out .flow__step[data-mark="none"] .flow__mark path')).not.toHaveCount(0);
  // 범례의 ✗ 옆 그림도 같은 ×
  await expect(page.locator('#out .flow__legend-key', { hasText: '✗' }).locator('circle')).toHaveCount(0);
  // 표시가 없는 흐름의 마디는 빈 원 그대로
  await build(page, md('design'), 'design', item('design-flow'));
  await expect(page.locator('#out .flow__step').first().locator('.flow__mark circle')).toHaveCount(1);
});

test('optional steps keep (선택) in their accessible name', async ({ page }) => {
  await build(page, md('design'), 'design', item('design-flow'));
  await expect(page.locator('#out .flow__step.is-optional .flow__link')).toHaveAccessibleName('[3] 시각 탐색 (선택)');
  await build(page, md('design'), 'design', item('quick-paths'));
  await expect(page.locator('#out .paths__step', { hasText: '3' }).first()).toHaveAccessibleName('[3] 시각 탐색 (선택)');
});

test('doc map keeps the full stage token when a file spans stages (5·7)', async ({ page }) => {
  await build(page, md('final'), 'final', item('doc-map'));
  await expect(page.locator('#out .docmap__file', { hasText: 'plans/' }).locator('.docmap__stage')).toHaveText('5·7');
  await expect(page.locator('#out .docmap__stage')).toHaveCount(1); // 칸 번호와 같은 파일에는 붙지 않는다
});
