// e2e·시각 테스트 공용: 사이트맵 목록과 페이지 준비.
import { readFileSync } from 'node:fs';
import { siteConfig } from '../../js/site-config.js';

const firstHeading = (file) => readFileSync(file, 'utf8').match(/^# (.+)$/m)[1].trim();

export const pages = [
  { name: 'home', path: '/#/', h1: siteConfig.site.name },
  ...siteConfig.guides.map((g) => ({ name: g.id, path: `/#/${g.id}`, h1: firstHeading(g.file) })),
  { name: 'notfound', path: '/#/no-such-page', h1: siteConfig.ui.notFoundTitle },
  // 정적 HTML이라 문자열을 그대로 둔다. siteConfig 일치 검사는 M1.
  { name: '404', path: '/404.html', h1: '찾을 수 없는 페이지입니다' },
];

export async function openPage(page, path) {
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  if (/^\/#\/(final|steps|design)/.test(path)) await page.locator('.doc:not([aria-busy])').waitFor();
  // 홈 단계 자: md를 받는 동안 스켈레톤이 보인다. 사라지면(성공) 또는 숨겨지면(실패) 다 그려진 것이다.
  if (path === '/#/') await page.locator('.ruler-skeleton').waitFor({ state: 'hidden' });
}
