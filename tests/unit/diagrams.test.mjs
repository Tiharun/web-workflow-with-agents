import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseBracket } from '../../js/diagrams.js';

test('parseBracket reads number, name and the optional mark', () => {
  assert.deepEqual(parseBracket('[3] 시각 탐색 (선택) — playground'), { num: '3', name: '시각 탐색', optional: true });
  assert.deepEqual(parseBracket('[1] 맥락 정리 — impeccable init'), { num: '1', name: '맥락 정리', optional: false });
  assert.deepEqual(parseBracket('[9] 출시 전 마감'), { num: '9', name: '출시 전 마감', optional: false });
  assert.equal(parseBracket('0. 핵심 원칙 5가지'), null);
});

// 다크 모드에서도 보이게 SVG·도식은 currentColor와 CSS 토큰으로만 칠한다(스펙 §2-1).
test('diagrams.js has no color literals', () => {
  assert.doesNotMatch(readFileSync('js/diagrams.js', 'utf8'), /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);
});
