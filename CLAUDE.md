# CLAUDE.md — 웹사이트 제작 워크플로우 가이드

## 목적
`content/`의 워크플로우 md 3개를 읽기 쉽게 보여 주는 개인용 단일 HTML 가이드 사이트(GitHub Pages).

## 스택
- 바닐라 HTML·CSS·ES 모듈, 빌드 없음, 해시 라우터(`#/`, `#/<가이드 id>`, `#/<가이드 id>/<제목 id>`)
- 라이브러리는 `vendor/`에 내려받아 둔다(GSAP 3.15.0, marked 등). CDN·npm 의존 없음
- 진입점 `index.html` → `css/site.css`(tokens·base 포함), `js/main.js`

## 명령
- 실행: `python -m http.server 8000 --bind 127.0.0.1` → http://127.0.0.1:8000 (`.claude/launch.json`의 `static`)
- 빌드: 없음(파일을 그대로 배포)
- 테스트:
  - `npm test` — 단위(node:test) + e2e(Playwright). 테스트 서버는 `tests/serve.py`가 8123 포트로 자동 실행
  - `npm run test:visual` — 시각 기준 대조(375·768·1280·1440 × 라이트·다크, Windows 기준 이미지). 갱신: `npm run test:visual -- --update-snapshots`
  - 슬롭 검사: `node ~/.claude/skills/hallmark/scripts/sloplint.mjs css/site.css index.html --genre modern-minimal --scope app`
  - 디자인 검사: `impeccable detect --json <파일>`
  - 브라우저: 콘솔 오류 0, Lighthouse 성능·접근성 90 이상(chrome-devtools-mcp)

## 문서 지도
- `docs/brief.md` — 목적·기능·세부 규칙·완료 기준. 결정이 바뀌면 여기부터 고친다
- `GLOSSARY.md` — 용어 정의. 코드·문서의 이름은 여기를 따른다
- `docs/adr/` — 되돌리기 어려운 결정 기록(md 런타임 렌더, 해시 라우팅, 프레임워크 없음)
- `PRODUCT.md` — 사용자·톤·접근성 목표 등 제품 맥락
- `DESIGN.md` — 색·글꼴·간격·모서리·그림자·컴포넌트 규칙(값은 `css/tokens.css`)
- `.impeccable/design.json` — DESIGN.md 사이드카(그림자·모션·브레이크포인트)
- `docs/specs/` — 기능 명세(`2026-11-08-guide-site-design.md`)
- `docs/plans/` — 구현 계획(`2026-11-08-m0-skeleton-deploy.md`)

## 규칙
1. 색·글꼴은 DESIGN.md와 `css/tokens.css`의 토큰만 쓴다. 토큰 블록 밖에 색 값·`font-family`를 직접 쓰지 않는다. 새 값이 필요하면 DESIGN.md부터 고친다
2. 사이트 이름·URL·저장소 주소는 `js/site-config.js` 한 곳에서만 관리하고 다른 곳에 하드코딩하지 않는다
3. 공용 컴포넌트를 재사용한다: 버튼 `.btn`/`.tool-btn`/`.icon-btn`, 카드 `.card`, 아이콘 `js/icons.js`, 툴팁 `js/tooltip.js`, md 변환 `js/md.js`, 모션 `js/motion.js`. 같은 역할을 새로 만들지 않는다
4. md 원문 문장은 바꾸지 않는다. 모양만 재구성한다(`docs/brief.md`)
5. 모션은 `transform`·`opacity`만, `prefers-reduced-motion`이면 즉시 표시, 스크립트가 꺼져도 글이 보여야 한다
6. 완료 보고 전에 위 검사 출력과 스크린샷(1440·768·375px, 라이트·다크)을 제시한다. 직접 확인하지 못한 항목은 "확인 못 함"으로 적는다
7. 리뷰·검증에서 나온 사소한 문제(Minor)도 미루지 않고 그 작업 안에서 테스트로 재현해 고친다(2026-11-09 결정)
