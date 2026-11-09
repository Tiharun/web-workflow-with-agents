// 툴팁: 포인터·포커스·탭으로 열고 Esc로 닫는다. 툴팁 위로 포인터를 옮겨도 유지한다(WCAG 1.4.13).
// 스크롤: 키보드 초점(:focus-visible)을 가진 주인이면 툴팁이 따라가고, 화면 밖이면 잠시 감췄다가 돌아오면 다시 보인다.
// 포인터·탭으로 연 툴팁은 스크롤하면 닫는다.
let tip;
let owner = null;
let hideTimer = 0;

export function initTooltips() {
  tip = document.createElement('div');
  tip.className = 'tooltip';
  tip.id = 'tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.append(tip);

  const hover = matchMedia('(hover: hover)');
  document.addEventListener('pointerover', (e) => {
    if (!hover.matches || e.pointerType === 'touch') return;
    const el = e.target.closest('[data-tip]');
    if (el) show(el);
  });
  document.addEventListener('pointerout', (e) => {
    const el = e.target.closest('[data-tip]');
    if (el && el === owner && !el.contains(e.relatedTarget) && !tip.contains(e.relatedTarget)) scheduleHide();
  });
  tip.addEventListener('pointerenter', () => clearTimeout(hideTimer));
  tip.addEventListener('pointerleave', scheduleHide);
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest?.('[data-tip]');
    if (el && el.matches(':focus-visible')) show(el);
    else if (owner && !el) hide();
  });
  document.addEventListener('focusout', (e) => { if (e.target === owner) scheduleHide(); });
  document.addEventListener('click', (e) => {
    const el = e.target.closest('.term[data-tip]');
    if (el) { owner === el && !tip.hidden ? hide() : show(el); return; }
    if (!tip.contains(e.target)) hide();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !owner) return;
    if (!tip.hidden) e.stopPropagation(); // 잠시 감춘 상태면 Esc를 다른 곳(대화상자 등)에 넘긴다
    hide();
  }, true);
  addEventListener('scroll', () => {
    if (!owner) return;
    if (owner !== document.activeElement || !owner.matches(':focus-visible')) { hide(); return; }
    const r = owner.getBoundingClientRect();
    tip.hidden = !(r.bottom > 0 && r.top < innerHeight);
    if (!tip.hidden) place(owner);
  }, { passive: true });
  addEventListener('resize', hide);
}

function show(el) {
  clearTimeout(hideTimer);
  if (owner && owner !== el) owner.removeAttribute('aria-describedby');
  owner = el;
  tip.textContent = el.dataset.tip;
  tip.hidden = false;
  if (el.getAttribute('aria-label') !== el.dataset.tip) el.setAttribute('aria-describedby', tip.id);
  place(el);
}

function place(el) {
  const r = el.getBoundingClientRect();
  const t = tip.getBoundingClientRect();
  const gap = 8;
  const margin = 12;
  let top = r.bottom + gap;
  if (top + t.height > innerHeight - margin) top = r.top - gap - t.height;
  const left = Math.min(Math.max(margin, r.left + r.width / 2 - t.width / 2), innerWidth - t.width - margin);
  tip.style.translate = `${Math.round(left)}px ${Math.round(top)}px`;
}

function scheduleHide() {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(hide, 150);
}

function hide() {
  clearTimeout(hideTimer);
  if (!tip || !owner) return; // 잠시 감춘 툴팁도 주인을 놓아야 하므로 hidden이 아니라 owner로 본다
  tip.hidden = true;
  owner?.removeAttribute('aria-describedby');
  owner = null;
}
