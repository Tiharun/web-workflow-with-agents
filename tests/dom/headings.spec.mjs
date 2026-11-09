import { test, expect } from '@playwright/test';
import { render } from './helpers.mjs';

test('heading ids, parents and title', async ({ page }) => {
  const doc = await render(page, '# 제목\n\n## 1. 시작\n\n### 할 일\n\n## 2. 끝!\n\n### 할 일\n');
  expect(doc.title).toBe('제목');
  expect(doc.headings).toEqual([
    { id: '제목', title: '제목', level: 1, parentId: null },
    { id: '1-시작', title: '1. 시작', level: 2, parentId: null },
    { id: '할-일', title: '할 일', level: 3, parentId: '1-시작' },
    { id: '2-끝', title: '2. 끝!', level: 2, parentId: null },
    { id: '할-일-1', title: '할 일', level: 3, parentId: '2-끝' },
  ]);
  await expect(page.locator('#doc h3').nth(1)).toHaveAttribute('id', '할-일-1');
});

test('heading ids never collide', async ({ page }) => {
  const a = await render(page, '## a\n\n## a\n\n## a-1\n');
  expect(a.headings.map((h) => h.id)).toEqual(['a', 'a-1', 'a-1-1']);
  const b = await render(page, '## a\n\n## a-1\n\n## a\n');
  expect(b.headings.map((h) => h.id)).toEqual(['a', 'a-1', 'a-2']);
});

test('stages follow the guide stageRule', async ({ page }) => {
  const md = '# T\n\n## 1. 루프\n\n### x\n\n## 3. 단계별 진행과 프롬프트\n\n### 0단계\n\n### 1단계\n';
  const final = await render(page, md, 'final');
  expect(final.stages.map((s) => [s.id, s.children.map((c) => c.id)])).toEqual([
    ['1-루프', []],
    ['3-단계별-진행과-프롬프트', ['0단계', '1단계']],
  ]);
  const steps = await render(page, md, 'steps');
  expect(steps.stages.every((s) => s.children.length === 0)).toBe(true);
});

test('title falls back to menuLabel without h1', async ({ page }) => {
  expect((await render(page, '## 장\n', 'design')).title).toBe('디자인 스킬 워크플로우');
});

test('stageRule picks level-2 stages and expands only listed chapters', async ({ page }) => {
  const md = '# T\n\n## 1. 개요\n\n### 가\n\n## 3. 단계별 진행과 프롬프트\n\n### 0단계\n\n### 1단계\n\n#### 세부\n';
  const { stages } = await render(page, md, 'final');
  expect(stages.map((s) => s.id)).toEqual(['1-개요', '3-단계별-진행과-프롬프트']);
  expect(stages[0].children).toEqual([]);
  expect(stages[1].children.map((c) => c.id)).toEqual(['0단계', '1단계']);
  expect((await render(page, md, 'steps')).stages.every((s) => s.children.length === 0)).toBe(true);
  expect((await render(page, '# T\n\n### 가\n', 'steps')).stages).toEqual([]);
});
