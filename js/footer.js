// 공통 푸터: 사이트 이름, 가이드 링크, 저장소 링크.
// footerHtml은 DOM을 쓰지 않아 Node 단위 테스트에서 바로 불러올 수 있다(header.js는 import하지 않는다).
import { siteConfig } from './site-config.js';

export function footerHtml({ site, guides, ui }) {
  const items = guides
    .map((g) => `<li><a class="site-footer__link" href="#/${g.id}">${g.menuLabel}</a></li>`)
    .join('');
  return `<div class="container site-footer__inner">
    <a class="brand" href="#/">${site.name}</a>
    <nav class="site-footer__nav" aria-label="${ui.guides}"><ul class="site-footer__list" role="list">${items}</ul></nav>
    <a class="site-footer__link" href="${site.repoUrl}" target="_blank" rel="noopener noreferrer">${ui.repo}<span class="visually-hidden"> ${ui.newTab}</span></a>
  </div>`;
}

export function initFooter(mount) {
  mount.innerHTML = footerHtml(siteConfig);
}
