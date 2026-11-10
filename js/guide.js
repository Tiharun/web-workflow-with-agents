// 가이드 화면: md 본문, 좌측 상단 도구([→ 목차] [⬇ md]), 목차 드로어, 진행 막대, 현재 위치, 등장 모션.
import { siteConfig } from './site-config.js';
import { loadGuide, readyDoc } from './md.js';
import { placeVisuals } from './visuals.js';
import { icon } from './icons.js';
import { escapeHtml } from './header.js';
import { motionOK, scrollToTarget, focusEl } from './scroll.js';
import { reveal } from './motion.js';
import { fontsFor } from './fonts.js';

const { ui, site } = siteConfig;

/**
 * @param {{ smooth?: boolean, focusTop?: boolean, onRetry: () => void }} options
 *   onRetry: [다시 시도] — 라우터가 지금 주소로 다시 그리고 정리 함수도 받는다.
 *   focusTop: 사용자가 누른 이동(다시 시도 포함)이면 결과 화면의 제목으로 초점을 옮긴다.
 * @returns {Promise<() => void>} 화면을 떠날 때 부르는 정리 함수
 */
export async function renderGuide(main, guide, stageId, { smooth = false, focusTop = false, onRetry } = {}) {
  // 이미 받은 문서면 스켈레톤 없이 바로 그린다(스펙 §5: 불러오는 동안만).
  const cached = readyDoc(guide);
  main.innerHTML = `
    <div class="guide" data-guide="${guide.id}">
      <div class="container guide__layout">
        <div class="guide-tools" role="toolbar" aria-label="${ui.toc}">
          <button type="button" class="tool-btn" data-toc-open aria-haspopup="dialog" aria-controls="toc" aria-expanded="false">${icon('right')}<span>${ui.toc}</span></button>
          <a class="tool-btn" href="${guide.file}" download="${escapeHtml(guide.downloadName)}" aria-label="${ui.downloadLabel}" data-tip="${ui.downloadLabel}">${icon('download')}<span aria-hidden="true">${ui.download}</span></a>
        </div>
        ${cached ? '<article class="doc" id="doc"></article>' : `<article class="doc" id="doc" aria-busy="true">${skeleton()}</article>`}
      </div>
      <dialog class="toc" id="toc" aria-label="${ui.toc}">
        <div class="toc__bar">
          <button type="button" class="tool-btn" data-toc-close>${icon('left')}<span>${ui.toc}</span><span class="visually-hidden">${ui.tocClose}</span></button>
        </div>
        <nav class="toc__nav" aria-label="${ui.toc}"></nav>
      </dialog>
    </div>`;

  const article = main.querySelector('#doc');
  let doc = cached;
  if (!doc) {
    try {
      doc = await loadGuide(guide);
    } catch {
      article.removeAttribute('aria-busy');
      article.innerHTML = errorHtml(guide);
      article.querySelector('[data-retry]').addEventListener('click', () => onRetry());
      // 다시 시도 버튼이 다시 그려지며 사라져도 초점이 body로 떨어지지 않게 한다.
      if (focusTop) focusEl(article.querySelector('h1'));
      return () => {};
    }
    if (!main.contains(article)) return () => {};
  }

  const skel = article.querySelector('.skeleton');
  article.replaceChildren(doc.template.content.cloneNode(true));
  placeVisuals(article, guide, doc);
  const first = drawFirstScreen(article);
  if (!cached) {
    // 첫 화면 글의 웹폰트가 오기 전에는 숨겨 둔다(자리는 잡혀 있다). 대체 글꼴로 그렸다가 바뀌면 줄 수가 달라져 아래가 밀린다.
    // 그동안 스켈레톤을 본문 위에 겹쳐 두어 빈 화면이 되지 않게 한다(첫 화면 블록을 고른 뒤에 넣어 계산에 끼지 않는다).
    article.dataset.fontWait = '';
    if (skel) article.append(skel);
    await fontsFor(first.map((el) => el.textContent).join(' '));
    if (!main.contains(article)) return () => {};
    delete article.dataset.fontWait;
    skel?.remove();
  }
  article.removeAttribute('aria-busy');
  article.dataset.loaded = ''; // 본문을 다 그렸다는 표시. 오류 상태에는 붙이지 않는다(라우터가 같은 가이드인지 볼 때 쓴다).
  document.title = `${doc.title} | ${site.name}`;
  buildToc(main, guide, doc);

  // 새로 그린 가이드의 맨 위는 늘 즉시 보인다(부드러운 이동은 단계로 갈 때만).
  scrollToStage(main, stageId, stageId ? smooth : false, { focusTop });

  const offProgress = trackScroll(main, article, doc);
  const offReveal = reveal(article);
  const offSizes = sizeBlocks(article);
  return () => { offProgress(); offReveal(); offSizes(); main.querySelector('#toc')?.close(); };
}

