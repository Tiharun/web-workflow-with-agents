// 비주얼 배치(js/visuals.js): 고정 md 조각과 실제 md로 placeVisuals를 돌려 본다(스펙 §3·§5, 계획 M5 Task 2).
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { siteConfig, guideById } from '../../js/site-config.js';

/**
 * 빈 페이지에서 md를 변환해 #doc에 넣고 placeVisuals(list)를 부른다.
 * 시험용 type: boom(던짐), a·b(<div data-mark>), svg(<svg>), text(요소가 아닌 값). reportError로 온 전역 error 이벤트를 모은다.
 */
async function place(page, md, guideId, list) {
  if (!page.url().endsWith('/tests/dom/blank.html')) await page.goto('/tests/dom/blank.html');
  return page.evaluate(async ([text, id, items]) => {
    const { buildDoc } = await import('/js/md.js');
    const { guideById: byId } = await import('/js/site-config.js');
    const { visualTypes, placeVisuals } = await import('/js/visuals.js');
    const guide = byId(id);
    const doc = buildDoc(guide, text);
    let article = document.getElementById('doc');
    if (!article) {
      article = document.createElement('article');
      article.id = 'doc';
      document.body.append(article);
    }
    article.replaceChildren(doc.template.content.cloneNode(true));
    const textOf = () => {
      const c = article.cloneNode(true);
      c.querySelectorAll('.visual').forEach((f) => f.remove());
      return c.textContent;
    };
    const textBefore = textOf();

    const mark = (m) => () => {
      const d = document.createElement('div');
      d.dataset.mark = m;
      return d;
    };
    const extra = {
      boom: () => { throw new Error('boom'); },
      a: mark('a'),
      b: mark('b'),
      svg: () => document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
      text: () => 'not an element',
    };
    const errors = [];
    const onError = (e) => { errors.push(e.error?.message); e.preventDefault(); };
    window.addEventListener('error', onError);
    Object.assign(visualTypes, extra);
    try {
      placeVisuals(article, guide, doc, items);
    } finally {
      for (const k of Object.keys(extra)) delete visualTypes[k];
      window.removeEventListener('error', onError);
    }
    const visuals = [...article.querySelectorAll('.visual')].map((f) => {
      const p = f.previousElementSibling;
      const c = f.firstElementChild;
      return { prev: p?.id || 'figure', inner: c?.dataset.mark ?? c?.getAttribute('class') ?? c?.localName };
    });
    return { visuals, textBefore, textAfter: textOf(), errors };
  }, [md, guideId, list]);
}

// 고정 md: 제목 id는 siteConfig와 같은 GitHub 방식 slug가 된다.
const MD = `# 시험 가이드

## 1. 전체 루프 한눈에

루프 설명 문단.

## ${siteConfig.ruler.parentTitle}

### 0단계. 준비

### 4단계. 디자인 방향 고정 ★ 가장 중요

### 출시 게이트
`;
const v = siteConfig.visuals.find((x) => x.type === 'stage-ruler');
const at = (headingId, type, guideId = 'final') => ({ guideId, headingId, type });

test('the stage ruler sits right after its heading', async ({ page }) => {
  const r = await place(page, MD, 'final', [v]);
  expect(r.visuals).toEqual([{ prev: v.headingId, inner: 'ruler ruler--auto' }]);
  await expect(page.locator(`#doc .visual .ruler__stop`)).toHaveCount(3);
  expect(r.textAfter).toBe(r.textBefore);
  expect(r.errors).toEqual([]);
});

test('a missing heading hides only that visual without an error', async ({ page }) => {
  const r = await place(page, MD, 'final', [at('no-such-heading', 'stage-ruler'), v]);
  expect(r.visuals.map((x) => x.prev)).toEqual([v.headingId]);
  expect(r.textAfter).toBe(r.textBefore);
  expect(r.errors).toEqual([]);
});

test('an unknown type is reported', async ({ page }) => {
  const r = await place(page, MD, 'final', [at(v.headingId, 'no-such-type'), v]);
  expect(r.visuals.map((x) => x.inner)).toEqual(['ruler ruler--auto']);
  expect(r.errors).toEqual(['알 수 없는 비주얼 종류: no-such-type']);
});

test('a ruler on another guide is not drawn', async ({ page }) => {
  const r = await place(page, MD, 'steps', [at(v.headingId, 'stage-ruler', 'steps')]);
  expect(r.visuals).toEqual([]);
  expect(r.errors).toEqual([]);
});

test('a throwing builder is reported and skips only that visual', async ({ page }) => {
  const r = await place(page, MD, 'final', [at(v.headingId, 'boom'), at(v.headingId, 'a')]);
  expect(r.visuals.map((x) => x.inner)).toEqual(['a']);
  expect(r.errors).toEqual([`비주얼을 그리지 못함: boom → #${v.headingId}`]);
});

test('an svg visual is recognised as rendered', async ({ page }) => {
  const r = await place(page, MD, 'final', [at(v.headingId, 'svg')]);
  expect(r.visuals).toEqual([{ prev: v.headingId, inner: 'svg' }]);
});

test('an inherited object key is not a visual type', async ({ page }) => {
  const r = await place(page, MD, 'final', [at(v.headingId, 'toString'), at(v.headingId, 'constructor')]);
  expect(r.visuals).toEqual([]);
  expect(r.textAfter).toBe(r.textBefore);
  expect(r.errors).toEqual(['알 수 없는 비주얼 종류: toString', '알 수 없는 비주얼 종류: constructor']);
});

test('a builder returning a non-element is reported and adds no text', async ({ page }) => {
  const r = await place(page, MD, 'final', [at(v.headingId, 'text')]);
  expect(r.visuals).toEqual([]);
  expect(r.textAfter).toBe(r.textBefore);
  expect(r.errors).toEqual([`비주얼을 그리지 못함: text → #${v.headingId}`]);
});

test('visuals on one heading keep their configured order', async ({ page }) => {
  const r = await place(page, MD, 'final', [at(v.headingId, 'a'), at(v.headingId, 'b')]);
  expect(r.visuals).toEqual([{ prev: v.headingId, inner: 'a' }, { prev: 'figure', inner: 'b' }]);
});

// 배포 전 관문: 실제 md로 등록된 비주얼을 하나씩 그려 본다. md 제목 변경·builder의 null·예외를 모두 여기서 잡는다.
test('every configured visual renders on its guide', async ({ page }) => {
  for (const x of siteConfig.visuals) {
    const g = guideById(x.guideId);
    const r = await place(page, readFileSync(g.file, 'utf8'), x.guideId, [x]);
    expect(r.visuals, `${x.guideId}#${x.headingId} (${x.type})`).toEqual([{ prev: x.headingId, inner: expect.any(String) }]);
    expect(r.errors, `${x.guideId}#${x.headingId} (${x.type})`).toEqual([]);
  }
});
