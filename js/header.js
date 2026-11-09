// 공통 헤더: 사이트 이름, 가이드 버튼 3개 + 메가메뉴, 다크 모드, 768px 미만 햄버거 아코디언.
import { siteConfig } from './site-config.js';
import { loadGuide } from './md.js';
import { icon } from './icons.js';

const { ui, guides, site } = siteConfig;
const MODE_KEY = 'mode';
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
let header;

export function initHeader(mount) {
  mount.innerHTML = `
    <div class="container site-header__inner">
      <a class="brand" href="#/">${site.name}</a>
      <nav class="guide-nav" aria-label="${ui.menu}">
        <ul class="guide-nav__list">
          ${guides.map((g) => `
            <li class="guide-nav__item">
              <button type="button" class="guide-nav__btn" data-guide="${g.id}" aria-expanded="false" aria-controls="mega-${g.id}">
                <span>${g.menuLabel}</span>${icon('chevron', 'icon guide-nav__chev')}
              </button>
              <div class="mega" id="mega-${g.id}" hidden><div class="container mega__inner" data-mega-body="${g.id}"></div></div>
            </li>`).join('')}
        </ul>
      </nav>
      <div class="site-header__tools">
        <button type="button" class="icon-btn mode-toggle" aria-pressed="false" aria-label="${ui.darkMode}" data-tip="${ui.darkMode}">
          ${icon('moon', 'icon mode-toggle__moon')}${icon('sun', 'icon mode-toggle__sun')}
        </button>
        <button type="button" class="icon-btn nav-toggle" aria-expanded="false" aria-controls="mobile-nav" aria-label="${ui.openMenu}">
          ${icon('menu', 'icon nav-toggle__open')}${icon('close', 'icon nav-toggle__close')}
        </button>
      </div>
    </div>
    <div class="mobile-nav" id="mobile-nav" hidden>
      <div class="container mobile-nav__inner">
        ${guides.map((g) => `
          <section class="acc">
            <h2 class="acc__head">
              <button type="button" class="acc__btn" data-guide="${g.id}" aria-expanded="false" aria-controls="acc-${g.id}">
                <span>${g.menuLabel}</span>${icon('chevron', 'icon acc__chev')}
              </button>
            </h2>
            <div class="acc__panel" id="acc-${g.id}" data-acc-body="${g.id}" hidden></div>
          </section>`).join('')}
      </div>
    </div>`;
  header = mount;

  header.querySelectorAll('.guide-nav__btn').forEach((btn) => {
    btn.addEventListener('click', () => toggleMega(btn));
    btn.addEventListener('pointerenter', () => prefetch(btn.dataset.guide), { once: true });
  });
  header.querySelector('.nav-toggle').addEventListener('click', toggleMobile);
  header.querySelectorAll('.acc__btn').forEach((btn) => btn.addEventListener('click', () => toggleAccordion(btn)));
  header.addEventListener('click', (e) => { if (e.target.closest('a[href^="#/"]')) closeMenus(); });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = header.querySelector('.guide-nav__btn[aria-expanded="true"]');
    if (open) { closeMenus(); open.focus(); }
    else if (!header.querySelector('.mobile-nav').hidden) { closeMenus(); header.querySelector('.nav-toggle').focus(); }
  });
  document.addEventListener('click', (e) => { if (!header.contains(e.target)) closeMenus(); });
  matchMedia('(min-width: 48rem)').addEventListener('change', closeMenus);

  initMode();
}

