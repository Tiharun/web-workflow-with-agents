# 스펙: 웹사이트 제작 워크플로우 가이드 사이트

> 작성 2026-11-08, brainstorming 합의 결과. 기능·화면 규칙의 기준은 [brief](../brief.md), 디자인 값은 [DESIGN.md](../../DESIGN.md)·`css/tokens.css`, 용어는 [GLOSSARY.md](../../GLOSSARY.md), 되돌리기 어려운 결정은 [ADR](../adr/)이다. 이 스펙은 그 문서들을 **구현 구조·테스트·마일스톤**으로 옮긴 것이며, 겹치는 내용은 원 문서를 따른다.

## 1. 출발점

- 4단계에서 만든 시제품(커밋 전: `index.html`, `404.html`, `css/`, `js/` 11개 모듈, `vendor/fonts/`)을 **기준선**으로 유지한다. 새로 쓰지 않는다.
- M0에서 시제품을 커밋·배포하고, M1~M5는 기능별로 테스트를 붙이며 brief와 다른 부분을 맞춘다.
- 테스트 도구(Playwright, `package.json`)는 아직 없다(측정, 2026-11-08).

## 2. 전역 제약

1. **토큰만 사용**: 색·글꼴·간격·모서리·그림자는 DESIGN.md와 `css/tokens.css`의 토큰만 쓴다. 토큰 블록 밖에 색 값·`font-family`를 쓰지 않는다. 새 값이 필요하면 DESIGN.md부터 고친다. SVG 비주얼도 `currentColor`나 CSS 변수로 칠한다.
2. **설정 한 곳**: 사이트 이름·URL·저장소 주소·가이드 목록·UI 문구는 `js/site-config.js`에서만 관리한다.
   - 예외: JS 없이 보여야 하는 정적 문자열(`index.html`의 `<title>`·description·noscript 링크·건너뛰기 문구, `404.html` 전체). 이 값들은 e2e 테스트가 siteConfig와 같은지 검사한다(§6).
3. **원본 문장 불변**: md 문장은 바꾸지 않고 모양만 재구성한다. 홈 카드 요약 등 siteConfig에 옮긴 원문은 테스트로 md와 대조한다(M6).
4. **모션**: `transform`·`opacity`만 움직인다. `prefers-reduced-motion: reduce`이면 즉시 표시하고, 스크립트가 꺼져도 글이 보여야 한다.
5. **의존성**: 배포본은 빌드·npm 의존성이 없다(ADR 0003). 테스트 도구만 `package.json`의 `devDependencies`에 두고 `node_modules/`는 `.gitignore`에 넣는다.
6. **문구**: UI 문구는 합니다체로 쓴다. 툴팁에는 문서에 없는 새 설명을 쓰지 않는다.

## 3. 컴포넌트 구조

기존 모듈은 유지하고, 테스트할 수 있게 세 군데만 바꾼다.

| 모듈 | 역할 | 변경 |
|---|---|---|
| `js/main.js` | 앱 시작, 화면 전환(`route`), 복사 버튼, 미리 받기 | 주소 해석을 `router.js`로 옮긴다 |
| `js/router.js` (새 파일) | `parse(hash) → { name: 'home' } \| { name: 'guide', guide, stageId } \| { name: 'notfound' }` 순수 함수 | M1 |
| `js/md.js` | `loadGuide(guide)`: fetch + 가이드당 Promise 캐시 | `buildDoc(guide, text)`를 export해서 fetch와 분리한다(M2) |
| `js/guide.js` | 가이드 화면: 본문, 좌측 상단 도구, 목차 드로어, 진행 막대, 현재 위치 | `placeVisuals`를 `visuals.js`로 옮긴다(M5) |
| `js/visuals.js` (새 파일) | `type → (doc, guide) => HTMLElement \| null` 대응표. 짝 제목이 없거나 `null`이면 그 비주얼만 건너뛴다 | M5 |
| `js/header.js` | 헤더, 메가메뉴, 모바일 아코디언, 다크 모드 토글 | 단계 0개 처리(M3) |
| `js/home.js` | 홈: 히어로, 단계 자, 입구 카드 3개 | 그대로 |
| `js/ruler.js` | 단계 자(`stagesFromDoc`, `buildRuler`) | `visuals.js`의 `stage-ruler` 항목으로 등록 |
| `js/motion.js`·`scroll.js`·`tooltip.js`·`icons.js` | 등장 모션, 스크롤 이동, 툴팁, 아이콘 | 그대로 |
| `js/site-config.js` | 설정 한 곳 | 그대로(`site.url`은 M0에서 채운다) |

