// 404.html 전용 진입점: 홈과 같은 헤더·푸터·툴팁을 붙인다.
// 404.html의 base 보정 스크립트 뒤에 불러와야 상대 경로(md, 해시 링크)가 맞는다.
import { initHeader } from './header.js';
import { initFooter } from './footer.js';
import { initTooltips } from './tooltip.js';

initHeader(document.getElementById('site-header'));
initFooter(document.getElementById('site-footer'));
initTooltips();
