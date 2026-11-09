// 도식 비주얼: md 구역의 표·제목을 읽어 그린다(계획 M6). 글자는 모두 md 원문이고 textContent로만 넣는다.
// 글자·링크는 HTML, 기호·화살표만 aria-hidden SVG(icons.js, currentColor)다. 최상위에서 DOM을 쓰지 않는다(Node 단위 테스트가 import).
import { icon } from './icons.js';
import { parseStage, stagesFromDoc } from './ruler.js';

const HEADING = /^H[1-6]$/;

/** 문서 템플릿의 직계 자식 중 그 제목 다음부터, 수준이 같거나 높은 다음 제목 전까지. 제목이 없으면 []. */
export function sectionOf(doc, headingId) {
  const nodes = [...doc.template.content.children];
  const i = nodes.findIndex((n) => n.id === headingId);
  if (i < 0) return [];
  const level = Number(nodes[i].tagName[1]);
  const out = [];
  for (const n of nodes.slice(i + 1)) {
    if (HEADING.test(n.tagName) && Number(n.tagName[1]) <= level) break;
    out.push(n);
  }
  return out;
}

/** 구역 안 첫 표: 머리글 글자와 본문 칸 요소. 없으면 null. */
export function firstTable(nodes) {
  for (const n of nodes) {
    const table = n.tagName === 'TABLE' ? n : n.querySelector('table');
    if (!table) continue;
    return {
      heads: [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim()),
      rows: [...table.querySelectorAll('tbody tr')].map((tr) => [...tr.children]),
    };
  }
  return null;
}

export const col = (table, name) => table.heads.indexOf(name);

/** "[3] 시각 탐색 (선택) — playground" → { num: '3', name: '시각 탐색', optional: true }. [n]으로 시작하지 않으면 null. */
export function parseBracket(title) {
  const m = title.match(/^\[(\d+)\]\s*(.*)$/);
  if (!m) return null;
  const head = m[2].split(' — ')[0];
  const optional = /\(선택\)/.test(head);
  return { num: m[1], name: head.replace(/\s*\(선택\)\s*/, ' ').trim(), optional };
}

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
/**
 * 경로 글자: '/'·'-' 뒤마다 조각(inline-block)으로 나눠 조각 사이에서만 줄을 바꾼다.
 * <wbr>만 두면 브라우저가 한글과 '>' 사이도 끊어 '>-design.md'처럼 기호로 줄이 시작됐다(측정).
 */
const pathText = (text) => text.split(/(?<=[/-])/).map((part) => el('span', 'chip__seg', part));
const svg = (name, cls) => {
  const t = document.createElement('template');
  t.innerHTML = icon(name, `icon ${cls}`);
  return t.content.firstElementChild;
};

/**
 * 흐름: 단계마다 링크 하나. items: { num, label, name, href, key?, optional?, mark? }[]
 * label은 낭독기용 번호 표기(md 표기 그대로: '1단계', '[1]'). legend: { title, marks: [mark, char][] } | null
 */
export function buildFlow(items, labelledBy, legend = null) {
  // 이름이 긴 흐름은 가로형에서 단계 자처럼 짝수 번째 이름을 내려 두 칸 폭을 쓴다(DESIGN.md 'Stage Ruler')
  const nav = el('nav', items.some((it) => it.name.length > 8) ? 'flow flow--stagger' : 'flow');
  nav.setAttribute('aria-labelledby', labelledBy);
  const list = el('ol', 'flow__list');
  list.style.setProperty('--n', items.length);
  for (const it of items) {
    const li = el('li', ['flow__step', it.key && 'is-key', it.optional && 'is-optional'].filter(Boolean).join(' '));
    if (it.mark) li.dataset.mark = it.mark;
    const a = el('a', 'flow__link');
    a.href = it.href;
    a.dataset.smooth = '';
    const num = el('span', 'flow__num', it.num);
    num.setAttribute('aria-hidden', 'true');
    const node = svg(`mark-${it.mark ?? 'none'}`, 'flow__mark'); // 표시가 없는 단계는 빈 원 마디
    node.setAttribute('aria-hidden', 'true');
    const name = el('span', 'flow__name');
    name.append(el('span', 'visually-hidden', `${it.label} `), it.name);
    a.append(num, node, name);
    li.append(a);
    list.append(li);
  }
  nav.append(list);
  if (legend) {
    const p = el('p', 'flow__legend');
    p.setAttribute('aria-hidden', 'true');
    p.append(el('span', 'flow__legend-title', legend.title));
    for (const [mark, char] of legend.marks) {
      const k = el('span', 'flow__legend-key');
      k.append(char, svg(`mark-${mark}`, 'flow__legend-mark')); // md 기호 → 그림 기호
      p.append(k);
    }
    nav.append(p);
  }
  return nav;
}

