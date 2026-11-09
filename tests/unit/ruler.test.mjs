import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStage, stagesFromDoc } from '../../js/ruler.js';
import { siteConfig } from '../../js/site-config.js';

test('parseStage reads number, short name and the key mark', () => {
  assert.deepEqual(parseStage('4단계. 디자인 방향 고정 ★ 가장 중요'), { num: '4', name: '디자인 방향 고정', key: true });
  assert.deepEqual(parseStage('1~3단계. 결정 — `/grill-with-docs`'), { num: '1~3', name: '결정', key: false });
  assert.deepEqual(parseStage('7단계. 기능 마일스톤 루프 (M1~Mn, 마일스톤마다 새 세션)'), { num: '7', name: '기능 마일스톤 루프', key: false });
  assert.deepEqual(parseStage('출시 게이트'), { num: null, name: '출시 게이트', key: false });
});

const h = (id, title, level, parentId) => ({ id, title, level, parentId });
const parent = siteConfig.ruler.parentTitle;

test('stagesFromDoc takes only the children of the ruler parent', () => {
  const doc = { headings: [
    h('a', '1. 전체 루프 한눈에', 2, 'top'),
    h('a1', '0단계. 다른 장', 3, 'a'),
    h('p', parent, 2, 'top'),
    h('s0', '0단계. 준비', 3, 'p'),
    h('s0-1', '세부', 4, 's0'),
    h('g', '출시 게이트', 3, 'p'),
  ] };
  assert.deepEqual(stagesFromDoc(doc).map((s) => [s.id, s.num]), [['s0', '0'], ['g', null]]);
});

test('stagesFromDoc returns [] when the parent heading is missing', () => {
  assert.deepEqual(stagesFromDoc({ headings: [h('x', '다른 제목', 2, 'top')] }), []);
});
