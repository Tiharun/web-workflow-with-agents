// md 원본을 불러와 문장은 그대로 두고 모양만 바꾼다. (docs/brief.md '가이드 읽기')
import { marked } from '../vendor/marked/marked.esm.js';
import { siteConfig } from './site-config.js';
import { icon } from './icons.js';

const { ui } = siteConfig;
const texts = new Map(); // 받은 원문(변환 전)
const cache = new Map();
const ready = new Map(); // 다 만든 문서. 이미 받은 문서는 스켈레톤 없이 바로 그리는 데 쓴다.

/** md 원문을 한 번만 받는다. 실패하면 비워 다시 받을 수 있게 한다. */
function fetchText(guide) {
  if (!texts.has(guide.id)) {
    const job = fetch(guide.file, { cache: 'no-cache' }).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    });
    job.catch(() => texts.delete(guide.id));
    texts.set(guide.id, job);
  }
  return texts.get(guide.id);
}

/**
 * 원문만 미리 받는다. 변환(긴 가이드는 느린 기기에서 100ms 넘는 긴 작업)은 쓸 때 loadGuide가 한다.
 * @returns {Promise<void>} 거부하지 않는다
 */
export const prefetchGuide = (guide) => fetchText(guide).then(() => {}, () => {});

/** 가이드 md를 한 번만 불러와 가공한다. 실패하면 캐시를 비워 다시 시도할 수 있게 한다. */
export function loadGuide(guide) {
  if (!cache.has(guide.id)) {
    const job = fetchText(guide)
      .then((text) => {
        const doc = buildDoc(guide, text);
        ready.set(guide.id, doc);
        return doc;
      });
    job.catch(() => cache.delete(guide.id));
    cache.set(guide.id, job);
  }
  return cache.get(guide.id);
}

export const isLoaded = (id) => cache.has(id);

/** 다 불러온 문서. 불러오는 중이거나 실패했으면 null. */
export const readyDoc = (guide) => ready.get(guide.id) ?? null;

/** GitHub 방식 제목 id: 소문자, 글자·숫자·공백·하이픈만 남기고 공백은 하이픈. */
export function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

