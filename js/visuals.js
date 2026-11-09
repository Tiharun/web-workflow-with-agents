// 비주얼: md 제목 바로 뒤에 붙는 그림(스펙 §3). 글은 바꾸지 않고 그림만 더한다.
// M6에서 비주얼을 더하려면 visualTypes에 type 하나, siteConfig.visuals에 항목 하나를 더한다.
import { siteConfig } from './site-config.js';
import { buildRuler } from './ruler.js';
import { stepsFlow, designFlow, docMap, quickPaths } from './diagrams.js';

/** type → (doc, guide, item) => Element | null(HTML·SVG 요소). item은 siteConfig.visuals 항목. null이면 그 비주얼만 숨긴다(오류 아님). builder는 동기 함수다. */
export const visualTypes = {
  // 단계 자는 최종 워크플로우 가이드에만 붙는다(다른 가이드의 문서로는 단계를 만들 수 없다).
  'stage-ruler': (doc, guide) => (guide.id === siteConfig.ruler.guideId ? buildRuler(doc) : null),
  'steps-flow': stepsFlow,
  'design-flow': designFlow,
  'doc-map': docMap,
  'quick-paths': quickPaths,
};

/**
 * list에서 이 가이드의 비주얼을 등록 순서대로, 정해진 제목 바로 뒤에 넣는다.
 * 제목이 없거나 builder가 null이면 그 비주얼만 건너뛴다(스펙 §5).
 * 모르는 type·builder 예외는 reportError로 알리고 그 비주얼만 건너뛴다. 나머지 화면(목차·진행 막대·모션)은 계속 그린다.
 */
export function placeVisuals(article, guide, doc, list = siteConfig.visuals) {
  const last = new Map(); // 제목 → 그 제목 뒤에 마지막으로 넣은 figure (같은 제목이면 등록 순서대로 잇는다)
  for (const item of list) {
    const { guideId, headingId, type } = item;
    if (guideId !== guide.id) continue;
    const heading = article.querySelector(`#${CSS.escape(headingId)}`);
    if (!heading) continue;
    const build = Object.hasOwn(visualTypes, type) ? visualTypes[type] : null; // 'toString' 같은 원형 키는 종류가 아니다
    if (typeof build !== 'function') {
      reportError(new Error(`알 수 없는 비주얼 종류: ${type}`));
      continue;
    }
    let el;
    try {
      el = build(doc, guide, item);
      if (el != null && !(el instanceof Element)) throw new TypeError('builder가 요소가 아닌 값을 돌려줌');
    } catch (err) {
      reportError(new Error(`비주얼을 그리지 못함: ${type} → #${headingId}`, { cause: err }));
      continue;
    }
    if (!el) continue;
    const fig = document.createElement('figure');
    fig.className = 'visual';
    fig.append(el);
    (last.get(heading) ?? heading).after(fig);
    last.set(heading, fig);
  }
}
