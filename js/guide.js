// 가이드 화면: md 본문, 좌측 상단 도구([→ 목차] [⬇ md]), 목차 드로어, 진행 막대, 현재 위치, 등장 모션.
import { siteConfig, guideById } from './site-config.js';
import { loadGuide } from './md.js';
import { buildRuler } from './ruler.js';
import { icon } from './icons.js';
import { escapeHtml } from './header.js';
import { motionOK, scrollToTarget } from './scroll.js';
import { reveal } from './motion.js';

const { ui, site } = siteConfig;

/** @returns {Promise<() => void>} 화면을 떠날 때 부르는 정리 함수 */
export async function renderGuide(main, guide, stageId, { smooth = false } = {}) {
  main.innerHTML = `
    <div class="guide" data-guide="${guide.id}">
      <div class="container guide__layout">
        <div class="guide-tools" role="toolbar" aria-label="${ui.toc}">
          <button type="button" class="tool-btn" data-toc-open aria-haspopup="dialog" aria-controls="toc" aria-expanded="false">${icon('right')}<span>${ui.toc}</span></button>
          <a class="tool-btn" href="${guide.file}" download="${escapeHtml(guide.downloadName)}" aria-label="${ui.downloadLabel}" data-tip="${ui.downloadLabel}">${icon('download')}<span aria-hidden="true">${ui.download}</span></a>
        </div>
        <article class="doc" id="doc" aria-busy="true">${skeleton()}</article>
      </div>
      <dialog class="toc" id="toc" aria-label="${ui.toc}">
        <div class="toc__bar">
          <button type="button" class="tool-btn" data-toc-close>${icon('left')}<span>${ui.toc}</span><span class="visually-hidden">${ui.tocClose}</span></button>
        </div>
        <nav class="toc__nav" aria-label="${ui.toc}"></nav>
      </dialog>
    </div>`;

  const article = main.querySelector('#doc');
  let doc;
  try {
    doc = await loadGuide(guide);
  } catch {
    article.removeAttribute('aria-busy');
    article.innerHTML = errorHtml(guide);
    article.querySelector('[data-retry]').addEventListener('click', () => renderGuide(main, guide, stageId));
    return () => {};
  }
  if (!main.contains(article)) return () => {};

  article.replaceChildren(doc.template.content.cloneNode(true));
  article.removeAttribute('aria-busy');
  document.title = `${doc.title} | ${site.name}`;
  placeVisuals(article, guide, doc);
  buildToc(main, guide, doc);

  // 새로 그린 가이드의 맨 위는 늘 즉시 보인다(부드러운 이동은 단계로 갈 때만).
  scrollToStage(main, stageId, stageId ? smooth : false);

  const offProgress = trackScroll(main, article, doc);
  const offReveal = reveal(article);
  return () => { offProgress(); offReveal(); main.querySelector('#toc')?.close(); };
}

/**
 * 단계로 이동한다. 처음 그릴 때와 같은 가이드 안에서 단계만 바뀔 때 모두 이 함수만 거친다.
 * 없는 단계면 안내를 본문 맨 앞에 하나만 두고, 즉시 맨 위로 가서 초점을 가이드 제목으로 옮긴다.
 */
export function scrollToStage(main, stageId, smooth) {
  const article = main.querySelector('#doc');
  const target = stageId ? article?.querySelector(`#${CSS.escape(stageId)}`) : null;
  main.querySelector('.notice')?.remove();
  if (target) {
    scrollToTarget(target, smooth);
  } else if (stageId) {
    article?.prepend(notice(ui.stageMissing));
    scrollTo({ top: 0, behavior: 'instant' });
    focusTitle(article);
  } else {
    scrollTo({ top: 0, behavior: smooth && motionOK() ? 'smooth' : 'instant' });
  }
}

function focusTitle(article) {
  const h1 = article?.querySelector('h1');
  if (!h1) return;
  if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
  h1.focus({ preventScroll: true });
}

const skeleton = () => `
  <div class="skeleton" aria-hidden="true">
    <span class="sk sk--title"></span><span class="sk sk--line"></span><span class="sk sk--line"></span><span class="sk sk--line sk--short"></span>
    <span class="sk sk--block"></span><span class="sk sk--line"></span><span class="sk sk--line sk--short"></span>
  </div>
  <p class="visually-hidden" role="status">${ui.loading}</p>`;

function errorHtml(guide) {
  const src = `${site.repoUrl}/blob/${site.branch}/${guide.file}`;
  return `
    <div class="state state--error" role="alert">
      <h1 class="state__title">${ui.loadError}</h1>
      <p>${ui.loadErrorHint}</p>
      <div class="state__actions">
        <button type="button" class="btn btn--primary" data-retry>${ui.retry}</button>
        <a class="btn" href="${src}" target="_blank" rel="noopener noreferrer">${ui.sourceLink}<span class="visually-hidden"> ${ui.newTab}</span></a>
      </div>
    </div>`;
}

