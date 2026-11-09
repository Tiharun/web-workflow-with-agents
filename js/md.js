// md 원본을 불러와 문장은 그대로 두고 모양만 바꾼다. (docs/brief.md '가이드 읽기')
import { marked } from '../vendor/marked/marked.esm.js';
import { siteConfig } from './site-config.js';
import { icon } from './icons.js';

const { ui } = siteConfig;
const cache = new Map();

/** 가이드 md를 한 번만 불러와 가공한다. 실패하면 캐시를 비워 다시 시도할 수 있게 한다. */
export function loadGuide(guide) {
  if (!cache.has(guide.id)) {
    const job = fetch(guide.file, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => buildDoc(guide, text));
    job.catch(() => cache.delete(guide.id));
    cache.set(guide.id, job);
  }
  return cache.get(guide.id);
}

export const isLoaded = (id) => cache.has(id);

/** GitHub 방식 제목 id: 소문자, 글자·숫자·공백·하이픈만 남기고 공백은 하이픈. */
export function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

function buildDoc(guide, text) {
  const tpl = document.createElement('template');
  tpl.innerHTML = marked.parse(text, { gfm: true });
  const root = tpl.content;

  const headings = assignHeadingIds(root);
  const roles = collectRoles(root);

  markLinks(root);
  shapeCodeBlocks(root);
  shapeTables(root);
  shapeChecklists(root);
  shapePassBlocks(root);
  shapeWarnings(root);
  shapeBadges(root);
  attachTerms(root, roles);
  shapeIntro(root);

  return { guide, template: tpl, headings, title: headings.find((h) => h.level === 1)?.title ?? guide.menuLabel, stages: buildStages(guide, headings) };
}

function assignHeadingIds(root) {
  const seen = new Map();
  const list = [];
  const stack = [];
  root.querySelectorAll('h1, h2, h3, h4').forEach((el) => {
    const level = Number(el.tagName[1]);
    const title = el.textContent.trim();
    const base = slugify(title) || 'section';
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    const id = n ? `${base}-${n}` : base;
    el.id = id;
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
    const parentId = level > 1 && stack.length && stack[stack.length - 1].level > 1 ? stack[stack.length - 1].id : null;
    const item = { id, title, level, parentId };
    list.push(item);
    stack.push(item);
  });
  return list;
}

/** 메가메뉴 단계: stageRule.level 제목 + expand에 든 장의 하위 제목 */
function buildStages(guide, headings) {
  const { level, expand } = guide.stageRule;
  return headings
    .filter((h) => h.level === level)
    .map((h) => ({
      ...h,
      children: expand.some((t) => h.title.startsWith(t)) ? headings.filter((c) => c.parentId === h.id && c.level === level + 1) : [],
    }));
}

/** '역할 | 스킬' 머리글이 있는 표에서 스킬 이름 → 역할 문장 (툴팁용, 문서 안 문장만 쓴다) */
function collectRoles(root) {
  const roles = new Map();
  root.querySelectorAll('table').forEach((table) => {
    const heads = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
    const ri = heads.indexOf('역할');
    const si = heads.indexOf('스킬');
    if (ri < 0 || si < 0) return;
    table.dataset.roles = '';
    table.querySelectorAll('tbody tr').forEach((tr) => {
      const cells = tr.children;
      const role = cells[ri]?.textContent.trim();
      const cell = cells[si];
      if (!role || !cell) return;
      const names = new Set([...cell.querySelectorAll('code')].map((c) => c.textContent));
      cell.textContent.split(/[·,+()]/).forEach((part) => names.add(part));
      names.forEach((raw) => {
        const key = normName(raw);
        if (!key || !/^[a-z0-9:*._-]+$/.test(key)) return;
        const list = roles.get(key) ?? [];
        if (!list.includes(role)) list.push(role);
        roles.set(key, list);
      });
    });
  });
  return roles;
}

const normName = (raw) => raw.trim().split(/\s+/)[0]?.replace(/^\//, '').toLowerCase() ?? '';

function attachTerms(root, roles) {
  if (!roles.size) return;
  root.querySelectorAll('code').forEach((code) => {
    if (code.closest('pre, a, table[data-roles], h1, h2, h3, h4')) return;
    // 이름이나 짧은 명령만 용어로 본다. 프롬프트 문장이 든 긴 코드는 그대로 둔다.
    if (code.textContent.trim().split(/\s+/).length > 3) return;
    const list = roles.get(normName(code.textContent));
    if (!list) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'term';
    btn.dataset.tip = list.join('\n');
    code.replaceWith(btn);
    btn.append(code);
  });
}

function markLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (/^https?:\/\//i.test(href)) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.insertAdjacentHTML('beforeend', `<span class="visually-hidden"> ${ui.newTab}</span>`);
      return;
    }
    let name = href;
    try { name = decodeURIComponent(href); } catch { /* 그대로 둔다 */ }
    name = name.split(/[\\/]/).pop();
    const target = siteConfig.guides.find((g) => g.legacyNames.includes(name));
    if (target) a.setAttribute('href', `#/${target.id}`);
  });
}

const BOX = /[─│┌└┐┘├┤▶◀]/;

function shapeCodeBlocks(root) {
  root.querySelectorAll('pre > code').forEach((code) => {
    const pre = code.parentElement;
    const lang = (code.className.match(/language-(\S+)/) || [])[1] ?? '';
    if (BOX.test(code.textContent)) {
      const fig = document.createElement('figure');
      fig.className = 'diagram';
      pre.replaceWith(fig);
      pre.tabIndex = 0;
      fixWideChars(code);
      fig.append(pre);
      return;
    }
    const card = document.createElement('div');
    card.className = 'prompt';
    const label = lang && lang !== 'text' ? `<span class="prompt__lang">${lang}</span>` : '';
    card.innerHTML = `<div class="prompt__bar">${label}<button type="button" class="btn-copy" data-copy aria-label="${ui.copy}">${icon('copy')}<span data-copy-label>${ui.copy}</span></button></div>`;
    pre.replaceWith(card);
    card.append(pre);
  });
}