/** md 원문 → 화면용 template과 제목·단계 데이터. fetch와 분리해 고정 md 조각으로 테스트한다. */
export function buildDoc(guide, text) {
  const tpl = document.createElement('template');
  tpl.innerHTML = marked.parse(text, { gfm: true });
  const root = tpl.content;

  const headings = assignHeadingIds(root);
  const roles = collectRoles(root);

  markLinks(root, guide);
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
  const used = new Set();
  const list = [];
  const stack = [];
  root.querySelectorAll('h1, h2, h3, h4').forEach((el) => {
    const level = Number(el.tagName[1]);
    const title = el.textContent.trim();
    const base = slugify(title) || 'section';
    // 같은 base는 -1, -2…를 붙이고, 그 id를 이미 다른 제목이 쓰고 있으면(예: 'a-1' 제목) 다음 번호로 넘긴다.
    let n = seen.get(base) ?? 0;
    let id = n ? `${base}-${n}` : base;
    while (used.has(id)) id = `${base}-${++n}`;
    seen.set(base, n + 1);
    used.add(id);
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

const decode = (s) => {
  try { return decodeURIComponent(s); } catch { return s; }
};

/**
 * md 안 링크 → 사이트 주소(순수 함수). 외부 링크는 그대로 두고 external로 알린다.
 * '#조각'은 지금 가이드의 그 제목으로, 옛 가이드 파일 이름(legacyNames)은 '#/<가이드 id>[/<제목 id>]'로 바꾼다.
 */
export function rewriteHref(href, guide) {
  if (/^https?:\/\//i.test(href)) return { href, external: true };
  if (href.startsWith('#/')) return { href, external: false }; // 이미 사이트 주소
  const hash = href.indexOf('#');
  const path = (hash < 0 ? href : href.slice(0, hash)).replace(/\?.*$/, '');
  const fragment = hash < 0 ? '' : decode(href.slice(hash + 1));
  if (!path && hash === 0) return { href: fragment ? `#/${guide.id}/${fragment}` : `#/${guide.id}`, external: false };
  const name = decode(path).split(/[\\/]/).pop();
  const target = siteConfig.guides.find((g) => g.legacyNames.includes(name));
  if (!target) return { href, external: false };
  return { href: fragment ? `#/${target.id}/${fragment}` : `#/${target.id}`, external: false };
}

function markLinks(root, guide) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const { href, external } = rewriteHref(a.getAttribute('href'), guide);
    a.setAttribute('href', href);
    if (!external) return;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.insertAdjacentHTML('beforeend', `<span class="visually-hidden"> ${ui.newTab}</span>`);
  });
}

const BOX = /[─│┌└┐┘├┤▶◀]/;

function shapeCodeBlocks(root) {
  root.querySelectorAll('pre > code').forEach((code) => {
    // marked가 붙인 끝 줄바꿈을 지워 복사한 글이 md 코드 블록과 같게 한다(화면 높이는 그대로).
    code.textContent = code.textContent.replace(/\n$/, '');
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
  root.querySelectorAll('li > input[type="checkbox"]').forEach((input, i) => {
    input.disabled = true;
    input.tabIndex = -1;
    input.closest('ul, ol')?.classList.add('checklist');
    // 체크박스 뒤 내용을 한 덩어리로 묶어 줄 안에서 자연스럽게 흐르게 한다.
    const text = document.createElement('span');
    text.className = 'checklist__text';
    while (input.nextSibling) text.append(input.nextSibling);
    input.after(text);
    // 화면 낭독기가 체크박스마다 그 항목 글을 이름으로 읽게 한다.
    text.id = `checklist-text-${i}`;
    input.setAttribute('aria-labelledby', text.id);
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
      frag.append(spaced(value.slice(last, m.index)));
      frag.append(makeBadge(m[2], `${m[1]}${m[2]}${m[3]}`));
      last = m.index + m[0].length;
    }
    frag.append(value.slice(last));
    node.replaceWith(frag);
  });
  shapeSplitBadges(root);
}

const spaced = (before) => (before && !/\s$/.test(before) ? `${before} ` : before);

function makeBadge(word, ...content) {
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.dataset.kind = KIND[word];
  if (KIND[word] === 'measure') badge.innerHTML = icon('check', 'icon badge__icon');
  badge.append(...content);
  return badge;
}

// 괄호 안에 인라인 코드 등이 끼어 글자 조각이 나뉜 경우: "실행됩니다(`a`, 측정)" → 앞 조각의 '('부터 뒤 조각의 ')'까지 배지로 묶는다.
const SPLIT_END = /^[^()]{0,80}?(측정|검색 확인|추측)[^()]{0,80}?\)/;

function shapeSplitBadges(root) {
  textNodes(root, (n) => SPLIT_END.test(n.nodeValue)).forEach((end) => {
    const mids = [];
    let start = end.previousSibling;
    while (start?.nodeType === Node.ELEMENT_NODE && start.matches('code, strong, em, a')) {
      mids.unshift(start);
      start = start.previousSibling;
    }
    if (!mids.length || start?.nodeType !== Node.TEXT_NODE) return;
    const open = start.nodeValue.lastIndexOf('(');
    if (open < 0 || start.nodeValue.includes(')', open)) return;
    const close = end.nodeValue.indexOf(')');
    const word = end.nodeValue.match(SPLIT_END)[1];
    const badge = makeBadge(word, start.nodeValue.slice(open + 1), ...mids, end.nodeValue.slice(0, close));
    start.nodeValue = spaced(start.nodeValue.slice(0, open));
    end.nodeValue = end.nodeValue.slice(close + 1);
    start.after(badge);
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
