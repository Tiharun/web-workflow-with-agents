import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siteConfig } from '../../js/site-config.js';
import { footerHtml } from '../../js/footer.js';

const html = footerHtml(siteConfig);
test('footer shows site name linking home', () => {
  assert.match(html, /<a class="brand" href="#\/">웹사이트 제작 워크플로우<\/a>/);
});
test('footer lists the three guides in config order', () => {
  const hrefs = [...html.matchAll(/class="site-footer__link" href="(#\/[a-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(hrefs, ['#/final', '#/steps', '#/design']);
  for (const g of siteConfig.guides) assert.ok(html.includes(`>${g.menuLabel}<`));
});
test('repo link opens in a new tab and says so', () => {
  assert.match(html, /href="https:\/\/github\.com\/Tiharun\/web-workflow-with-agents" target="_blank" rel="noopener noreferrer">GitHub 저장소<span class="visually-hidden"> \(새 탭\)<\/span>/);
});
test('footer has no license or source notice', () => {
  assert.doesNotMatch(html, /라이선스|License|©|출처/);
});