## 4. 데이터 흐름

```
siteConfig ──┬─ header (menuLabel) · home (summary, lead)
             └─ guides[] ─ loadGuide(guide) ─ fetch(guide.file) ─ buildDoc(guide, text)
                             │ 가이드당 Promise 1개 캐시, 실패하면 캐시 삭제
                             ▼
              { template, headings[], stages[], title }
                ├─ guide.js: template 복제 → visuals.js(headingId로 짝 찾기) → 목차(headings)
                ├─ header.js: 메가메뉴·아코디언(stages)
                └─ ruler.js: 단계 자(stagesFromDoc)
location.hash ─ router.parse ─ { home | guide+stageId | notfound } ─ main.route
```

- 데이터는 md(콘텐츠), siteConfig(설정), localStorage(`mode` 하나)의 세 곳에서만 나온다. 흐름은 한 방향이다.
- 제목 데이터: `{ id, title, level, parentId }`. `id`는 GitHub 방식 slug이고, 같은 id가 다시 나오면 `-1`, `-2`를 붙인다.
- md 안의 링크: 대상 파일 이름이 `legacyNames`와 맞으면 `#/<가이드 id>[/<제목 id>]`로 바꾸고, 외부 링크는 `target="_blank" rel="noopener noreferrer"`와 '(새 탭)' 숨김 문구를 붙인다.
- 첫 화면을 그린 뒤 `requestIdleCallback`(없으면 `setTimeout`)으로 나머지 md를 미리 받는다.

## 5. 에러·빈 상태

| 상황 | 처리 | 상태 |
|---|---|---|
| 없는 해시 주소 | '찾을 수 없음' 화면 + 가이드 3개 링크 | 구현됨 |
| 없는 경로 | `404.html`(하위 경로 base 보정, 홈 링크) | 구현됨 |
| md 불러오기 실패 | `role="alert"` 오류 안내 + [다시 시도] + GitHub 원본 링크(새 탭). 캐시를 지우므로 다시 시도하면 새로 요청한다 | 구현됨 |
| 메뉴를 채우다 실패 | 오류 문구 + 가이드 링크. 메뉴를 다시 열면 다시 시도한다 | 구현됨 |
| 없는 단계 주소 | 가이드 맨 위 + `role="status"` 안내. **처음 들어올 때와 같은 가이드 안에서 단계만 바뀔 때 모두** 같게 처리한다 | 고칠 것(M1) |
| JS 꺼짐 | noscript 안내 + md 원본 링크 3개 | 구현됨 |
| 비주얼 짝 없음 | 그 비주얼만 건너뛰고 글은 그대로 둔다 | 구현됨 → `visuals.js`로 이동(M5) |
| 복사 실패 | `navigator.clipboard` 실패 → `execCommand` 대체 → 그래도 실패하면 '복사 못 함' + 화면 낭독기 알림 | 구현됨 |
| localStorage 막힘 | 저장하지 않고 이번 화면에만 적용한다 | 구현됨 |
| 스켈레톤 | **불러오기가 아직 안 끝났을 때만** 보인다. 캐시가 이미 끝났으면 바로 본문을 그린다 | 고칠 것(M4) |
| 가이드 단계 0개(stageRule 불일치) | 메가메뉴·아코디언에 빈 목록 대신 '처음부터 읽기'만 둔다 | 고칠 것(M3) |

## 6. 테스트 전략

모든 테스트는 이 Windows PC에서만 돌린다. GitHub Actions는 쓰지 않는다. 푸시하기 전에 직접 실행한다.

