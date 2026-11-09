import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visualTypes } from '../../js/visuals.js';
import { siteConfig } from '../../js/site-config.js';

test('every configured type is registered', () => {
  for (const v of siteConfig.visuals) assert.equal(typeof visualTypes[v.type], 'function', v.type);
});

test('stage-ruler only targets the ruler guide', () => {
  for (const v of siteConfig.visuals.filter((x) => x.type === 'stage-ruler')) assert.equal(v.guideId, siteConfig.ruler.guideId);
});
