// 단계 자: 최종 md '3. 단계별 진행과 프롬프트' 아래 제목으로 그리는 눈금자. 눈금마다 그 단계로 가는 링크다.
import { siteConfig } from './site-config.js';
import { icon } from './icons.js';

const { ruler: cfg, ui } = siteConfig;

/** 제목 "4단계. 디자인 방향 고정 ★ 가장 중요" → { num: '4', name: '디자인 방향 고정', key: true } */
function parseStage(title) {
  const m = title.match(/^(\d+(?:~\d+)?)단계\.\s*(.*)$/);
  const rest = m ? m[2] : title;
  const name = rest.split(' — ')[0].split(' ★')[0].replace(/\s*\([^)]*\)\s*$/, '').trim();
  return { num: m ? m[1] : null, name, key: rest.includes('★') };
}

export function stagesFromDoc(doc) {
  const parent = doc.headings.find((h) => h.level === 2 && h.title.startsWith(cfg.parentTitle));
  if (!parent) return [];
  return doc.headings.filter((h) => h.parentId === parent.id).map((h) => ({ id: h.id, ...parseStage(h.title) }));
}

/** @returns {HTMLElement|null} 단계가 없으면 null (비주얼만 숨긴다) */
export function buildRuler(doc, { variant = 'auto' } = {}) {
  const stages = stagesFromDoc(doc);
  if (!stages.length) return null;
  const from = stages.findIndex((s) => s.num === cfg.loop.from);
  const to = stages.findIndex((s) => s.num === cfg.loop.to);

  const nav = document.createElement('nav');
  nav.className = `ruler ruler--${variant}`;
  nav.setAttribute('aria-label', ui.rulerLabel);
  nav.style.setProperty('--n', stages.length);

  const items = stages
    .map((s, i) => {
      const short = s.num ?? s.name.split(' ')[0];
      const cls = ['ruler__stop', s.key && 'is-key', !s.num && 'is-gate'].filter(Boolean).join(' ');
      return `<li class="${cls}" style="--i:${i}"><a class="ruler__link" href="#/${cfg.guideId}/${s.id}" data-smooth>` +
        `<span class="ruler__num" aria-hidden="true">${short}</span>` +
        `<span class="ruler__name">${s.num ? `<span class="visually-hidden">${s.num}단계 </span>` : ''}${s.name}</span></a></li>`;
    })
    .join('');

  const loop = from >= 0 && to >= from
    ? `<div class="ruler__loop" style="--from:${from};--to:${to}" aria-hidden="true">${icon('loop', 'icon ruler__loop-icon')}<span>${cfg.loop.label}</span></div>`
    : '';

  nav.innerHTML = `<div class="ruler__track"><ol class="ruler__list">${items}</ol>${loop}</div>`;
  return nav;
}
