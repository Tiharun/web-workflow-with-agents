// 스크롤 이동: 부드러운 이동은 메가메뉴·목차에서 온 이동에만, 동작 줄이기면 즉시 이동.
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
export const motionOK = () => !reduce.matches;

/** 제목으로 이동하고 키보드 초점도 그 제목으로 옮긴다(화면은 움직이지 않게). */
export function scrollToTarget(el, smooth = false) {
  el.scrollIntoView({ block: 'start', behavior: smooth && motionOK() ? 'smooth' : 'instant' });
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}