| 층 | 도구·위치 | 대상 |
|---|---|---|
| 단위(순수) | `node --test`(Node 내장 `node:test`), `tests/unit/*.test.mjs` | `router.parse`, `slugify`, `parseStage`, `stagesFromDoc`, 단계 규칙(`stageRule`) 적용, 링크 변환 규칙 |
| 단위(DOM) | Playwright, `tests/dom/*.spec.mjs`. 빈 페이지에서 모듈을 import하고 고정된 md 조각을 넣는다 | `buildDoc`: 표, 체크 목록(읽기 전용), 경고 상자, 측정·검색·추측 배지, 프롬프트 카드, 제목 id·중복 처리, 통과 조건 메모 |
| e2e | Playwright, `tests/e2e/*.spec.mjs` | 라우팅 3종, 메가메뉴·아코디언·목차(열기, Esc·바깥 클릭으로 닫기, 포커스 복귀), smooth scroll 이동, 복사, 다크 모드 기억, md 요청 실패(`page.route`로 막음) → 다시 시도, 정적 문구 = siteConfig, md 3개의 모든 제목이 화면에 있음, 홈 → 단계까지 탭 2번, 375·768·1280·1440·1920px 가로 넘침 없음, 동작 줄이기에서 즉시 표시 |
| 시각 | Playwright `toHaveScreenshot`, `tests/visual/*.spec.mjs` | 375·768·1280·1440px × 라이트·다크 = 화면당 8장. 화면: 홈, 가이드(최종 워크플로우) 맨 위, 메뉴 열림(768 미만은 모바일 메뉴), 목차 드로어 열림, md 불러오기 오류 |

- **명령**: `npm test`(단위 + DOM + e2e), `npm run test:visual`(시각), 기준 이미지 갱신 `npm run test:visual -- --update-snapshots`. 갱신한 뒤에는 차이 이미지를 직접 확인하고 커밋한다.
- **서버**: Playwright `webServer`가 `python -m http.server 8000 --bind 127.0.0.1`을 띄운다(이미 떠 있으면 재사용).
- **안정화**: 시각 테스트는 `reducedMotion: 'reduce'`로 실행한다. Playwright는 CSS 애니메이션만 끄고 GSAP(JS) 모션은 끄지 못하기 때문이다. 다크 모드는 `colorScheme: 'dark'`로 만든다. 브라우저는 Chromium 하나만 쓴다.
- **기준 이미지**: win32 한 벌을 `tests/visual/*-snapshots/`에 커밋한다. md 문장이 바뀌면 기준 이미지가 깨지는 것은 의도된 동작이다. 확인한 뒤 갱신한다.
- **수동 검사**(CLAUDE.md): 슬롭 검사(sloplint), `impeccable detect`, Lighthouse(chrome-devtools-mcp)는 마일스톤을 마무리할 때와 M7에서 돌리고, 그 출력을 보고에 붙인다.
- 각 마일스톤은 해당 기능의 테스트를 먼저 쓰고(실패 확인) 고친 뒤 통과시킨다. 시제품이 이미 맞게 동작하는 부분은 테스트가 처음부터 통과해도 된다.

## 7. 작업 흐름

- 마일스톤마다 브랜치 `m<번호>-<이름>`(예: `m1-routing`)에서 작업한다 → 로컬 `npm test`·`npm run test:visual` 통과 → PR → `main`에 합치면 GitHub Pages가 자동 배포한다.
- 완료 보고에는 테스트 출력, 수동 검사 출력, 스크린샷(375·768·1280·1440, 라이트·다크)을 붙인다. 직접 확인하지 못한 항목은 "확인 못 함"으로 적는다.

## 8. 마일스톤

각 마일스톤은 한 세션 크기다. 완료 기준은 모두 눈으로 확인할 수 있다.

### M0 골격 + 배포
- 시제품을 커밋한다. `package.json`(devDependencies: `@playwright/test`), `playwright.config`, `.gitignore`(`node_modules/`, `test-results/`, `playwright-report/`), 테스트 폴더, 기준 이미지 첫 생성. 현재 브랜치를 `main`에 합친다. 사용자가 Pages를 켜고(Settings → Pages → Deploy from a branch → `main` / root), `site.url`을 채운다. CLAUDE.md '명령'의 테스트 줄을 고친다.
- 완료 기준
  1. 휴대폰과 PC에서 Pages 주소로 홈이 열린다.
  2. 배포본에서 가이드 하나를 열면 md 본문이 보인다.
  3. `npm test`가 통과한다(테스트 1개 이상).

### M1 라우팅·상태
- `router.js` 분리와 단위 테스트, 없는 단계 안내를 두 경로 모두 같게 맞춤, 정적 문구 = siteConfig e2e.
- 완료 기준
  1. `#/없는주소`에서 '찾을 수 없음'과 가이드 링크 3개가 보인다.
  2. `#/final/없는단계`에서 가이드 맨 위와 안내 문구가 보인다. 가이드 안에서 그 주소로 바꿔도 같다.
  3. md 요청을 막으면 오류 안내가 나오고, [다시 시도]를 누르면 본문이 뜬다.

