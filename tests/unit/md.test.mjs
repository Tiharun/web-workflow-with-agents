import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, rewriteHref } from '../../js/md.js';
import { guideById } from '../../js/site-config.js';

test('slugify follows GitHub heading ids', () => {
  assert.equal(slugify('3. 단계별 진행과 프롬프트'), '3-단계별-진행과-프롬프트');
  assert.equal(slugify('Hello, World!'), 'hello-world');
  assert.equal(slugify('  a  b_c '), 'a--b_c');
  assert.equal(slugify('!!!'), '');
});

const final = guideById('final');
const r = (href) => rewriteHref(href, final);

test('external links are marked', () => {
  assert.deepEqual(r('https://github.com/obra/superpowers'), { href: 'https://github.com/obra/superpowers', external: true });
  assert.equal(r('HTTP://example.com').external, true);
});
test('legacy guide file names become site routes', () => {
  assert.deepEqual(r('웹사이트%20제작%20순서.md'), { href: '#/steps', external: false });
  assert.deepEqual(r('./content/design-skills.md'), { href: '#/design', external: false });
});
test('guide link with fragment keeps the heading id', () => {
  assert.deepEqual(r('웹사이트%20제작%20순서.md#1단계-목적'), { href: '#/steps/1단계-목적', external: false });
});
test('fragment-only links stay in the current guide', () => {
  assert.deepEqual(r('#출시-게이트'), { href: '#/final/출시-게이트', external: false });
});
test('other links are left alone', () => {
  for (const h of ['mailto:a@b.c', 'GLOSSARY.md', '%E0%A4%A.md']) assert.deepEqual(r(h), { href: h, external: false });
});