/**
 * 단계로 이동한다. 처음 그릴 때와 같은 가이드 안에서 단계만 바뀔 때 모두 이 함수만 거친다.
 * 없는 단계면 안내를 본문 맨 앞에 하나만 두고, 즉시 맨 위로 가서 초점을 가이드 제목으로 옮긴다.
 * focusTop: 맨 위로 갈 때도 초점을 가이드 제목으로 옮긴다(라우터가 사용자 이동에만 넘긴다. 첫 화면은 초점을 두지 않는다).
 */
export function scrollToStage(main, stageId, smooth, { focusTop = false } = {}) {
  const article = main.querySelector('#doc');
  const target = stageId ? article?.querySelector(`#${CSS.escape(stageId)}`) : null;
  main.querySelector('.notice')?.remove();
  announce('');
  if (target) {
    scrollToTarget(target, smooth);
  } else if (stageId) {
    article?.prepend(notice(ui.stageMissing));
    scrollTo({ top: 0, behavior: 'instant' });
    focusEl(article?.querySelector('h1'));
    announce(ui.stageMissing);
  } else {
    scrollTo({ top: 0, behavior: smooth && motionOK() ? 'smooth' : 'instant' });
    if (focusTop) focusEl(article?.querySelector('h1'));
  }
}

// 화면 낭독기 알림: 처음부터 있던 빈 #live에 글을 나중에 넣어야 확실히 읽힌다(글이 든 role="status"를 새로 끼우면 놓친다).
// 제목 초점 알림과 겹치지 않게 조금 뒤에 넣고, 같은 글이 다시 와도 읽히도록 먼저 비운다. 이 알림 글만 지운다(복사 알림은 두기).
let announceTimer;
function announce(text) {
  const live = document.getElementById('live');
  if (!live) return;
  clearTimeout(announceTimer);
  if (live.textContent === ui.stageMissing) live.textContent = '';
  if (text) announceTimer = setTimeout(() => { live.textContent = text; }, 150);
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

// 보이는 안내만 맡는다(낭독기 알림은 announce).
function notice(text) {
  const p = document.createElement('p');
  p.className = 'notice';
  p.textContent = text;
  return p;
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
  // 목차 항목으로 닫으면 그 제목 id를 기억해 둔다: 닫히는 동안은 모달이라 본문에 초점을 줄 수 없고,
  // dialog.close()는 초점을 [목차] 버튼으로 되돌린다. 그래서 close 이벤트(초점 복귀 뒤)에서 제목으로 옮긴다.
  let timer = 0;
  let chosenId = null;
  const close = () => {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (!motionOK()) { dialog.close(); return; }
    dialog.classList.add('is-closing');
    timer = setTimeout(() => dialog.close(), 400); // animationend가 오지 않을 때를 대비
  };
  openBtn.addEventListener('click', open);
  dialog.querySelector('[data-toc-close]').addEventListener('click', close);
  dialog.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-toc-id]');
    if (a) chosenId = a.dataset.tocId;
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
    if (chosenId) focusEl(main.querySelector('#doc').querySelector(`#${CSS.escape(chosenId)}`));
    chosenId = null;
  });
}

/**
 * 첫 화면(문서 맨 위에서 한 화면)에 걸친 본문 블록은 바로 그린다(content-visibility를 끈다).
 * 추정 높이로 먼저 그려졌다가 실제 높이로 바뀌면 아래 제목이 밀린다(측정: final 108px, steps 330px).
 * 블록마다 그 블록만 레이아웃하므로 첫 화면만큼의 비용이다. @returns {Element[]} 첫 화면 블록
 */
function drawFirstScreen(article) {
  const first = [];
  for (const el of article.children) {
    if (el.getBoundingClientRect().top + scrollY >= innerHeight) break;
    if (getComputedStyle(el).contentVisibility === 'auto') el.style.contentVisibility = 'visible';
    first.push(el);
  }
  return first;
}

