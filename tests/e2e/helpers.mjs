// e2e·시각 테스트 공용: 사이트맵 목록과 페이지 준비.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteConfig } from '../../js/site-config.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const firstHeading = (file) => readFileSync(file, 'utf8').match(/^# (.+)$/m)[1].trim();

export const pages = [
  { name: 'home', path: '/#/', h1: siteConfig.site.name },
  ...siteConfig.guides.map((g) => ({ name: g.id, path: `/#/${g.id}`, h1: firstHeading(g.file) })),
  { name: 'notfound', path: '/#/no-such-page', h1: siteConfig.ui.notFoundTitle },
  { name: '404', path: '/404.html', h1: siteConfig.ui.pageNotFoundTitle },
];

export async function openPage(page, path) {
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  if (/^\/#\/(final|steps|design)/.test(path)) await page.locator('.doc:not([aria-busy])').waitFor();
  // 홈 단계 자: md를 받는 동안 스켈레톤이 보인다. 사라지면(성공) 또는 숨겨지면(실패) 다 그려진 것이다.
  if (path === '/#/') await page.locator('.ruler-skeleton').waitFor({ state: 'hidden' });
}

// 배포 주소(하위 경로 /<저장소>/)를 흉내 낸다: 그 주소의 요청을 이 저장소 파일로 답하고, 없으면 GitHub Pages처럼 404.html을 404로 준다.
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.md': 'text/markdown; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json' };
export async function serveAsPages(page) {
  const site = new URL(siteConfig.site.url);
  await page.route(`${site.origin}/**`, async (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname);
    let rel = path.startsWith(site.pathname) ? path.slice(site.pathname.length) : null;
    if (rel === '' || rel?.endsWith('/')) rel += 'index.html';
    const file = rel && join(root, rel);
    if (file && existsSync(file) && statSync(file).isFile()) {
      return route.fulfill({ status: 200, body: readFileSync(file), contentType: types[extname(file)] ?? 'application/octet-stream' });
    }
    return route.fulfill({ status: 404, body: readFileSync(join(root, '404.html')), contentType: 'text/html' });
  });
}

/** requestAnimationFrame 두 번: 스크롤 뒤 rAF로 미룬 갱신이 끝날 때까지 기다린다. */
export const twoFrames = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

/** 목차 링크의 제목 id(문서 순서). 한글 id를 하드코딩하지 않고 화면에서 읽는다. */
export const tocIds = (page) => page.locator('#toc a[data-toc-id]').evaluateAll((as) => as.map((a) => a.dataset.tocId));