function notice(text) {
  const p = document.createElement('p');
  p.className = 'notice';
  p.setAttribute('role', 'status');
  p.textContent = text;
  return p;
}

/** siteConfig.visuals: 정해진 제목 바로 뒤에 비주얼. 제목이 없으면 그 비주얼만 건너뛴다. */
function placeVisuals(article, guide, doc) {
  siteConfig.visuals
    .filter((v) => v.guideId === guide.id && v.type === 'stage-ruler')
    .forEach((v) => {
      const heading = article.querySelector(`#${CSS.escape(v.headingId)}`);
      if (!heading) return;
      const insert = (source) => {
        const ruler = source && buildRuler(source);
        if (!ruler) return;
        const fig = document.createElement('figure');
        fig.className = 'visual';
        fig.append(ruler);
        heading.after(fig);
      };
      // 같은 문서면 바로 넣어 스크롤 위치가 밀리지 않게 한다.
      if (siteConfig.ruler.guideId === guide.id) insert(doc);
      else loadGuide(guideById(siteConfig.ruler.guideId)).then(insert, () => {});
    });
}

function buildToc(main, guide, doc) {
  const dialog = main.querySelector('#toc');
  const nav = dialog.querySelector('.toc__nav');
  const openBtn = main.querySelector('[data-toc-open]');
  const tree = (parentId) => {
    const kids = doc.headings.filter((h) => h.level > 1 && h.parentId === parentId);
    if (!kids.length) return '';
    return `<ol class="toc__list">${kids
      .map((h) => `<li class="toc__item toc__item--l${h.level}"><a class="toc__link" href="#/${guide.id}/${h.id}" data-smooth data-toc-id="${h.id}">${escapeHtml(h.title)}</a>${tree(h.id)}</li>`)
      .join('')}</ol>`;
  };
  nav.innerHTML = `<p class="toc__title">${escapeHtml(doc.title)}</p>${tree(null)}`;

  const open = () => {
    dialog.showModal();
    openBtn.setAttribute('aria-expanded', 'true');
    const current = nav.querySelector('[aria-current]') ?? nav.querySelector('a');
    current?.scrollIntoView({ block: 'center' });
    current?.focus();
  };
  // 닫을 때도 왼쪽으로 밀려 들어간 뒤 닫는다. 동작 줄이기면 바로 닫는다.
  let timer = 0;
  const close = () => {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (!motionOK()) { dialog.close(); return; }
    dialog.classList.add('is-closing');
    timer = setTimeout(() => dialog.close(), 400); // animationend가 오지 않을 때를 대비
  };
  openBtn.addEventListener('click', open);
  dialog.querySelector('[data-toc-close]').addEventListener('click', close);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('a')) close();
  });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dialog.addEventListener('animationend', (e) => {
    if (e.target === dialog && e.animationName === 'slide-out') dialog.close();
  });
  dialog.addEventListener('close', () => {
    clearTimeout(timer);
    dialog.classList.remove('is-closing');
    openBtn.setAttribute('aria-expanded', 'false');
  });
}

/** 진행 막대 + 현재 읽는 제목(목차 강조). 제목 위치는 크기가 바뀔 때만 다시 잰다. */
function trackScroll(main, article, doc) {
  const bar = document.querySelector('.progress__bar');
  const links = new Map([...main.querySelectorAll('[data-toc-id]')].map((a) => [a.dataset.tocId, a]));
  const heads = doc.headings.filter((h) => h.level > 1).map((h) => article.querySelector(`#${CSS.escape(h.id)}`)).filter(Boolean);
  let offsets = [];
  let current = null;
  let frame = 0;

  const measure = () => {
    const y = scrollY;
    offsets = heads.map((el) => el.getBoundingClientRect().top + y);
  };
  const update = () => {
    frame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    const line = scrollY + parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--anchor-offset') || '120') + 8;
    let idx = -1;
    for (let i = 0; i < offsets.length && offsets[i] <= line; i++) idx = i;
    const id = idx >= 0 ? heads[idx].id : null;
    if (id !== current) {
      links.get(current)?.removeAttribute('aria-current');
      if (id) links.get(id)?.setAttribute('aria-current', 'location');
      current = id;
    }
  };
  const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
  const ro = new ResizeObserver(() => { measure(); onScroll(); });
  ro.observe(article);
  addEventListener('scroll', onScroll, { passive: true });
  measure();
  update();
  return () => {
    removeEventListener('scroll', onScroll);
    ro.disconnect();
    cancelAnimationFrame(frame);
    if (bar) bar.style.transform = 'scaleX(0)';
  };
}
