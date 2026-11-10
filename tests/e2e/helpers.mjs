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
  // 본문 블록의 실제 높이를 다 재 두면(data-sized) 문서 길이가 확정된다. 화면 밖 블록은 그 전까지 추정 높이다.
  if (/^\/#\/(final|steps|design)/.test(path)) await page.locator('.doc[data-sized]').waitFor({ state: 'attached' });
  // 홈 단계 자: md를 받는 동안 스켈레톤이 보인다. 사라지면(성공) 또는 숨겨지면(실패) 다 그려진 것이다.
  if (path === '/#/') await page.locator('.ruler-skeleton').waitFor({ state: 'hidden' });
}

// 배포 주소(하위 경로 /<저장소>/)를 흉내 낸다: 그 주소의 요청을 이 저장소 파일로 답하고, 없으면 GitHub Pages처럼 404.html을 404로 준다.
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.md': 'text/markdown; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
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

/**
 * 검사할 화면 9종: 사이트맵 6개 + 열린 상태 4개(메뉴·목차·md 오류·툴팁). 접근성·넘침·누르는 영역 검사가 함께 쓴다.
 * 메뉴는 768px 이상이면 메가메뉴, 미만이면 햄버거 → 아코디언(시각 테스트 'menu open'과 같은 절차).
 */
export const screens = [
  ...pages.map((p) => ({ name: p.name, open: (page) => openPage(page, p.path) })),
  { name: 'menu-open', open: async (page) => {
    await openPage(page, '/#/final');
    if (page.viewportSize().width >= 768) {
      await page.locator('.guide-nav__btn[data-guide="final"]').click();
      await page.locator('#mega-final .mega__stage').first().waitFor();
    } else {
      await page.locator('.nav-toggle').click();
      await page.locator('.acc__btn[data-guide="final"]').click();
      await page.locator('#acc-final .acc__link--sub').first().waitFor();
    }
  } },
  { name: 'toc-open', open: async (page) => {
    await openPage(page, '/#/final');
    await page.locator('[data-toc-open]').click();
    await page.locator('#toc[open]').waitFor();
    // 서랍은 slide-in 애니메이션으로 들어온다. 끝나기 전에 재면 화면 왼쪽 밖에 있다(측정).
    await page.locator('#toc').evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
  } },
  { name: 'md-error', open: async (page) => {
    await page.route('**/content/final-workflow.md', (r) => r.abort());
    await page.goto('/#/final');
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole('alert').waitFor();
  } },
  { name: 'tooltip-open', open: async (page) => {
    await openPage(page, '/#/final');
    await page.locator('#doc .term').first().focus();
    await page.locator('.tooltip').waitFor();
  } },
];

/**
 * 글자 대비(WCAG 1.4.3) 실패 목록. axe는 배경에 그라데이션이 있으면 판정을 보류해서(final 본문 420개, 측정) 직접 잰다.
 * 배경은 추측하지 않고 실제 픽셀로 잰다: 글자만 투명하게 한 화면을 찍어, 글자 자리의 배경 픽셀 중
 * 밝은 쪽·어두운 쪽(5·95 백분위)과 글자색의 대비를 본다. 다른 요소에 가린 글자(고정 머리말 아래 등)는 뺀다.
 * scroll이 참이면 문서를 화면 높이씩 내려가며 전부 잰다. 열린 상태(메뉴·목차·툴팁)는 첫 화면만 잰다.
 * 기준: 4.5:1, 큰 글자(24px 이상, 또는 18.66px 이상 굵기 700 이상)는 3:1.
 */
export async function contrastFailures(page, { scroll = true } = {}) {
  const failures = new Set();
  const vh = page.viewportSize().height;
  // 반 화면씩 내려가야 화면 경계·고정 막대에 걸린 줄도 어느 한 단계에서는 온전히 보인다.
  const step = Math.floor(vh / 2);
  const steps = scroll ? Math.ceil(await page.evaluate(() => document.documentElement.scrollHeight) / step) : 1;
  for (let i = 0; i < steps; i++) {
    if (scroll) { await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), i * step); await twoFrames(page); }
    const targets = await page.evaluate(collectTextTargets);
    if (!targets.length) continue;
    const hide = await page.addStyleTag({ content: '*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }' });
    const png = await page.screenshot({ scale: 'css', animations: 'disabled', caret: 'hide' });
    await hide.evaluate((n) => n.remove());
    for (const f of await page.evaluate(sampleContrast, { png: png.toString('base64'), targets })) failures.add(f);
  }
  return [...failures].slice(0, 20);
}

