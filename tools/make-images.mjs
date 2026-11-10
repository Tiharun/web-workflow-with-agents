// favicon PNG·apple-touch-icon·OG 그림을 만든다: npm run images
// siteConfig 이름·설명이나 토큰 색, assets/favicon.svg, tools/og.html을 바꾸면 다시 실행한다.
// 서버 없이 저장소 파일을 가짜 주소(http://images.local)로 답해 ES 모듈·글꼴이 열리게 한다.
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteConfig } from '../js/site-config.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const origin = 'http://images.local';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const { icons, ogImage } = siteConfig.site;

/** 아이콘 한 장을 담는 페이지. bg가 없으면 투명 바탕. */
const iconPage = (size, bg) => `<!doctype html><html data-mode="light"><head><link rel="stylesheet" href="/css/tokens.css"><link rel="stylesheet" href="/css/base.css"><link rel="stylesheet" href="/css/site.css">
<style>html,body{margin:0;min-height:0;width:${size}px;height:${size}px;background:${bg ? 'var(--color-paper)' : 'transparent'}}img{display:block;width:${size}px;height:${size}px}</style>
</head><body><img src="/${icons.svg}" alt=""></body></html>`;

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ colorScheme: 'light', deviceScaleFactor: 1 });
  await context.route(`${origin}/**`, async (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname);
    const icon = path.match(/^\/__icon-(\d+)(-bg)?\.html$/);
    if (icon) return route.fulfill({ body: iconPage(Number(icon[1]), !!icon[2]), contentType: 'text/html' });
    const file = resolve(root, `.${path}`);
    if (!file.startsWith(root + sep)) return route.fulfill({ status: 403 });
    try {
      return route.fulfill({ body: await readFile(file), contentType: types[extname(file)] ?? 'application/octet-stream' });
    } catch {
      return route.fulfill({ status: 404 });
    }
  });
  const page = await context.newPage();
  const shoot = async (url, width, height, out, omitBackground = false) => {
    await page.setViewportSize({ width, height });
    await page.goto(`${origin}${url}`);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => img.decode()));
    });
    await page.screenshot({ path: join(root, out), omitBackground });
    console.log(`${out} ${width}x${height}`);
  };
  await shoot('/__icon-32.html', 32, 32, icons.png, true);
  await shoot('/__icon-180-bg.html', 180, 180, icons.apple); // iOS는 투명을 검게 채운다
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(`${origin}/tools/og.html`);
  await page.waitForFunction(() => 'ready' in document.documentElement.dataset);
  await page.screenshot({ path: join(root, ogImage) });
  console.log(`${ogImage} 1200x630`);
} finally {
  await browser.close();
}
