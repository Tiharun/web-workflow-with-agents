# 브리프: 웹사이트 제작 워크플로우 가이드

> 1~3단계(`/grill-with-docs`) 합의 결과. 결정이 바뀌면 이 파일부터 고친다. 용어는 [GLOSSARY.md](../GLOSSARY.md)를 따른다.

## 목적

`content/`의 워크플로우 md 문서 3개를 읽기 쉽고 보기 좋게 보여 주는 단일 HTML 가이드 사이트. GitHub Pages에 올려 휴대폰·PC 어디서든 본다.

## 대상

나(사이트 제작 초보자) 한 명.

## 핵심 기능 (완료 모습)

1. **홈**: 히어로 비주얼, 최종 워크플로우 '한 줄 요약', 가이드 카드 3개(각 md 첫 소개 문단, 단계 수)가 보이고, 카드를 누르면 해당 가이드로 이동한다.
2. **가이드 읽기**: md 원본을 불러와 문장은 그대로, 모양만 재구성해 보여 준다. 표는 반응형 표 또는 카드, 프롬프트는 복사 버튼이 있는 프롬프트 카드, `- [ ]`는 읽기 전용 체크 목록, ⚠️는 경고 상자, 측정·검색·추측은 배지로 보이고, 정해진 제목 옆에 비주얼이 붙는다.
3. **탐색**
   - 상단 메뉴바에 가이드 버튼 3개를 반투명 세로 실선으로 구분한다.
   - 버튼을 클릭하면 메가메뉴에 단계 버튼이 열리고, 누르면 해당 가이드로 전환된 뒤 그 단계까지 smooth scroll 한다.
   - 가이드 화면 좌측 상단의 [→]를 누르면 목차 드로어가 열려 단계와 세부 항목을 세로로 보여 준다.
4. **모션·피드백**
   - 제목·문단·표·코드 블록이 stagger와 scroll reveal로 한 번씩 등장한다.
   - 가이드 화면 위에 스크롤 진행 막대가 있다.
   - 툴팁은 스킬 이름(문서 안 역할 문장)과 아이콘 버튼에 붙는다.
   - Skeleton UI는 md를 실제로 불러오는 동안에만 보인다.
5. **편의**
   - 가이드 화면 좌측 상단 [⬇ md]로 원본을 원래 한글 파일 이름으로 받는다.
   - 다크 모드는 기기 설정을 따르고, 헤더 토글로 바꾼 값을 그 기기에 기억한다.

## 기능별 세부 규칙

| 항목 | 규칙 |
|---|---|
| 메가메뉴 | 클릭으로 열기, Esc·바깥 클릭으로 닫기. 768px 미만은 햄버거 → 가이드별 아코디언 |
| 목차 드로어 | 왼쪽 오버레이 + 배경 어둡게, Esc·바깥·항목 클릭으로 닫기, 현재 읽는 위치 강조, 열리면 [←] |
| 좌측 상단 버튼 | [→ 목차] [⬇ md] 나란히, 스크롤해도 고정 |
| 등장 모션 | 블록 단위, 한 번만 재생(되돌아가도 반복 없음), `prefers-reduced-motion`이면 바로 표시 |
| Smooth scroll | 메가메뉴·목차 이동에만 |
| 툴팁 | 탭·키보드 포커스로 열림, Esc로 닫힘(WCAG 1.4.13). 문서 밖 새 설명은 쓰지 않음 |
| md 사이 링크 | 사이트 안 해당 가이드로 이동. 외부 링크는 새 탭 |
| 비주얼 | SVG·모션 기본, Three.js는 3D가 이해를 돕는 곳(홈 히어로 후보)에만. 실제 사진·가짜 사진 없음. 최종 선택은 4단계. 제작 시 `docs/웹 비주얼 디자인 v3 작업 규칙.md`의 그림 규칙만 따른다 |
| 정렬·반응형 | 본문 최대 폭 + 공통 그리드 정렬, 모든 요소 반응형 |

## 안 만들 것 (1차)

검색, 로그인·댓글, 다국어, 브라우저 안 편집, 분석 도구, 오프라인(PWA), 체크리스트 저장, 푸터 라이선스·출처 표기.

- 검색이 없으므로 Ctrl+F는 지금 연 가이드 안에서만 찾는다.

## 성공 기준

- [ ] GitHub Pages 주소가 휴대폰과 PC에서 열린다
- [ ] md 3개의 모든 제목(섹션)이 빠짐없이 사이트에 있다
- [ ] 홈에서 원하는 단계까지 탭 두 번 안에 간다
- [ ] 375 · 768 · 1280 · 1440 · 1920px에서 깨짐·가로 넘침이 없다
- [ ] '동작 줄이기' 설정에서 모션 없이 내용이 바로 보인다
- [ ] Lighthouse 성능·접근성 90 이상
- [ ] WCAG 2.2 AA (글자 대비 4.5:1, 키보드로 전부 조작, 누르는 영역 24px 이상, 200% 확대)

## 사이트맵

단일 `index.html` 안의 화면 전환(해시 주소).

