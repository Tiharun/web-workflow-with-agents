// 모션: IntersectionObserver + GSAP (ADR 0003). 동작 줄이기면 GSAP를 받지도 않아 글이 바로 보인다.
// 스크립트가 꺼져 있거나 GSAP를 받지 못하면 블록을 숨기지 않으므로 글은 처음부터 보인다.
// GSAP는 첫 화면을 막지 않도록 필요할 때 받는다. 받은 순간 화면 아래에 있는 블록만 숨긴다.
// 한 번에 멀리 이동해 건너뛴 블록은 모션 없이 즉시 보인다(화면 안 블록만 차례로 올라온다).
import { motionOK } from './scroll.js';

// 모션이 끝나면 지우는 인라인 속성(배치용 인라인 style은 남긴다)
const CLEAR = 'opacity,transform,translate,rotate,scale,overflowAnchor';
const inViewport = (el) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight;
};

let loading = null;
let gsap = null; // 받은 뒤에만 채워진다(drawRuler가 기다리지 않고 쓴다)

/**
 * GSAP를 한 번만 받는다. 동작 줄이기거나 받지 못하면 null(다시 받지 않는다). 거부하지 않는다.
 * @returns {Promise<object | null>}
 */
export function loadMotion() {
  if (!motionOK()) return Promise.resolve(null);
  loading ??= import('../vendor/gsap/index.js').then((m) => (gsap = m.gsap), () => null);
  return loading;
}

/**
 * 블록이 화면에 들어올 때 한 번만 올라오며 나타난다. 같이 들어온 블록은 차례로(stagger).
 * 이미 화면 위나 안에 있는 블록은 건드리지 않는다. 투명도만 바꾸므로 제목에 초점을 옮길 수 있다.
 * @returns {() => void} 화면을 떠날 때 부르는 정리 함수
 */
export function reveal(root, selector = ':scope > *') {
  if (!motionOK() || !root) return () => {};
  let off = null;
  let cancelled = false;
  loadMotion().then((g) => {
    if (!g || cancelled || !root.isConnected) return;
    const all = [...root.querySelectorAll(selector)];
    // GSAP는 늦게 올 수 있다. 그 사이 이미 보인 글(화면 맨 아래 띠 포함)은 숨기지 않고, 화면 밖 블록만 숨긴다.
    const blocks = all.filter((el) => el.getBoundingClientRect().top >= innerHeight);
    if (!blocks.length) return;
    const hidden = new Set(blocks);
    const order = new Map(all.map((el, i) => [el, i]));
    // 숨은·올라오는 블록은 스크롤 앵커에서 뺀다. 아니면 브라우저가 이동(y)을 보정하려고 스크롤을 움직인다
    // (측정: 맨 끝으로 간 직후 7px 되돌아감, content-visibility 블록에서).
    const ctx = g.context(() => { g.set(blocks, { opacity: 0, y: 28, overflowAnchor: 'none' }); });
    const io = new IntersectionObserver((entries) => {
      const entered = entries.filter((e) => e.isIntersecting && hidden.has(e.target)).map((e) => e.target);
      if (!entered.length) return;
      // 멀리 이동하면 지나친 블록이 있다. 그 블록들에 stagger가 쌓이면 화면 안 블록이 몇 초씩 늦으므로 바로 보인다.
      const last = Math.max(...entered.map((el) => order.get(el)));
      const skipped = [...hidden].filter((el) => order.get(el) < last && !entered.includes(el));
      const seen = entered.filter(inViewport);
      const passed = [...skipped, ...entered.filter((el) => !seen.includes(el))];
      for (const el of [...seen, ...passed]) { hidden.delete(el); io.unobserve(el); }
      ctx.add(() => {
        if (passed.length) g.set(passed, { clearProps: CLEAR }); // 빈 목록이면 GSAP이 'target not found' 경고를 낸다
        if (seen.length) {
          g.to(seen, {
            // 차례 간격은 0.08초, 묶음 전체는 0.24초를 넘지 않는다(큰 묶음에서 마지막 블록이 오래 숨지 않게).
            opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: Math.min(0.08, 0.24 / (seen.length - 1 || 1)), overwrite: true, clearProps: CLEAR,
          });
        }
      });
      if (!hidden.size) io.disconnect();
    }, { rootMargin: '0px 0px -8% 0px' });
    blocks.forEach((el) => io.observe(el));
    off = () => { io.disconnect(); ctx.revert(); };
  });
  return () => { cancelled = true; off?.(); };
}

/**
 * 홈의 단계 자가 그려지는 한 번의 연출: 축이 왼쪽부터 그어지고, 눈금이 차례로 솟고, 숫자와 반복 구간이 뒤따른다.
 * 눈금과 축은 CSS 변수(--draw, --tick)로 늘린다(가상 요소는 직접 움직일 수 없다).
 * GSAP를 아직 받지 않았으면 연출 없이 정적 단계 자를 둔다.
 */
export function drawRuler(ruler) {
  if (!motionOK() || !ruler || !gsap) return;
  const list = ruler.querySelector('.ruler__list');
  const stops = ruler.querySelectorAll('.ruler__stop');
  const nums = ruler.querySelectorAll('.ruler__num');
  const names = ruler.querySelectorAll('.ruler__name');
  const loop = ruler.querySelector('.ruler__loop');
  // 인라인 style에 --i, --from 같은 배치 값이 있으므로 clearProps:'all' 대신 바꾼 속성만 지운다.
  const done = () => {
    list.style.removeProperty('--draw');
    stops.forEach((el) => el.style.removeProperty('--tick'));
    gsap.set([...nums, ...names, loop].filter(Boolean), { clearProps: CLEAR });
  };
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: done })
    .fromTo(list, { '--draw': 0 }, { '--draw': 1, duration: 1.1, ease: 'power3.inOut' })
    .fromTo(stops, { '--tick': 0 }, { '--tick': 1, duration: 0.6, stagger: 0.06 }, 0.25)
    .from(nums, { opacity: 0, y: 8, duration: 0.6, stagger: 0.06 }, 0.3);
  if (names.length) tl.from(names, { opacity: 0, duration: 0.6, stagger: 0.04 }, 0.6);
  if (loop) tl.from(loop, { opacity: 0, y: 6, duration: 0.7 }, 0.9);
}
