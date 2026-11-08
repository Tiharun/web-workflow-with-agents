import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { siteConfig } from '../../js/site-config.js';

test('site identity', () => {
  assert.equal(siteConfig.site.name, '웹사이트 제작 워크플로우');
  assert.equal(siteConfig.site.repoUrl, 'https://github.com/Tiharun/web-workflow-with-agents');
});

test('guide ids are unique lowercase words', () => {
  const ids = siteConfig.guides.map((g) => g.id);
  assert.deepEqual(ids, ['final', 'steps', 'design']);
  assert.equal(new Set(ids).size, ids.length);
});

test('every guide file exists and download name ends with .md', () => {
  for (const g of siteConfig.guides) {
    assert.ok(existsSync(g.file), g.file);
    assert.match(g.downloadName, /\.md$/);
  }
});

test('every visual points at a known guide', () => {
  const ids = new Set(siteConfig.guides.map((g) => g.id));
  for (const v of siteConfig.visuals) assert.ok(ids.has(v.guideId), v.guideId);
});
