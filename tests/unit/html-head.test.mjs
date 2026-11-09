// 두 HTML 진입점은 아이콘을 선언한다(없으면 브라우저가 /favicon.ico를 요청해 404가 콘솔 오류로 남는다).
// 주소는 siteConfig.site.icons와 같아야 하고, 404.html은 깊은 경로에서도 맞도록 배포 주소 기준 절대 주소다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { siteConfig } from '../../js/site-config.js';

const { site } = siteConfig;
const hrefs = (html, rel) => [...html.matchAll(new RegExp(`<link rel="${rel}" href="([^"]+)"`, 'g'))].map((m) => m[1]);

test('index.html icons match siteConfig', () => {
  const html = readFileSync('index.html', 'utf8');
  assert.deepEqual(hrefs(html, 'icon'), [site.icons.svg, site.icons.png]);
  assert.deepEqual(hrefs(html, 'apple-touch-icon'), [site.icons.apple]);
});

test('404.html icons are absolute site urls', () => {
  const html = readFileSync('404.html', 'utf8');
  assert.deepEqual(hrefs(html, 'icon'), [site.url + site.icons.svg, site.url + site.icons.png]);
  assert.deepEqual(hrefs(html, 'apple-touch-icon'), [site.url + site.icons.apple]);
});