/** 글자 그림의 칸 맞춤: 한글 같은 전각 글자는 2칸, 그 밖의 비ASCII 글자는 1칸 폭으로 고정한다. */
function fixWideChars(code) {
  const text = code.textContent;
  const frag = document.createDocumentFragment();
  let run = '';
  const flush = () => { if (run) { frag.append(run); run = ''; } };
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp < 0x80) { run += ch; continue; }
    flush();
    const span = document.createElement('span');
    span.className = isWide(cp) ? 'w2' : 'w1';
    span.textContent = ch;
    frag.append(span);
  }
  flush();
  code.replaceChildren(frag);
}

const isWide = (cp) =>
  (cp >= 0x1100 && cp <= 0x115f) || (cp >= 0x2e80 && cp <= 0xa4cf) || (cp >= 0xac00 && cp <= 0xd7a3) ||
  (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xfe30 && cp <= 0xfe4f) || (cp >= 0xff00 && cp <= 0xff60) || (cp >= 0xffe0 && cp <= 0xffe6);

function shapeTables(root) {
  root.querySelectorAll('table').forEach((table) => {
    const heads = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
    table.querySelectorAll('tbody tr').forEach((tr) => {
      [...tr.children].forEach((td, i) => { if (heads[i]) td.dataset.label = heads[i]; });
    });
    if (heads.length >= 3) table.classList.add('table--cards');
    table.querySelectorAll('td code').forEach((code) => {
      if (!code.textContent.includes('/')) return;
      const parts = code.textContent.split('/');
      code.replaceChildren(...parts.flatMap((part, i) => (i < parts.length - 1 ? [`${part}/`, document.createElement('wbr')] : [part])));
    });
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    table.replaceWith(wrap);
    wrap.append(table);
  });
}

function shapeChecklists(root) {
  root.querySelectorAll('li > input[type="checkbox"]').forEach((input) => {
    input.disabled = true;
    input.tabIndex = -1;
    input.closest('ul, ol')?.classList.add('checklist');
    // 체크박스 뒤 내용을 한 덩어리로 묶어 줄 안에서 자연스럽게 흐르게 한다.
    const text = document.createElement('span');
    text.className = 'checklist__text';
    while (input.nextSibling) text.append(input.nextSibling);
    input.after(text);
  });
}

// "**통과 조건**" 단락과 바로 뒤 목록을 한 상자로 묶어 지나치지 않게 한다.
const PASS = /^통과 조건/;

function shapePassBlocks(root) {
  root.querySelectorAll('p').forEach((p) => {
    const label = p.firstElementChild;
    if (p.childElementCount !== 1 || label.tagName !== 'STRONG' || p.textContent.trim() !== label.textContent.trim()) return;
    if (!PASS.test(label.textContent.trim())) return;
    const list = p.nextElementSibling;
    if (!list?.matches('ul, ol')) return;
    const box = document.createElement('div');
    box.className = 'pass';
    p.classList.add('pass__title');
    p.before(box);
    box.append(p, list);
  });
}

const WARN = /⚠️?\s?/;

function shapeWarnings(root) {
  const nodes = textNodes(root, (n) => WARN.test(n.nodeValue));
  nodes.forEach((node) => {
    const m = node.nodeValue.match(WARN);
    const after = node.splitText(m.index);
    after.nodeValue = after.nodeValue.slice(m[0].length);
    const mark = document.createElement('span');
    mark.className = 'warn-mark';
    mark.innerHTML = `${icon('warning')}<span class="visually-hidden">${ui.warning}: </span>`;
    after.before(mark);
    node.parentElement.closest('li, blockquote')?.classList.add('is-warn');
  });
}

const BADGE = /\(([^()]{0,40}?)(측정|검색 확인|추측)([^()]{0,80}?)\)/g;
const KIND = { 측정: 'measure', '검색 확인': 'search', 추측: 'guess' };

function shapeBadges(root) {
  textNodes(root, (n) => /측정|검색 확인|추측/.test(n.nodeValue)).forEach((node) => {
    const value = node.nodeValue;
    BADGE.lastIndex = 0;
    if (!BADGE.test(value)) return;
    BADGE.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0;
    for (const m of value.matchAll(BADGE)) {
      const before = value.slice(last, m.index);
      frag.append(before && !/\s$/.test(before) ? `${before} ` : before);
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.dataset.kind = KIND[m[2]];
      if (KIND[m[2]] === 'measure') badge.innerHTML = icon('check', 'icon badge__icon');
      badge.append(`${m[1]}${m[2]}${m[3]}`);
      frag.append(badge);
      last = m.index + m[0].length;
    }
    frag.append(value.slice(last));
    node.replaceWith(frag);
  });
}

/** 제목(h1) 바로 뒤 인용문은 문서 소개로 표시한다. */
function shapeIntro(root) {
  const h1 = root.querySelector('h1');
  const next = h1?.nextElementSibling;
  if (next?.tagName === 'BLOCKQUOTE') next.classList.add('lead-quote');
}

function textNodes(root, test) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest('pre, code') ? NodeFilter.FILTER_REJECT : test(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
  });
  const out = [];
  while (walker.nextNode()) out.push(walker.currentNode);
  return out;
}
