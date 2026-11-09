// 주소 해석(순수 함수): 해시 → 홈 | 가이드(+단계 id) | 찾을 수 없음. DOM을 쓰지 않아 Node 단위 테스트에서 바로 불러온다.
import { guideById } from './site-config.js';

/** '#/final/0단계-준비' → { name: 'guide', guide, stageId } */
export function parse(hash) {
  let path = hash.replace(/^#\/?/, '');
  try { path = decodeURIComponent(path); } catch { /* 깨진 주소는 그대로 판정 */ }
  const [first = '', ...rest] = path.split('/').filter(Boolean);
  if (!first) return { name: 'home' };
  const guide = guideById(first);
  if (!guide) return { name: 'notfound' };
  return { name: 'guide', guide, stageId: rest.join('/') || null };
}
