// 모션: GSAP + ScrollTrigger (ADR 0003). 동작 줄이기면 아무것도 하지 않아 글이 바로 보인다.
// 스크립트가 꺼져 있으면 이 파일이 돌지 않으므로 글은 처음부터 보인다.
// 한 번에 멀리 이동해 건너뛴 블록은 모션 없이 즉시 보인다(화면 안 블록만 차례로 올라온다).
import { gsap } from '../vendor/gsap/index.js';
import { ScrollTrigger } from '../vendor/gsap/ScrollTrigger.js';
import { motionOK } from './scroll.js';

gsap.registerPlugin(ScrollTrigger);

// 모션이 끝나면 지우는 인라인 속성(배치용 인라인 style은 남긴다)
const CLEAR = 'opacity,transform,translate,rotate,scale';
const inViewport = (el) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight;
};

/**
 * 블록이 화면에 들어올 때 한 번만 올라오며 나타난다. 같이 들어온 블록은 차례로(stagger).
 * 이미 화면 위나 안에 있는 블록은 건드리지 않는다. 투명도만 바꾸므로 제목에 초점을 옮길 수 있다.
 * @returns {() => void} 화면을 떠날 때 부르는 정리 함수
 */
export function reveal(root, selector = ':scope > *') {
  if (!motionOK() || !root) return () => {};
  const blocks = [...root.querySelectorAll(selector)].filter((el) => el.getBoundingClientRect().top > innerHeight * 0.92);
  if (!blocks.length) return () => {};
  const ctx = gsap.context(() => {
    gsap.set(blocks, { opacity: 0, y: 28 });
    ScrollTrigger.batch(blocks, {
      start: 'top 92%',
      once: true,
      // 멀리 이동하면 지나친 블록까지 한 묶음으로 온다. 그 블록들에 stagger가 쌓이면 화면 안 블록이 몇 초씩 늦으므로 바로 보인다.
      onEnter: (batch) => {
        const seen = batch.filter(inViewport);
        const passed = batch.filter((el) => !seen.includes(el));
        if (passed.length) gsap.set(passed, { clearProps: CLEAR }); // 빈 목록이면 GSAP이 'target not found' 경고를 낸다
        if (seen.length) {
          gsap.to(seen, {
            // 차례 간격은 0.08초, 묶음 전체는 0.24초를 넘지 않는다(큰 묶음에서 마지막 블록이 오래 숨지 않게).
            opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: Math.min(0.08, 0.24 / (seen.length - 1 || 1)), overwrite: true, clearProps: CLEAR,
          });
        }
      },
    });
  });
  return () => ctx.revert();
}

/**
 * 홈의 단계 자가 그려지는 한 번의 연출: 축이 왼쪽부터 그어지고, 눈금이 차례로 솟고, 숫자와 반복 구간이 뒤따른다.
 * 눈금과 축은 CSS 변수(--draw, --tick)로 늘린다(가상 요소는 직접 움직일 수 없다).
 */
export function drawRuler(ruler) {
  if (!motionOK() || !ruler) return;
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
