# M7 출시 게이트 기록 (2026-11-09 ~ 11-10)

브랜치 `m7-quality`, 기준 `main`(d5e322d). 근거 종류: **측정**(이 PC에서 실행한 명령·테스트), **검색**(출처 링크), **미확인**.

## brief 성공 기준

| 기준 | 판정 | 근거 |
|---|---|---|
| GitHub Pages 주소가 휴대폰과 PC에서 열린다 | 일부 | 측정: 배포 전이라 로컬 기준. `subpath.spec.mjs`(하위 경로 홈·가이드·404 요청 실패·콘솔 오류 0), 모바일 에뮬레이션(375px) 전 테스트 통과. **실제 휴대폰은 확인 못 함(사용자 확인 필요)** |
| md 3개의 모든 제목이 사이트에 있다 | 통과 | 측정: `md-render.spec.mjs` › `every md heading is on screen (final·steps·design)` |
| 홈에서 원하는 단계까지 탭 두 번 | 통과 | 측정: `navigation.spec.mjs` › `home to any stage in two clicks` |
| 375·768·1280·1440·1920px 깨짐·가로 넘침 없음 | 통과 | 측정: `layout.spec.mjs` › `no horizontal overflow`(5폭 + 200%·400%, 화면 9종), 시각 기준 96장 일치 |
| '동작 줄이기'에서 모션 없이 바로 보임 | 통과 | 측정: `motion.spec.mjs` › `reduced motion shows every block at once`, `reduced motion never downloads GSAP` |
| Lighthouse 성능·접근성 90 이상 | 미정 | 아래 표. 로컬 대리 지표는 접근성 100, 성능 79~82. **판정은 배포본(Task 8)** |
| WCAG 2.2 AA | 통과 | 측정: `a11y.spec.mjs`(axe WCAG 2.2 AA, 화면 9종 × 라이트·다크 × 375·1280, 픽셀 대비), `keyboard.spec.mjs`(Tab 도달·초점 표시·가림·잘림, 24px), `layout.spec.mjs` › `zoomed 200%/400%` |

## 스펙 M7 완료 기준

1. Lighthouse 성능·접근성 90 이상(배포본, 모바일·데스크톱): **Task 8에서 채움**
2. 375~1920px 가로 넘침 없음: 통과(위 넘침 테스트, 320px@400% 포함)
3. 키보드 전부 조작, 200% 확대에도 안 깨짐: 통과(`keyboard.spec.mjs`, `zoomed 200%`)

## Lighthouse

| 대상 | home | final | steps | design | 비고 |
|---|---|---|---|---|---|
| main, 로컬 HTTP/2 대리(모바일 성능) | 79 | 61 | 69 | 69 | 측정, 3회 중앙값 |
| m7-quality, 로컬 HTTP/2 대리(모바일 성능) | 82 | 81 | 81 | 79 | 측정, CLS 0, 접근성 100 |
| 배포본 모바일·데스크톱 | — | — | — | — | Task 8(병합 뒤 `npm run lighthouse`) |

모바일 성능이 90에 못 미치는 원인(측정): Lighthouse 시뮬레이션의 FCP에는 첫 그림 전에 시작한 요청이 모두 들어간다. Pretendard 하위 집합 13개(약 330KB)가 대부분을 차지한다.

## 수동 검사 (측정)

- 전체 테스트 `npm test`: 단위 40, DOM 45, e2e 364 통과(3.1분)
- 시각 `npm run test:visual`: 96 통과
- sloplint(CSS 3개 + index.html): 0 FAIL, 7 WARN(출발점 8)
- `impeccable detect`: advisory 4(출발점과 같음) + warning 1(`:hover` #a8c8ff on #6ea8fe). 이 경고는 정적 분석의 오탐이다. 실제 브라우저에서 모든 링크·버튼을 hover한 뒤 대비를 재면 4.5:1 미만은 없다. `.btn--primary:hover`가 `a:hover`보다 우선한다
- 콘솔 오류: chrome-devtools-mcp로 `#/`·`#/final`·`#/steps`·`#/design`을 열었을 때 0건
- 스크린샷: 5개 화면 × 1440·768·375 × 라이트·다크(사용자에게 전달, 저장소에는 넣지 않음)

## 확인 못 함

- 실제 휴대폰, Safari(`overflow-clip-margin`을 지원하지 않는 브라우저용 초점 테두리 대비책)
- 배포본 Lighthouse(Task 8)

## 출처(검색)

- WCAG 2.5.8 간격 예외: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- `overflow-clip-margin` 지원 현황: https://caniuse.com/mdn-css_properties_overflow-clip-margin
- modulepreload: https://web.dev/articles/modulepreload