export function setCurrentGuide(id) {
  header?.querySelectorAll('[data-guide]').forEach((el) => {
    if (el.dataset.guide === id) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
}

export function closeMenus() {
  if (!header) return;
  header.querySelectorAll('.guide-nav__btn').forEach((b) => {
    b.setAttribute('aria-expanded', 'false');
    document.getElementById(b.getAttribute('aria-controls')).hidden = true;
  });
  const toggle = header.querySelector('.nav-toggle');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', ui.openMenu);
  header.querySelector('.mobile-nav').hidden = true;
  document.documentElement.classList.remove('is-nav-open');
}

function toggleMega(btn) {
  const open = btn.getAttribute('aria-expanded') === 'true';
  closeMenus();
  if (open) return;
  btn.setAttribute('aria-expanded', 'true');
  document.getElementById(btn.getAttribute('aria-controls')).hidden = false;
  fillMenu(btn.dataset.guide, header.querySelector(`[data-mega-body="${btn.dataset.guide}"]`), 'mega');
}

function toggleMobile() {
  const toggle = header.querySelector('.nav-toggle');
  const open = toggle.getAttribute('aria-expanded') === 'true';
  closeMenus();
  if (open) return;
  toggle.setAttribute('aria-expanded', 'true');
  toggle.setAttribute('aria-label', ui.closeMenu);
  header.querySelector('.mobile-nav').hidden = false;
  document.documentElement.classList.add('is-nav-open');
}

function toggleAccordion(btn) {
  const open = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', String(!open));
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  panel.hidden = open;
  if (!open) fillMenu(btn.dataset.guide, panel, 'acc');
}

const prefetch = (id) => loadGuide(guides.find((g) => g.id === id)).catch(() => {});

/** 메뉴 본문: md 제목에서 만든 단계 버튼. 불러오는 동안만 뼈대를 보인다. */
async function fillMenu(id, body, kind) {
  if (body.dataset.filled) return;
  const guide = guides.find((g) => g.id === id);
  body.innerHTML = `<div class="menu-skeleton" aria-hidden="true"><span></span><span></span><span></span></div><span class="visually-hidden" role="status">${ui.loading}</span>`;
  try {
    const doc = await loadGuide(guide);
    body.innerHTML = kind === 'mega' ? megaHtml(guide, doc) : accHtml(guide, doc);
    body.dataset.filled = '1';
  } catch {
    body.innerHTML = `<p class="menu-error">${ui.loadError} <a href="#/${guide.id}">${guide.menuLabel}</a></p>`;
  }
}

const link = (guide, h, cls = '') => `<a class="${cls}" href="#/${guide.id}/${h.id}" data-smooth>${escapeHtml(h.title)}</a>`;

function megaHtml(guide, doc) {
  const expanded = doc.stages.find((s) => s.children.length);
  const chapters = doc.stages
    .map((s) => `<li${s === expanded ? ' class="is-expanded"' : ''}>${link(guide, s, 'mega__link')}</li>`)
    .join('');
  const stagesCol = expanded
    ? `<div class="mega__col mega__col--stages">
         <p class="mega__caption" id="mega-cap-${guide.id}">${escapeHtml(expanded.title)}</p>
         <ol class="mega__stages" aria-labelledby="mega-cap-${guide.id}">${expanded.children.map((c) => `<li>${link(guide, c, 'mega__stage')}</li>`).join('')}</ol>
       </div>`
    : '';
  return `
    <div class="mega__col mega__col--head">
      <p class="mega__title">${guide.menuLabel}</p>
      <a class="mega__top" href="#/${guide.id}" data-smooth>${ui.guideTop}${icon('right')}</a>
    </div>
    <div class="mega__col mega__col--chapters${expanded ? '' : ' is-wide'}"><ol class="mega__chapters">${chapters}</ol></div>
    ${stagesCol}`;
}

function accHtml(guide, doc) {
  const items = doc.stages
    .map((s) => `<li>${link(guide, s, 'acc__link')}${s.children.length ? `<ol class="acc__sub">${s.children.map((c) => `<li>${link(guide, c, 'acc__link acc__link--sub')}</li>`).join('')}</ol>` : ''}</li>`)
    .join('');
  return `<a class="acc__top" href="#/${guide.id}" data-smooth>${ui.guideTop}${icon('right')}</a><ol class="acc__list">${items}</ol>`;
}

export const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* 다크 모드: 저장값이 없으면 기기 설정을 따른다. 저장은 이 기기의 localStorage 한 곳. */
function initMode() {
  const btn = header.querySelector('.mode-toggle');
  const isDark = () => (document.documentElement.dataset.mode ?? (darkQuery.matches ? 'dark' : 'light')) === 'dark';
  const sync = () => btn.setAttribute('aria-pressed', String(isDark()));
  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.dataset.mode = next;
    try { localStorage.setItem(MODE_KEY, next); } catch { /* 저장 못 해도 이번 화면에는 적용 */ }
    sync();
  });
  darkQuery.addEventListener('change', sync);
  sync();
}