const MARKS = { '✗': 'none', '△': 'part', '○': 'full' };

/** 웹사이트 제작 순서: '1단계.'~'10단계.' 큰 장마다 한 칸, 구역 표의 코드 작성 칸을 기호로. */
export function stepsFlow(doc, guide, item) {
  const table = firstTable(sectionOf(doc, item.headingId));
  if (!table) return null;
  const c = col(table, item.column);
  if (c < 0) return null;
  const marks = new Map(table.rows.map((r) => [r[0]?.textContent.trim(), r[c]?.textContent.trim().charAt(0)]));
  const items = doc.headings
    .filter((h) => h.level === 2)
    .map((h) => ({ h, s: parseStage(h.title) }))
    .filter(({ s }) => s.num)
    .map(({ h, s }) => ({ num: s.num, label: `${s.num}단계`, name: s.name, href: `#/${guide.id}/${h.id}`, key: s.key, mark: MARKS[marks.get(s.num)] }));
  if (items.length < 2) return null;
  const seen = new Map();
  for (const ch of marks.values()) if (MARKS[ch] && !seen.has(ch)) seen.set(ch, MARKS[ch]);
  return buildFlow(items, item.headingId, { title: item.column, marks: [...seen].map(([ch, m]) => [m, ch]) });
}

/** 디자인 스킬: '[n] 이름 — 스킬' 단계 제목마다 한 칸. */
export function designFlow(doc, guide, item) {
  const items = doc.headings
    .filter((h) => h.level === 3)
    .map((h) => ({ h, b: parseBracket(h.title) }))
    .filter(({ b }) => b)
    .map(({ h, b }) => ({ num: b.num, label: `[${b.num}]`, name: b.name, href: `#/${guide.id}/${h.id}`, optional: b.optional }));
  return items.length < 2 ? null : buildFlow(items, item.headingId);
}

/** 문서 지도: 표의 파일을 '만드는 단계' 첫 토큰(1~3, 4, 5, 6…)별 칸으로 묶는다. 역할 칸이 굵은 행은 강조. 표와 내용이 같아 낭독기에서는 숨긴다. */
export function docMap(doc, guide, item) {
  const table = firstTable(sectionOf(doc, item.headingId));
  if (!table) return null;
  const [fc, sc, rc] = ['file', 'stage', 'role'].map((k) => col(table, item.columns[k]));
  if (fc < 0 || sc < 0) return null;
  const lanes = new Map();
  for (const row of table.rows) {
    const token = row[sc]?.textContent.trim().match(/^[\d~]+/)?.[0];
    if (!token) continue;
    if (!lanes.has(token)) lanes.set(token, []);
    lanes.get(token).push({ file: row[fc].textContent.trim(), tag: rc < 0 ? null : row[rc]?.querySelector('strong')?.textContent.trim() });
  }
  if (!lanes.size) return null;
  const names = new Map(stagesFromDoc(doc).map((s) => [s.num, s.name]));
  const root = el('div', 'docmap');
  root.setAttribute('aria-hidden', 'true');
  const list = el('ol', 'docmap__lanes');
  list.style.setProperty('--n', lanes.size);
  for (const [token, files] of lanes) {
    const lane = el('li', 'docmap__lane');
    const head = el('p', 'docmap__head');
    head.append(el('span', 'docmap__num', token));
    if (names.has(token)) head.append(el('span', 'docmap__name', names.get(token)));
    const ul = el('ul', 'docmap__files');
    for (const f of files) {
      const chip = el('li', f.tag ? 'chip docmap__file is-key' : 'chip docmap__file');
      chip.append(...pathText(f.file));
      if (f.tag) chip.append(el('span', 'docmap__tag', f.tag));
      ul.append(chip);
    }
    if (list.children.length) lane.append(svg('right', 'docmap__arrow'));
    lane.append(head, ul);
    list.append(lane);
  }
  root.append(list);
  return root;
}

