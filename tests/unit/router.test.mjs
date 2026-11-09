import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../../js/router.js';
import { guideById } from '../../js/site-config.js';

const final = guideById('final');
const guide = (stageId) => ({ name: 'guide', guide: final, stageId });

test('empty and root hashes are home', () => {
  for (const h of ['', '#', '#/', '#//']) assert.deepEqual(parse(h), { name: 'home' }, h);
});
test('guide id alone opens the guide top', () => {
  for (const h of ['#/final', '#/final/', '#final']) assert.deepEqual(parse(h), guide(null), h);
});
test('stage id is decoded', () => {
  assert.deepEqual(parse('#/final/0%EB%8B%A8%EA%B3%84-%EC%A4%80%EB%B9%84'), guide('0단계-준비'));
  assert.deepEqual(parse('#/final/0단계-준비'), guide('0단계-준비'));
});
test('extra segments stay in the stage id', () => {
  assert.deepEqual(parse('#/final/a/b'), guide('a/b'));
  assert.deepEqual(parse('#/final//x'), guide('x'));
});
test('unknown or differently cased guide id is not found', () => {
  for (const h of ['#/nope', '#/FINAL', '#/없는주소']) assert.deepEqual(parse(h), { name: 'notfound' }, h);
});
test('broken percent-encoding does not throw', () => {
  assert.deepEqual(parse('#/final/%E0%A4%A'), guide('%E0%A4%A'));
  assert.deepEqual(parse('#/%E0%A4%A'), { name: 'notfound' });
});
