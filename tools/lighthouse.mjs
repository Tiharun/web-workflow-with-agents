// Lighthouse 성능·접근성 측정: npm run lighthouse [-- --local] [--runs 3] [--form mobile|desktop|both]
// 배포본(siteConfig.site.url)이 기본이다. --local은 tests/serve.py --gzip을 띄워 배포 전에 잰다(Pages처럼 압축).
// chrome-devtools-mcp의 lighthouse_audit은 성능을 빼고 재므로 CLI를 쓴다(스펙 §6).
// 화면마다 runs번 재서 중앙값으로 판정하고, 하나라도 90 미만이면 exit 1.
import { execSync, spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteConfig } from '../js/site-config.js';

const LIGHTHOUSE = 'lighthouse@13.5.0'; // 13.6.0은 2026-10-27 출시(2주 미만)
const PORT = 8130;
const THRESHOLD = 90;
const root = fileURLToPath(new URL('..', import.meta.url));

const argv = process.argv.slice(2);
const opt = (name, fallback) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : fallback; };
const local = argv.includes('--local');
const runs = Number(opt('--runs', 3));
const form = opt('--form', 'both');
const forms = form === 'both' ? ['mobile', 'desktop'] : [form];
if (!(runs >= 1) || !forms.every((f) => f === 'mobile' || f === 'desktop')) {
  console.error('사용법: node tools/lighthouse.mjs [--local] [--runs n] [--form mobile|desktop|both]');
  process.exit(2);
}

const base = local ? `http://127.0.0.1:${PORT}/` : siteConfig.site.url;
// '#'은 그대로 넘긴다. '%23'으로 바꾸면 없는 경로가 되어 404 화면을 잰다.
const screens = [['home', ''], ...siteConfig.guides.map((g) => [g.id, `#/${g.id}`])];

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const tmp = mkdtempSync(join(tmpdir(), 'lh-'));

let server;
if (local) {
  server = spawn('python', ['tests/serve.py', String(PORT), '--gzip'], { cwd: root, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 1500));
}

function audit(url, mobile, out) {
  const flags = [`"${url}"`, mobile ? '' : '--preset=desktop', '--only-categories=performance,accessibility',
    '--output=json', `--output-path="${out}"`, '--chrome-flags="--headless=new"', '--quiet'].filter(Boolean).join(' ');
  try { execSync(`npx --yes ${LIGHTHOUSE} ${flags}`, { stdio: 'ignore' }); } catch { /* 실패 보고서도 JSON으로 남는다 */ }
  const r = JSON.parse(readFileSync(out, 'utf8'));
  if (r.runtimeError) return { error: r.runtimeError.code };
  const a = r.audits;
  return {
    perf: Math.round(r.categories.performance.score * 100),
    a11y: Math.round(r.categories.accessibility.score * 100),
    fcp: a['first-contentful-paint'].numericValue, lcp: a['largest-contentful-paint'].numericValue,
    tbt: a['total-blocking-time'].numericValue, cls: a['cumulative-layout-shift'].numericValue,
  };
}

const rows = [];
let failed = false;
try {
  for (const f of forms) for (const [name, hash] of screens) {
    const results = [];
    for (let i = 0; i < runs; i++) results.push(audit(base + hash, f === 'mobile', join(tmp, `${f}-${name}-${i}.json`)));
    const ok = results.filter((x) => !x.error);
    if (!ok.length) { rows.push({ form: f, screen: name, error: results[0].error }); failed = true; continue; }
    const m = (k) => median(ok.map((x) => x[k]));
    const row = { form: f, screen: name, perf: m('perf'), a11y: m('a11y'), 'FCP(ms)': Math.round(m('fcp')), 'LCP(ms)': Math.round(m('lcp')), 'TBT(ms)': Math.round(m('tbt')), CLS: +m('cls').toFixed(3), runs: `${ok.length}/${runs}` };
    if (row.perf < THRESHOLD || row.a11y < THRESHOLD || ok.length < runs) failed = true;
    rows.push(row);
  }
} finally {
  server?.kill();
  rmSync(tmp, { recursive: true, force: true });
}

console.log(`Lighthouse ${LIGHTHOUSE} · ${base} · 중앙값(${runs}회)`);
console.table(rows);
console.log(failed ? `기준 미달: 성능·접근성 ${THRESHOLD} 미만 또는 실패한 측정이 있습니다.` : `통과: 모든 화면이 ${THRESHOLD} 이상입니다.`);
process.exit(failed ? 1 : 0);