### M2 md 변환
- `buildDoc` 분리, DOM 단위 테스트(§6), md 사이 링크·외부 링크, 프롬프트 카드 복사 e2e.
- 완료 기준
  1. 최종 워크플로우에서 표, 체크 목록, 경고 상자, 배지, 프롬프트 카드가 각각 보인다.
  2. [복사]를 누르면 '복사됨'이 뜨고, 붙여 넣으면 원문과 같다.
  3. md 안의 다른 가이드 링크를 누르면 사이트 안의 그 가이드로 이동한다.

### M3 탐색
- 메가메뉴(데스크톱), 햄버거 → 아코디언(768px 미만), 목차 드로어, 현재 위치 강조, smooth scroll, 단계 0개 처리, 키보드 조작 e2e.
- 완료 기준
  1. 홈에서 원하는 단계까지 탭 두 번 안에 간다(메뉴 버튼 → 단계).
  2. 메가메뉴·목차가 Esc와 바깥 클릭으로 닫히고, 포커스가 연 버튼으로 돌아간다.
  3. 목차 드로어에서 지금 읽는 단계가 강조된다.

### M4 모션·피드백·편의
- 등장 모션(블록 단위, 한 번만), 진행 막대, 스켈레톤(불러오는 동안만), 툴팁(탭·포커스로 열림, Esc로 닫힘), [⬇ md] 다운로드, 다크 모드(기기 설정 따름 + 토글 기억).
- 완료 기준
  1. '동작 줄이기'를 켜면 모션 없이 내용이 바로 보인다.
  2. 이미 연 가이드를 다시 열면 스켈레톤이 깜빡이지 않는다.
  3. [⬇ md]로 받은 파일 이름이 한글 원래 이름이다.
  4. 다크 모드를 바꾸고 새로 고쳐도 선택이 유지된다.

### M5 비주얼 모듈
- `visuals.js` 대응표, 단계 자 등록, 짝이 없으면 숨김, 단위·e2e 테스트.
- 완료 기준
  1. 최종 워크플로우 '1. 전체 루프 한눈에' 아래 단계 자가 그대로 보인다.
  2. siteConfig의 `headingId`를 없는 값으로 바꾸면 비주얼만 사라지고 글은 그대로다.

### M6 콘텐츠·메타
- SVG 비주얼 4개를 붙인다. 제작할 때는 `docs/웹 비주얼 디자인 v3 작업 규칙.md`의 그림 규칙만 따르고, 토큰 색만 쓰며, 라이트·다크를 모두 지원한다. 붙일 제목:
  - 웹사이트 제작 순서 '전체 흐름 한눈에 보기'
  - 디자인 스킬 워크플로우 '1. 전체 흐름 한눈에 보기'
  - 최종 워크플로우 '2. 문서 지도 — 어떤 파일이 무엇의 기준인가'
  - 디자인 스킬 워크플로우 '3. 상황별 빠른 경로'
- siteConfig 원문(`summary`, `home.lead`)이 md에 그대로 있는지 테스트한다. `<meta name="description">`과 favicon을 정리한다. Three.js는 1차에서 쓰지 않는다.
- 완료 기준
  1. 비주얼 4개가 라이트·다크에서 보이고, 375px에서 넘치지 않는다.
  2. siteConfig의 요약 문장을 한 글자 바꾸면 테스트가 실패한다.

### M7 품질 패스
- 시각 기준 이미지를 모두 확정한다. Lighthouse, WCAG 2.2 AA(대비, 키보드, 누르는 영역 24px, 200% 확대), 5개 폭, sloplint·`impeccable detect`, brief 성공 기준 전체를 점검한다(출시 게이트).
- 완료 기준
  1. Lighthouse 성능·접근성이 90 이상이다(배포본, 모바일·데스크톱).
  2. 375~1920px 어디서도 가로 넘침이 없다.
  3. 키보드만으로 모든 조작이 되고, 200%로 확대해도 깨지지 않는다.

## 9. 범위 밖 (1차)

brief '안 만들 것'을 따른다: 검색, 로그인·댓글, 다국어, 브라우저 안 편집, 분석 도구, PWA, 체크리스트 저장, 푸터 라이선스 표기, GitHub Actions 테스트, Three.js.
