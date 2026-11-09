// 도식 비주얼: md 구역의 표·제목을 읽어 그린다(계획 M6). 글자는 모두 md 원문이고 textContent로만 넣는다.
// 글자·링크는 HTML, 기호·화살표만 aria-hidden SVG(icons.js, currentColor)다. 최상위에서 DOM을 쓰지 않는다(Node 단위 테스트가 import).
import { icon } from './icons.js';
import { parseStage } from './ruler.js';

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
