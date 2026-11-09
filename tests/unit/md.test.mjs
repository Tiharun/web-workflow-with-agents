import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../../js/md.js';

test('slugify follows GitHub heading ids', () => {
  assert.equal(slugify('3. 단계별 진행과 프롬프트'), '3-단계별-진행과-프롬프트');
  assert.equal(slugify('Hello, World!'), 'hello-world');
  assert.equal(slugify('  a  b_c '), 'a--b_c');
  assert.equal(slugify('!!!'), '');
});