/** 표 칸을 '→'로 나눈 토큰들. 토큰은 조각 { text, code }[]이고, md 코드(`…`)는 code 조각으로 남긴다. */
function splitCell(cell) {
  const tokens = [[]];
  for (const node of cell?.childNodes ?? []) {
    const code = node.nodeName === 'CODE';
    node.textContent.split('→').forEach((piece, i) => {
      if (i) tokens.push([]);
      if (piece) tokens.at(-1).push({ text: piece, code });
    });
  }
  return tokens
    .map((parts) => {
      if (parts.length) {
        parts[0] = { ...parts[0], text: parts[0].text.trimStart() };
        parts[parts.length - 1] = { ...parts.at(-1), text: parts.at(-1).text.trimEnd() };
      }
      return parts.filter((p) => p.text);
    })
    .filter((parts) => parts.length);
}

/**
 * 상황별 빠른 경로: 표 행마다 상황 이름 + 순서 칸을 '→'로 나눈 칩 줄. '[n]'은 같은 문서의 '[n]' 단계 제목 링크(뒤 글자는 글 칩),
 * 제목이 없거나 그 밖의 토큰은 글 칩이다. '→'가 없는(토큰 2개 미만) 행은 경로가 아니라서 뺀다.
 * 화살표는 칸 뒤에 붙여 줄이 화살표로 시작하지 않게 한다(줄 끝 화살표가 '다음 줄로 이어짐'을 뜻한다).
 */
export function quickPaths(doc, guide, item) {
  const table = firstTable(sectionOf(doc, item.headingId));
  if (!table) return null;
  const [nc, pc] = [item.columns.name, item.columns.path].map((name) => col(table, name));
  if (nc < 0 || pc < 0) return null;
  const steps = new Map();
  for (const h of doc.headings.filter((x) => x.level === 3)) {
    const b = parseBracket(h.title);
    if (b && !steps.has(b.num)) steps.set(b.num, { id: h.id, name: b.name });
  }
  const rows = el('ol', 'paths__rows');
  for (const row of table.rows) {
    const tokens = splitCell(row[pc]);
    if (tokens.length < 2) continue;
    const seq = el('ol', 'paths__seq');
    tokens.forEach((parts, i) => {
      const token = parts.map((p) => p.text).join('');
      const li = el('li', 'paths__item');
      const m = token.match(/^\[(\d+)\]\s*(.*)$/);
      const step = m && steps.get(m[1]);
      if (step) {
        const a = el('a', 'chip paths__step');
        a.href = `#/${guide.id}/${step.id}`;
        a.dataset.smooth = '';
        const n = el('span', null, m[1]);
        n.setAttribute('aria-hidden', 'true');
        a.append(n, el('span', 'visually-hidden', `[${m[1]}] ${step.name}`));
        li.append(a);
        if (m[2]) li.append(el('span', 'paths__text paths__note', m[2])); // '[4] hallmark'·'[5]부터 진행': 단계에 딸린 말이라 칩이 아니다
      } else {
        const chip = el('span', 'chip paths__text');
        chip.append(...parts.map((p) => (p.code ? el('span', 'paths__code', p.text) : p.text)));
        li.append(chip);
      }
      if (i < tokens.length - 1) li.append(svg('right', 'paths__arrow'));
      seq.append(li);
    });
    const li = el('li', 'paths__row');
    li.append(el('p', 'paths__name', row[nc].textContent.trim()), seq);
    rows.append(li);
  }
  if (!rows.children.length) return null;
  const root = el('div', 'paths');
  root.setAttribute('role', 'group');
  root.setAttribute('aria-labelledby', item.headingId);
  root.append(rows);
  return root;
}
