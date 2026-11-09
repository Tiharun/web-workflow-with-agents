// siteConfig로 옮긴 원문이 md에 글자 그대로 있는지(스펙 §2-3 원본 문장 불변, M6).
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
