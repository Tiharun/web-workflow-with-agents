// 404.html 전용 진입점: 홈과 같은 헤더·푸터·툴팁을 붙인다.
// 404.html의 base 보정 스크립트 뒤에 불러와야 상대 경로(md, 해시 링크)가 맞는다.
import { initHeader } from './header.js';
import { initFooter } from './footer.js';
import { initTooltips } from './tooltip.js';

// 홈 링크는 JS가 꺼져도 맞도록 배포 주소로 적혀 있다. JS가 켜지면 지금 기준 주소(로컬이면 /)로 바꾼다.
document.querySelectorAll('[data-home]').forEach((a) => { a.href = document.baseURI; });

initHeader(document.getElementById('site-header'));
initFooter(document.getElementById('site-footer'));
initTooltips();
