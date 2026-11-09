// 두 HTML 진입점은 아이콘을 선언한다. 없으면 브라우저가 /favicon.ico를 요청해 404가 콘솔 오류로 남는다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

for (const file of ['index.html', '404.html']) {
  test(`${file} declares an icon so the browser never requests /favicon.ico`, () => {
    assert.match(readFileSync(file, 'utf8'), /<link rel="icon" href="[^"]+">/);
  });
}