| 화면 | 주소 예 | 역할 |
|---|---|---|
| 홈 | `#/` | 소개 + 가이드 입구 3개 |
| 가이드: 최종 워크플로우 | `#/final`, `#/final/<단계 id>` | `content/final-workflow.md` 읽기 |
| 가이드: 웹사이트 제작 순서 | `#/steps/...` | `content/website-steps.md` 읽기 |
| 가이드: 디자인 스킬 워크플로우 | `#/design/...` | `content/design-skills.md` 읽기 |
| 찾을 수 없음 | 없는 해시 주소 | 안내 + 가이드 3개 링크 |
| `404.html` | 없는 경로 | 같은 디자인, 홈 링크 |

가이드 id(`final`·`steps`·`design`)는 예시이며 구현 때 siteConfig에서 정한다.

### 가이드별 단계 (측정: 현재 md 제목 구조)

| 가이드 | 메가메뉴 단계 |
|---|---|
| 최종 워크플로우 | 큰 장 0~6 + "3. 단계별 진행과 프롬프트" 아래 0단계~10단계·출시 게이트 |
| 웹사이트 제작 순서 | 전체 흐름, 1~10단계, 부록 A~C (큰 장) |
| 디자인 스킬 워크플로우 | 큰 장 0·1·3·4·5 + "2. 단계별 사용법" 아래 [1]~[9] |

목차 드로어는 전체 목차(장 → 단계 → 세부 항목)를 보여 준다.

### 404·빈·오류 상태

| 상황 | 화면 |
|---|---|
| 없는 해시 주소 | '찾을 수 없음' + 가이드 3개 링크 |
| 없는 경로 | `404.html` |
| md 불러오기 실패 | 오류 안내 + 다시 시도 + GitHub 원본 링크 |
| 없는 단계 주소 | 가이드 맨 위 + 짧은 안내 |
| JS 꺼짐 | noscript 안내 + md 원본 3개 링크 |
| 비주얼 짝 없음(md 제목 변경) | 그 비주얼만 숨김, 글은 그대로 |

## 데이터 필드

모두 설정 한 곳(siteConfig)에서 관리. 하드코딩 금지.

| 묶음 | 필드 | 타입 | 내용 |
|---|---|---|---|
| `site` | `name` | string | "웹사이트 제작 워크플로우" (탭 제목) |
| | `url` | string | 배포 주소 |
| | `repoUrl` | string | `https://github.com/Tiharun/web-workflow-with-agents` |
| `guides[]` | `id` | string | 해시 주소용 id |
| | `menuLabel` | string | 상단 메뉴 이름 |
| | `file` | string | `content/…md` 상대 경로 |
| | `downloadName` | string | 받을 때 한글 원래 이름 |
| | `stageRule` | object | 단계로 쓸 제목 수준과 펼칠 장 제목 |
| | `summary` | string | 홈 카드용 소개(md 첫 문단 사용) |
| | `legacyNames` | string[] | md 안 링크가 가리키는 옛 파일 이름(사이트 안 링크로 변환용) |
| `visuals[]` | `guideId` | string | 붙을 가이드 |
| | `headingId` | string | 붙을 md 제목 id |
| | `type` | string | 비주얼 종류 |

md 제목에서 자동 생성: 단계·세부 항목 `{ id: string, title: string, level: number, parentId: string | null }`.

브라우저 저장: 다크 모드 선택값 1개(localStorage). 그 외 저장 데이터 없음.

| 원본 파일 | downloadName |
|---|---|
| `content/final-workflow.md` | `최종 워크플로우 (Opus 5.5 Max).md` |
| `content/website-steps.md` | `웹사이트 제작 순서.md` |
| `content/design-skills.md` | `design-skills-workflow 디자인 스킬 사용 순서.md` |

## 대표 페이지 (4단계 디자인 기준)

**'최종 워크플로우' 가이드 화면.** 메가메뉴·목차 드로어·표·프롬프트 카드·비주얼·진행 막대가 모두 있어 기준선으로 가장 넓다. 홈과 다른 가이드는 여기서 잠근 `DESIGN.md`를 따른다.

## 스택 요약

| 항목 | 결정 | 근거 |
|---|---|---|
| 방식 | 정적 사이트, 서버·DB 없음 | — |
| 프레임워크 | 없음. HTML·CSS·JS(ES 모듈), 빌드 없음 | [ADR 0003](adr/0003-no-framework-vendored-libs.md) |
| 콘텐츠 | md 원본을 브라우저에서 불러와 렌더 | [ADR 0001](adr/0001-md-runtime-render.md) |
| 라이브러리 | marked(MIT), GSAP(무료 표준 라이선스: ScrollTrigger·ScrollToPlugin), 필요 시 three(MIT). `vendor/`에 출시 2주 이상 지난 안정판으로 고정. DOMPurify 없음 | [ADR 0003](adr/0003-no-framework-vendored-libs.md) |
| 호스팅 | GitHub Pages, `main` 브랜치 루트 배포, `.nojekyll`, 상대 경로, 해시 주소 | [ADR 0002](adr/0002-github-pages-hash-routing.md) |
| 배포 | `main` push → 자동 배포. Pages 켜기는 사용자가 직접(Settings → Pages → Deploy from a branch → `main` / root) | [GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) |
| 로컬 확인 | `python -m http.server` (`file://`로 열면 md 불러오기가 막힌다) | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSRequestNotHTTP) |
| 저장 | md = 콘텐츠, siteConfig = 설정, localStorage = 다크 모드만 | — |
