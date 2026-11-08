// 홈: 히어로(사이트 이름, 한 줄 요약, 단계 자) + 가이드 입구 카드 3개. (.impeccable/surfaces/home.md)
import { marked } from '../vendor/marked/marked.esm.js';
import { siteConfig, guideById } from './site-config.js';
import { loadGuide } from './md.js';
import { buildRuler } from './ruler.js';
import { icon } from './icons.js';
import { reveal, drawRuler } from './motion.js';

const { site, home, guides, ui } = siteConfig;

export function renderHome(main) {
  document.title = site.name;
  const featured = guideById(home.featuredGuideId);
  const others = guides.filter((g) => g !== featured);

  main.innerHTML = `
    <div class="home">
      <section class="container hero" aria-labelledby="home-title">
        <div class="hero__text">
          <h1 class="hero__title" id="home-title">${site.name}</h1>
          <p class="hero__lead">${marked.parseInline(home.lead)}</p>
        </div>
        <div class="hero__visual" data-hero-visual>
          <div class="ruler-skeleton" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
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

  const slot = main.querySelector('[data-hero-visual]');
  loadGuide(guideById(siteConfig.ruler.guideId))
    .then((doc) => {
      const ruler = buildRuler(doc);
      if (!ruler) throw new Error('no stages');
      slot.replaceChildren(ruler);
      drawRuler(ruler);
    })
    .catch(() => { slot.hidden = true; });

  return reveal(main.querySelector('.home'), '.hero__visual, .entry__grid > li');
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
