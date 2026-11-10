// 두 HTML 진입점은 아이콘을 선언한다(없으면 브라우저가 /favicon.ico를 요청해 404가 콘솔 오류로 남는다).
// 주소는 siteConfig.site.icons와 같아야 하고, 404.html은 깊은 경로에서도 맞도록 배포 주소 기준 절대 주소다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
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

// CSS는 @import 사슬 없이 세 파일을 이 순서로 바로 연결한다(@import는 site.css를 받은 뒤에야 다음 파일을 요청해 첫 그림이 늦다).
const CSS = ['css/tokens.css', 'css/base.css', 'css/site.css'];
const cssHrefs = (text) => [...text.matchAll(/<link rel="stylesheet" href="([^"]*css\/(?:tokens|base|site)\.css)">/g)].map((m) => m[1]);

test('stylesheets are linked directly in order, without @import', () => {
  assert.deepEqual(cssHrefs(readFileSync('index.html', 'utf8')), CSS);
  const nf = readFileSync('404.html', 'utf8');
  const [script, noscript] = nf.split('<noscript>');
  assert.deepEqual(cssHrefs(script), CSS);
  assert.deepEqual(cssHrefs(noscript), CSS.map((p) => site.url + p));
  assert.doesNotMatch(readFileSync('css/site.css', 'utf8'), /@import/);
});

// main.js의 정적 import 그래프를 모두 미리 받는다(깊은 사슬은 단계마다 왕복이 하나씩 늘어 첫 그림이 늦다).
// 동적 import(GSAP)는 필요할 때 받으므로 넣지 않는다. 목록은 그래프와 정확히 같아야 한다(빠지거나 남지 않게).
const staticGraph = (entry) => {
  const seen = new Set();
  const walk = (file) => {
    for (const m of readFileSync(file, 'utf8').matchAll(/^\s*import\s[^;]*?from\s+['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]/gm)) {
      const dep = posix.normalize(posix.join(posix.dirname(file), m[1] ?? m[2]));
      if (!seen.has(dep)) { seen.add(dep); walk(dep); }
    }
  };
  walk(entry);
  return seen;
};

test('index.html modulepreloads exactly the static module graph of main.js', () => {
  const preloads = hrefs(readFileSync('index.html', 'utf8'), 'modulepreload');
  assert.deepEqual(new Set(preloads), staticGraph('js/main.js'));
  assert.equal(preloads.length, new Set(preloads).size);
});