/**
 * 화면 밖 본문 블록(content-visibility: auto, site.css)의 실제 높이를 쉬는 틈에 조금씩 재서 자리 높이로 둔다.
 * 추정 높이(10rem)로 남으면 문서 길이가 실제와 달라(측정: final 28% 과대) 맨 끝으로 한 번에 가지 못하고
 * 진행 막대·현재 위치가 어긋난다. 한 조각은 8ms 안팎이라 긴 작업을 만들지 않는다. 다 재면 data-sized를 붙인다.
 * 본문 폭이 바뀌거나(회전·창 크기) 웹폰트 하위 집합이 새로 오면(대체 글꼴로 잰 높이가 남는다) 처음부터 다시 잰다.
 */
function sizeBlocks(article) {
  const blocks = [...article.children].filter((el) => getComputedStyle(el).contentVisibility === 'auto');
  let i = 0, timer = 0, width = 0;
  const step = () => {
    const t0 = performance.now();
    while (i < blocks.length && performance.now() - t0 < 8) {
      const el = blocks[i++];
      // 이 블록만 잠시 그려 실제 높이를 읽는다. 격리(contain)는 그대로 둬야 자식 여백이 밖으로 겹치지 않아 화면과 같은 높이다.
      el.style.contentVisibility = 'visible';
      el.style.contain = 'layout style paint';
      // contain-intrinsic-size는 내용 상자 크기다. 안쪽 여백·테두리를 빼야 두 번 더해지지 않는다.
      const cs = getComputedStyle(el);
      const extra = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce((sum, k) => sum + parseFloat(cs[k]), 0);
      // auto를 붙이지 않는다. auto면 한 번 그려진 높이(대체 글꼴로 그렸을 수 있다)가 잰 값보다 앞선다(측정: 375px final 37px).
      el.style.containIntrinsicBlockSize = `${el.getBoundingClientRect().height - extra}px`;
      el.style.removeProperty('content-visibility');
      el.style.removeProperty('contain');
    }
    if (i < blocks.length) timer = setTimeout(step);
    else article.dataset.sized = '';
  };
  const restart = () => { clearTimeout(timer); i = 0; timer = setTimeout(step); };
  const ro = new ResizeObserver(([entry]) => {
    const w = entry.contentRect.width;
    if (w === width) return;
    width = w;
    restart();
  });
  ro.observe(article);
  document.fonts?.addEventListener('loadingdone', restart);
  return () => { ro.disconnect(); document.fonts?.removeEventListener('loadingdone', restart); clearTimeout(timer); };
}

/** 진행 막대 + 현재 읽는 제목(목차 강조). 제목 위치는 크기가 바뀔 때만 다시 잰다. */
function trackScroll(main, article, doc) {
  const bar = document.querySelector('.progress__bar');
  const links = new Map([...main.querySelectorAll('[data-toc-id]')].map((a) => [a.dataset.tocId, a]));
  const heads = doc.headings.filter((h) => h.level > 1).map((h) => article.querySelector(`#${CSS.escape(h.id)}`)).filter(Boolean);
  let offsets = [];
  let anchor = 0; // 제목이 멈추는 높이 = html scroll-padding-top의 계산값(px). 폭에 따라 바뀐다(84px ↔ 137px).
  let current = null;
  let frame = 0;

  const measure = () => {
    const y = scrollY;
    offsets = heads.map((el) => el.getBoundingClientRect().top + y);
    // 메뉴가 열린 동안은 루트 scroll-padding이 0이다(site.css). 그때 잰 값은 쓰지 않는다.
    if (!document.documentElement.classList.contains('is-nav-open')) anchor = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  };
  const update = () => {
    frame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    const line = scrollY + anchor + 8;
    let idx = -1;
    for (let i = 0; i < offsets.length && offsets[i] <= line; i++) idx = i;
    // 페이지 끝이면 마지막 제목: 끝의 짧은 절은 멈춤선까지 올라오지 못한다.
    // 단, 이동해 초점을 받은 제목이 화면 안에 있으면 그 제목이다(고른 곳이 먼저).
    if (max > 0 && scrollY >= max - 1) {
      const chosen = heads.indexOf(document.activeElement);
      const top = chosen > idx ? heads[chosen].getBoundingClientRect().top : -1;
      idx = top >= 0 && top < innerHeight ? chosen : heads.length - 1;
    }
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
  article.addEventListener('focusin', onScroll); // 굴림 없이 제목에 초점만 옮겨도(이미 끝에 있을 때) 다시 계산
  measure();
  update();
  return () => {
    removeEventListener('scroll', onScroll);
    article.removeEventListener('focusin', onScroll);
    ro.disconnect();
    cancelAnimationFrame(frame);
    if (bar) bar.style.transform = 'scaleX(0)';
  };
}
