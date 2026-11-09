// 앱 시작: 헤더, 해시 라우터(#/, #/<가이드>, #/<가이드>/<제목 id>, 그 밖은 찾을 수 없음), 복사 버튼.
import { siteConfig } from './site-config.js';
import { parse } from './router.js';
import { initHeader, setCurrentGuide, closeMenus } from './header.js';
import { initFooter } from './footer.js';
import { initTooltips } from './tooltip.js';
import { renderHome } from './home.js';
import { renderGuide, scrollToStage } from './guide.js';
import { focusEl } from './scroll.js';
import { loadGuide } from './md.js';
import { icon } from './icons.js';

const { ui, site, guides } = siteConfig;
const main = document.getElementById('main');
let view = { name: null, guideId: null };
let cleanup = () => {};
let smoothNext = false;
let focusNext = false; // 본문(md) 안 링크로 이동: 누른 링크가 사라지므로 새 화면 제목에 초점을 둔다

document.title = site.name;
initHeader(document.getElementById('site-header'));
initFooter(document.getElementById('site-footer'));
initTooltips();

// focusTop: 화면을 새로 그릴 때, 사용자가 누른 이동(같은 주소 다시 누름·다시 시도)이면 초점을 제목으로 옮긴다.
// 첫 실행·hashchange는 넘기지 않는다. 같은 가이드 안 이동은 단계로 갈 때처럼 늘 제목에 초점을 둔다.
async function route({ focusTop: focusAsked = false } = {}) {
  const next = parse(location.hash);
  const smooth = smoothNext;
  const focusTop = focusAsked || focusNext;
  smoothNext = false;
  focusNext = false;
  closeMenus();
  setCurrentGuide(next.guide?.id ?? null);

  if (next.name === 'guide' && view.name === 'guide' && view.guideId === next.guide.id && main.querySelector('#doc[data-loaded]')) {
    scrollToStage(main, next.stageId, smooth, { focusTop: true });
    return;
  }

  cleanup();
  cleanup = () => {};
  view = { name: next.name, guideId: next.guide?.id ?? null };
  document.documentElement.dataset.view = next.name;

  if (next.name === 'home') {
    cleanup = renderHome(main);
    scrollTo({ top: 0, behavior: 'instant' });
    if (focusTop) focusEl(main.querySelector('h1'));
  } else if (next.name === 'guide') {
    const done = await renderGuide(main, next.guide, next.stageId, { smooth, focusTop, onRetry: () => route({ focusTop: true }) });
    if (view.guideId === next.guide.id) cleanup = done;
    else done();
  } else {
    renderNotFound();
    scrollTo({ top: 0, behavior: 'instant' });
    if (focusTop) focusEl(main.querySelector('h1'));
  }
}

function renderNotFound() {
  document.title = `${ui.notFoundTitle} | ${site.name}`;
  main.innerHTML = `
    <div class="container state state--notfound">
      <h1 class="state__title">${ui.notFoundTitle}</h1>
      <p>${ui.notFoundBody}</p>
      <ul class="state__links" role="list">
        ${guides.map((g) => `<li><a class="state__link" href="#/${g.id}"><span>${g.menuLabel}</span>${icon('right')}</a></li>`).join('')}
      </ul>
    </div>`;
}

// 메가메뉴·목차·단계 자(data-smooth)에서 누른 이동만 부드럽게 스크롤한다.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.hasAttribute('data-smooth')) smoothNext = true;
  if (a.closest('#doc')) focusNext = true;
  // 같은 주소를 다시 누르면(예: 푸터의 현재 가이드 링크) hashchange가 없으므로 직접 이동한다.
  // a.hash·location.hash 모두 퍼센트 인코딩된 값이라 한글 단계 id도 그대로 비교된다.
  if (a.hash === location.hash) { e.preventDefault(); route({ focusTop: true }); }
});

// 본문 바로가기: 해시를 쓰지 않고 초점만 옮긴다(해시는 라우터 몫).
document.querySelector('.skip-link').addEventListener('click', (e) => {
  e.preventDefault();
  focusEl(main.querySelector('h1') ?? main, { preventScroll: false });
});

// 프롬프트 카드 복사
const live = document.getElementById('live');
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const text = btn.closest('.prompt')?.querySelector('code')?.textContent ?? '';
  let ok = true;
  try { await navigator.clipboard.writeText(text); } catch { ok = fallbackCopy(text); }
  const label = btn.querySelector('[data-copy-label]');
  btn.classList.toggle('is-done', ok);
  label.textContent = ok ? ui.copied : ui.copyFailed;
  live.textContent = label.textContent;
  clearTimeout(btn._t);
  btn._t = setTimeout(() => { label.textContent = ui.copy; btn.classList.remove('is-done'); live.textContent = ''; }, 1800);
});

function fallbackCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.className = 'visually-hidden';
  document.body.append(area);
  area.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  area.remove();
  return ok;
}

addEventListener('hashchange', route);
route();

// 첫 화면 뒤 한가할 때 나머지 md를 미리 받아 둔다(메가메뉴가 바로 열리게).
(window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1200)))(() => guides.forEach((g) => loadGuide(g).catch(() => {})));
