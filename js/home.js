// 홈: 히어로(사이트 이름, 한 줄 요약, 단계 자) + 가이드 입구 카드 3개. (.impeccable/surfaces/home.md)
import { marked } from '../vendor/marked/marked.esm.js';
import { siteConfig, guideById } from './site-config.js';
import { loadGuide, readyDoc } from './md.js';
import { buildRuler } from './ruler.js';
import { icon } from './icons.js';
import { reveal, drawRuler, loadMotion } from './motion.js';
import { fontsFor } from './fonts.js';

const { site, home, guides, ui } = siteConfig;

/** @returns {Promise<() => void>} 화면을 떠날 때 부르는 정리 함수 */
export async function renderHome(main) {
  document.title = site.name;
  const featured = guideById(home.featuredGuideId);
  const others = guides.filter((g) => g !== featured);
  const rulerGuide = guideById(siteConfig.ruler.guideId);
  const cached = readyDoc(rulerGuide); // 이미 받았으면 스켈레톤 없이 바로 그린다

  main.innerHTML = `
    <div class="home" data-font-wait>
      <section class="container hero" aria-labelledby="home-title">
        <div class="hero__text">
          <h1 class="hero__title" id="home-title">${site.name}</h1>
          <p class="hero__lead">${marked.parseInline(home.lead)}</p>
        </div>
        <div class="hero__visual" data-hero-visual>
          ${cached ? '' : '<div class="ruler-skeleton" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>'}
        </div>
      </section>
      <section class="container entry" aria-labelledby="entry-title">
        <h2 class="visually-hidden" id="entry-title">${ui.guides}</h2>
        <ul class="entry__grid" role="list">
          <li class="entry__featured">${card(featured, true)}</li>
          ${others.map((g) => `<li>${card(g)}</li>`).join('')}
        </ul>
      </section>
    </div>`;

  // 자리는 바로 잡고(푸터가 위로 올라왔다 밀리지 않게), 글은 글꼴이 온 뒤 보인다.
  // 대체 글꼴로 그렸다가 바뀌면 히어로 문장의 줄 수가 달라져 카드가 밀린다(숨은 동안의 이동은 보이지 않는다).
  const homeEl = main.querySelector('.home');
  await fontsFor(homeEl.textContent);
  homeEl.removeAttribute('data-font-wait');

  const slot = main.querySelector('[data-hero-visual]');
  // 그리다 실패하면 칸만 숨긴다(캐시 경로도 같은 처리, 화면 전환은 계속된다).
  const show = (doc) => { try { showRuler(slot, doc); } catch { slot.hidden = true; } };
  if (cached) show(cached);
  // 처음이면 GSAP도 함께 기다려 단계 자를 연출과 함께 붙인다(loadMotion은 거부하지 않으므로 실패는 md만이다).
  else Promise.all([loadGuide(rulerGuide), loadMotion()]).then(([doc]) => show(doc), () => { slot.hidden = true; });

  return reveal(homeEl, '.hero__visual, .entry__grid > li');
}

/** 단계 자를 칸에 넣는다. 단계가 없으면 칸을 숨긴다. */
function showRuler(slot, doc) {
  const ruler = buildRuler(doc);
  if (!ruler) { slot.hidden = true; return; }
  slot.replaceChildren(ruler);
  drawRuler(ruler);
}

/** 카드 전체가 링크. 소개는 자르지 않는다. */
function card(guide, featured = false) {
  const [, num = guide.stageCount, unit = ''] = guide.stageCount.match(/^([\d~]+)(.*)$/) ?? [];
  return `
    <a class="card${featured ? ' card--featured' : ''}" href="#/${guide.id}">
      <div class="card__body">
        <h3 class="card__title">${guide.menuLabel}</h3>
        <p class="card__text">${marked.parseInline(guide.summary)}</p>
      </div>
      <div class="card__foot">
        <p class="card__count"><span class="card__num">${num}</span><span class="card__unit">${unit}</span></p>
        ${icon('right', 'icon card__go')}
      </div>
    </a>`;
}
