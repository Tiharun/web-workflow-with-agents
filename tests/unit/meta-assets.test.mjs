// favicon·OG 그림(npm run images가 만든다): 선언한 크기, favicon 색은 두 테마의 accent 토큰 값.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { siteConfig } from '../../js/site-config.js';

const { site } = siteConfig;
const png = (f) => { const b = readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; }; // IHDR 너비·높이

test('meta images have their declared sizes', () => {
  assert.deepEqual(png(site.icons.png), [32, 32]);
  assert.deepEqual(png(site.icons.apple), [180, 180]);
  assert.deepEqual(png(site.ogImage), [1200, 630]);
});

test('favicon colors are the accent tokens of both themes', () => {
  const tokens = readFileSync('css/tokens.css', 'utf8');
  const val = (name, nth) => [...tokens.matchAll(new RegExp(`--${name}: (#[0-9a-f]{6})`, 'gi'))][nth][1].toLowerCase();
  const want = new Set([val('color-accent', 0), val('color-accent-ink', 0), val('color-accent', 1), val('color-accent-ink', 1)]);
  const got = new Set(readFileSync(site.icons.svg, 'utf8').match(/#[0-9a-f]{6}/gi).map((h) => h.toLowerCase()));
  assert.deepEqual(got, want);
});