// 브라우저 안: 화면 안에 다 보이고 가려지지 않은 글자 요소의 줄 사각형·글자색·기준.
function collectTextTargets() {
  const out = [];
  const label = (el, text, where) => `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : ''}${where} "${text.slice(0, 18)}"`;
  const large = (s) => { const px = parseFloat(s.fontSize); return px >= 24 || (px >= 18.66 && Number(s.fontWeight) >= 700); };
  // 고정·sticky 막대(머리말, 좌측 도구 등): 그 아래로 지나가는 글자는 가려져 있다. elementFromPoint만으로는 놓친다(측정).
  const bars = [...document.querySelectorAll('body *')].filter((e) => /fixed|sticky/.test(getComputedStyle(e).position) && e.checkVisibility({ visibilityProperty: true }))
    .map((e) => [e, e.getBoundingClientRect()]);
  const covered = (el, r) => bars.some(([b, br]) => !b.contains(el) && r.left < br.right && r.right > br.left && r.top < br.bottom && r.bottom > br.top);
  const add = (el, s, text, where, rects) => {
    const lines = rects.filter((r) => r.width > 2 && r.height > 2 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth)
      .filter((r) => !covered(el, r))
      .filter((r) => { const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return hit && (el === hit || el.contains(hit)); })
      .map((r) => [r.left, r.top, r.width, r.height]);
    if (lines.length) out.push({ label: label(el, text, where), color: s.color, need: large(s) ? 3 : 4.5, lines });
  };
  for (const el of document.querySelectorAll('body *')) {
    if (!el.checkVisibility({ visibilityProperty: true, opacityProperty: true })) continue;
    const box = el.getBoundingClientRect();
    if (box.width <= 1 || box.height <= 1 || box.bottom < 0 || box.top > innerHeight) continue; // 화면 밖, 낭독기 전용 글
    const s = getComputedStyle(el);
    const texts = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    if (texts.length) {
      const range = document.createRange();
      const rects = texts.flatMap((n) => { range.selectNodeContents(n); return [...range.getClientRects()]; });
      add(el, s, texts.map((n) => n.textContent).join('').trim(), '', rects);
    }
    for (const p of ['::before', '::after']) {
      const ps = getComputedStyle(el, p);
      if (/^["'].+["']$/.test(ps.content)) add(el, ps, ps.content.slice(1, -1), p, [box]);
    }
  }
  return out;
}

// 브라우저 안: 글자를 지운 화면에서 각 줄 사각형의 배경 픽셀을 읽어 대비를 잰다.
async function sampleContrast({ png, targets }) {
  const img = new Image();
  img.src = `data:image/png;base64,${png}`;
  await img.decode();
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgba = (c) => { probe.clearRect(0, 0, 1, 1); probe.fillStyle = '#000'; probe.fillStyle = c; probe.fillRect(0, 0, 1, 1); const d = probe.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const fails = [];
  for (const t of targets) {
    const [r, g, b, a] = rgba(t.color);
    const px = [];
    for (const [x, y, w, h] of t.lines) {
      const x0 = Math.round(x) + 1, y0 = Math.round(y) + 1, ww = Math.max(1, Math.round(w) - 2), hh = Math.max(1, Math.round(h) - 2);
      const d = ctx.getImageData(x0, y0, ww, hh).data;
      for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]);
    }
    if (!px.length) continue;
    px.sort((p, q) => lum(p) - lum(q));
    const bgs = [px[Math.floor(px.length * 0.05)], px[Math.floor(px.length * 0.95)]];
    const worst = Math.min(...bgs.map((bg) => ratio([r * a + bg[0] * (1 - a), g * a + bg[1] * (1 - a), b * a + bg[2] * (1 - a)], bg)));
    if (worst < t.need - 0.01) fails.push(`${t.label} ${worst.toFixed(2)} < ${t.need}`);
  }
  return fails;
}

/**
 * 가로로 넘친 요소 목록(최대 10개, '태그.클래스 left..right').
 * html·body가 overflow-x: clip이라 문서 폭으로는 넘침이 드러나지 않는다(pages.spec 'footer does not overflow').
 * 그래서 보이는 요소마다 좌우 끝을 잰다. 뷰포트 안에 있는 스크롤·클립 조상(표·도식 상자)이 잘라 주는 요소는 넘침이 아니다.
 */
export const overflowing = (page) => page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const inside = (r) => r.left >= -0.5 && r.right <= vw + 0.5;
  const out = new Set();
  for (const el of document.querySelectorAll('body *')) {
    if (!el.checkVisibility({ visibilityProperty: true })) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || inside(r)) continue;
    let clipped = false;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (getComputedStyle(p).overflowX !== 'visible' && inside(p.getBoundingClientRect())) { clipped = true; break; }
    }
    if (!clipped) out.add(`${el.tagName}.${typeof el.className === 'string' ? el.className.split(' ')[0] : ''} ${Math.round(r.left)}..${Math.round(r.right)}`);
  }
  return [...out].slice(0, 10);
});

/** requestAnimationFrame 두 번: 스크롤 뒤 rAF로 미룬 갱신이 끝날 때까지 기다린다. */
export const twoFrames = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

/** 목차 링크의 제목 id(문서 순서). 한글 id를 하드코딩하지 않고 화면에서 읽는다. */
export const tocIds = (page) => page.locator('#toc a[data-toc-id]').evaluateAll((as) => as.map((a) => a.dataset.tocId));
