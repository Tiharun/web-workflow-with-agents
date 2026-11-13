# 웹사이트 제작 최종 워크플로우

> **한 줄 요약**: 결정은 `/grill-with-docs`로 글로 고정하고, 디자인은 대표 페이지 1개를 최종 품질로 만들어 `DESIGN.md`로 잠근 뒤, 스펙 → 플랜 → 실행 → 검증은 superpowers로 **마일스톤 하나씩** 돌린다.

- 합친 자료: [웹사이트 제작 순서.md](<웹사이트 제작 순서.md>) · [design-skills-workflow 디자인 스킬 사용 순서.md](<design-skills-workflow 디자인 스킬 사용 순서.md>) · `grill-with-docs` · `superpowers`
- 기준 버전(이 PC 측정, 2026-11-08): superpowers 6.4.2 · Hallmark 2.0.0 · impeccable 4.8.0 · interfaces 1.17.0 · ui-ux-pro-max 2.15.0
- 예시 프로젝트: 망원동 독립서점 「책방 오늘」의 '심야 책 모임' 예약 사이트
- "왜 이렇게 하는지" 배경은 원본 두 문서에 있습니다. 이 문서는 **순서 · 스킬 · 프롬프트**만 다룹니다.

---

## 0. 시작 전에

### 0-1. 스킬 역할 분담

| 역할 | 스킬 | 단계 |
|---|---|---|
| 결정 인터뷰 + 용어·결정 기록 | `/grill-with-docs` (grilling + domain-modeling) | 1~3, 10 |
| 디자인 맥락·방향·첫 빌드·기준 고정 | impeccable · ui-ux-pro-max · playground · hallmark | 4 |
| 스펙 → 플랜 → 실행 → 검증 → 병합 | superpowers | 5~7, 10 |
| 문구·다듬기·모션·검사·마감 | interfaces:better-* · impeccable · animate · break-ui | 8~9 |
| 출시 점검 | shipping-and-launch | 출시 게이트 |

### 0-2. 섞을 때 지킬 규칙 7가지

1. **한 프롬프트에 메인 스킬 1개.** 역할이 겹치는 스킬(spec-driven-development, planning-and-task-breakdown, incremental-implementation, agent-skills판 test-driven-development)은 superpowers와 같이 쓰지 않는다.
2. **결정 질문은 grill에서 끝낸다.** 이후 스킬에는 "문서를 읽고 빈 곳만 물어봐"를 붙인다.
3. **디자인은 4단계에서 최종 품질.** "목업·시안·뼈대·빠르게" 같은 저충실도 표현을 쓰지 않는다.
4. **1 마일스톤 = 1 플랜 = 1 세션.** superpowers 실행 스킬(subagent-driven-development, executing-plans)은 플랜 끝까지 멈추지 않는다(측정).
5. **기준 파일은 종류별로 하나.** 디자인 = `DESIGN.md`, 용어 = `GLOSSARY.md`, 결정 = `docs/adr/`.
6. **검사는 보고서 먼저.** 고칠 항목은 사람이 고른다.
7. **증거 없는 "완료"는 반려.** 테스트 출력·스크린샷·배포 URL을 요구한다.

### 0-3. 사전 점검 (5분)

- 입력창에 `/`를 쳐서 이름을 확인합니다: `grill-with-docs` · `superpowers:brainstorming` · `impeccable:impeccable` · `hallmark` · `ui-ux-pro-max:ui-ux-pro-max` · `interfaces:better-interface`
- ⚠️ **superpowers 확인 필요(측정)**: 이 PC에서는 claude.ai 동기화 목록에 `available`(설치 가능) 상태로만 있고, `settings.json`의 활성 플러그인과 현재 세션 스킬 목록에는 없습니다. `/`에 안 보이면 터미널 `claude`에서 직접 설치합니다(superpowers README 기준).

```text
/plugin install superpowers@claude-plugins-official
```

- `grill-with-docs`, `pick-ui-library`는 **직접 입력해야만** 실행됩니다(`disable-model-invocation: true`, 측정). Claude가 알아서 부르지 않습니다.

---

## 1. 전체 루프 한눈에

```text
[0 준비]  git · 스킬 확인
   ↓
[1~3 결정]  /grill-with-docs ─────────────▶ docs/brief.md · GLOSSARY.md · docs/adr/
   ↓
[4 디자인 고정]  초기화 → init → 리서치 → shape → (playground) → hallmark → 미세조정 → document
   ↓                                     ▶ PRODUCT.md · 대표 페이지 · DESIGN.md
[5 스펙·계획]  CLAUDE.md → brainstorming → writing-plans(M0)
   ↓                                     ▶ specs/…-design.md · plans/…-M0.md
┌─ 마일스톤 루프: M0 골격+배포 → M1…Mn 기능 → 8 콘텐츠 → 9 품질 패스
│   새 세션 → 플랜 → 실행 → 증거 → 사람 확인 → 병합·배포 ─┐
└──────────────────── 다음 마일스톤 ◀─────────────────────┘
   ↓        (8·9는 플랜 대신 디자인 스킬로 직접 실행)
[출시 게이트]  shipping-and-launch
   ↓
[10 피드백]  분류 → 버그·작은 변경·디자인·새 기능 경로로 복귀 ↺
```

| 단계 | 메인 스킬 | 핵심 산출물 | 코드 | 권장 effort | 세션 |
|---|---|---|---|---|---|
| 0 준비 | — | git, `.gitignore` | ✗ | 낮음 | 1 |
| 1~3 결정 | `/grill-with-docs` | `docs/brief.md`, `GLOSSARY.md`, `docs/adr/` | ✗ | 높음 | 1 |
| 4 디자인 고정 | impeccable → ui-ux-pro-max → hallmark | `PRODUCT.md`, 대표 페이지, `DESIGN.md` | △ 1페이지 | 높음 | 1~2 |
| 5 스펙·계획 | `brainstorming` → `writing-plans` | `CLAUDE.md`, 스펙, M0 플랜 | ✗ | 높음 | 1 |
| 6 M0 골격+배포 | `subagent-driven-development` | 전 페이지가 열리는 배포 URL | ○ | 중간 | 1 |
| 7 기능 루프 | `writing-plans` → 실행 → `verification` | 마일스톤별 기능 + 병합 | ○ | 중간 | 마일스톤마다 1 |
| 8 콘텐츠 | `interfaces:better-writing` | 실제 문구, SEO·OG | ○ | 중간 | 1 |
| 9 품질 패스 | better-* → 모션 → 검사 → 마감 | 보고서 + 수정 | ○ | 중간~높음 | 1~2 |
| 출시 게이트 | `shipping-and-launch` | 출시 체크리스트 | — | 중간 | 1 |
| 10 피드백 | 분류 후 해당 스킬 | 개선 목록 → 복귀 | ○ | — | 건마다 |

effort는 권유입니다. superpowers 문서는 "플랜이 설계를 담고 있어 Native 실행은 중간급 모델로도 잘 돈다"고 적고 있습니다(측정).

---

## 2. 문서 지도 — 어떤 파일이 무엇의 기준인가

| 파일 | 만드는 단계·스킬 | 역할 | 규칙 |
|---|---|---|---|
| `docs/brief.md` | 1~3 grill 마무리 | 범위·사이트맵·데이터·스택 요약 | 결정이 바뀌면 여기부터 고친다 |
| `GLOSSARY.md` | 1~3 domain-modeling | 용어 정의 | 구현 내용 금지 |
| `docs/adr/NNNN-*.md` | 1~3 domain-modeling | 되돌리기 어려운 결정(스택·호스팅·저장) | 되돌리기 어렵고 · 맥락 없이 의아하고 · 실제 트레이드오프일 때만 |
| `PRODUCT.md` | 4 impeccable init | 대상·목표·목소리·스택 | 디자인 값 없음 |
| `design-system/<slug>/MASTER.md` | 4 ui-ux-pro-max | 리서치 선택지 | 참고용, 기준 아님 |
| `tokens.css` · `base.css` · `.hallmark/` | 4 hallmark | 토큰·빌드 기록 | — |
| `DESIGN.md` (+ sidecar) | 4 impeccable document | **디자인 기준** | 변경 금지. 바꾸면 document 재실행 |
| `CLAUDE.md` | 5 | 명령어·문서 지도·규칙 | 짧게. 내용 복사 대신 경로만 |
| `docs/superpowers/specs/<날짜>-<주제>-design.md` | 5 brainstorming | 스펙 + 마일스톤 목록 | 플랜의 근거 |
| `docs/superpowers/plans/<날짜>-Mn.md` | 5·7 writing-plans | 마일스톤 1개의 태스크 | 1 플랜 = 1 마일스톤 |
| `src/config/site.*` + `.env` | 6 M0 | 사이트 이름·URL | 하드코딩 금지 |

**원본 문서와의 대응**
- `웹사이트 제작 순서`의 `docs/01-범위`·`02-구조`·`03-스택` → `docs/brief.md` + `docs/adr/`
- `04-디자인` → `PRODUCT.md` + `DESIGN.md` / `설계.md`·`마일스톤.md` → 스펙(마일스톤 섹션) + 플랜
- `design-skills-workflow`의 [1]~[5] → 4단계 / [6]~[9] → 9단계

---

## 3. 단계별 진행과 프롬프트

> 프롬프트의 `( )`·`< >`는 바꿔 넣는 자리입니다.
>
> **superpowers를 켠 세션에서 4·8·9단계를 할 때**는 첫 프롬프트 맨 앞에 아래 줄을 붙입니다. superpowers는 창작 작업 전에 brainstorming을 먼저 하려 하고, 사용자 지시는 스킬보다 우선합니다(측정).
>
> `이 세션은 superpowers 브레인스토밍 없이 진행해.`

### 0단계. 준비

```text
새 웹사이트 프로젝트 준비만 해 줘. 코드는 쓰지 마.
- git 저장소 생성
- .gitignore: .env, node_modules, 브라우저 세션·쿠키 상태 파일
- 빈 docs/ 폴더
```

---

### 1~3단계. 결정 — `/grill-with-docs`

원본의 1 범위 · 2 구조 · 3 스택을 grill의 **설계 트리 하나**로 처리합니다.

- 진행 방식(측정): 지금 답할 수 있는 질문을 한 라운드에 번호를 붙여 묻고, 질문마다 추천 답을 붙입니다. "yes"면 추천 답을 채택합니다.
- 사실 조사는 Claude 몫, 결정은 사용자 몫입니다. 용어가 정해지면 `GLOSSARY.md`, 되돌리기 어려운 결정은 ADR로 그 자리에서 기록합니다.

**시작**

```text
/grill-with-docs
웹사이트를 만들려고 해. 코드는 쓰지 말고 결정만 굳히자.
- 목적: 「책방 오늘」(망원동 독립서점)의 '심야 책 모임' 예약을 온라인으로 받는다
- 대상: 동네 20~40대 직장인
- 떠오르는 기능: 모임 일정·예약, 이달의 책, 매장 소개·오시는 길, 인스타 피드, 회원 로그인
- 조건: 초보자, 무료 호스팅으로 시작
설계 트리는 ① 범위(핵심 기능 3~5개, 안 만들 것, 성공 기준) → ② 구조(사이트맵, 페이지 역할, 데이터 필드, 404·빈 상태) → ③ 스택(정적/서버, 프레임워크, 호스팅, 데이터 저장) 순서로 잡아 줘.
스택·호스팅처럼 사실 확인이 필요한 건 공식 문서를 찾아 근거 링크와 함께 추천해 줘.
```

**답하는 법**

```text
Q1 yes / Q2 B / Q3 아니, 로그인은 2차로 미뤄
```

**마무리** (더 물을 질문이 없을 때)

```text
합의 완료. 정리해 줘.
1) docs/brief.md: 목적, 대상, 핵심 기능(완료 모습 한 줄씩), 안 만들 것, 성공 기준, 사이트맵, 데이터 필드, 대표 페이지 1개, 스택 요약(ADR 링크)
2) GLOSSARY.md와 docs/adr/ 파일 목록을 경로로 보여 줘
```

**통과 조건**
- [ ] 핵심 기능 5개 이하, "안 만들 것" 목록이 있다
- [ ] 사이트맵에 404·빈 상태 화면이 있고, 데이터 필드 이름·타입이 정해졌다
- [ ] 스택·호스팅 ADR이 있다 (스택은 나중에 바꾸면 거의 처음부터 다시 한다)
- [ ] `GLOSSARY.md`가 있다 — 없으면 domain-modeling이 빠진 것: `/domain-modeling 이번 합의로 GLOSSARY.md와 ADR을 정리해 줘`
- [ ] 호스팅 계정을 만들었다 (직접)

---

### 4단계. 디자인 방향 고정 ★ 가장 중요

디자인 품질은 여기서 정해집니다. 첫 승인 결과가 이후 모든 페이지의 기준선이 되고, "나중에 꾸미기"는 오지 않습니다. 컨텍스트가 길어지면 4-6 전에 새 세션으로 이어가도 됩니다(산출물이 파일로 남음).

**4-1. 프로젝트 초기화 (스택만)**

```text
이 세션은 superpowers 브레인스토밍 없이 진행해. 스펙은 5단계에서 쓴다.
docs/brief.md와 docs/adr/의 스택으로 프로젝트만 초기화하고 dev 서버가 뜨는지 확인해 줘.
스타터의 예제 페이지·기본 스타일은 지워 빈 상태로 둬. 페이지·컴포넌트는 아직 만들지 마.
```

기본 스타일을 지우는 이유: Hallmark는 프로젝트에 이미 있는 폰트·색을 디자인 신호로 읽습니다(측정).

**4-2. 제품 맥락 — `impeccable init`**

```text
/impeccable:impeccable init
docs/brief.md를 근거로 PRODUCT.md를 만들어 줘. brief에 없는 것만 물어봐.
- 실제 자료: /assets/photos 매장 사진 6장, 참여자 후기 3개(이름 공개 동의)
- 목소리: 조용하고 따뜻하게
```

init은 문서를 먼저 훑고 빈 곳만 최대 3개씩 묻습니다. 색·폰트·스타일 같은 미감 질문은 하지 않습니다(측정). 미감은 4-3~4-6에서 정합니다.

**4-3. 리서치 — `ui-ux-pro-max`** (선택지 모으기, 결정 아님)

```text
/ui-ux-pro-max:ui-ux-pro-max
"independent bookstore community events editorial"로 --design-system 검색해 줘.
--variance 6 --motion 3 --density 3, --project-name "Chaekbang Oneul", --persist로 프로젝트 루트에 저장.
추천 팔레트 2개와 폰트 조합 2개를 표로 비교하고 한글 웹폰트 대안도 붙여 줘.
```

**4-4. 화면 기획 — `impeccable shape`**

```text
/impeccable:impeccable shape 홈
PRODUCT.md와 docs/brief.md 기준으로 홈의 섹션 구성과 정보 우선순위를 잡아 줘. 문서에 있는 건 묻지 마.
예약 버튼까지 가는 흐름을 최단으로. 코드는 쓰지 마.
```

**4-5. (선택) 값 탐색 — `playground`** — 색·폰트·여백을 말로 정하기 어려울 때

```text
/playground:playground
「책방 오늘」 히어로용 플레이그라운드를 만들어 줘.
조절: 배경(종이색 계열), 포인트 색, 제목 폰트(명조/고딕), 제목 크기, 줄간격, 버튼 모서리
프리셋: ui-ux-pro-max 추천 팔레트 2개 + '심야 서점'
```

→ 하단에 생성된 프롬프트의 값을 4-6 브리프의 분위기·기준 색에 붙입니다.

**4-6. 대표 페이지 빌드 — `hallmark`**

```text
/hallmark 「책방 오늘」 홈, 최종 출시 수준으로
- 자료: /assets/photos 6장, 로고 /assets/logo.svg, 후기 3개(원문은 아래)
- 대상: 망원동 20~40대 직장인 / 단 하나의 행동: '심야 책 모임' 예약
- 톤: editorial / 분위기: 늦은 밤 스탠드 불빛 아래 종이 냄새 / 기준 색: #2F3A2E
- 좋아하는 느낌: 여백이 넓고 글자가 또렷한 편집 디자인, 카드 간 색 대비가 분명함
- 섹션 순서는 shape 결과를 따르되 레이아웃은 맡김
- brief의 프레임워크 안에 실제 라우트로 만들어 줘
완료 기준: 기본 폰트·기본 색·회색 박스·자리표시자 없음, 375px·1280px 모두 정상.
고른 테마·구도(Picks)와 이유를 알려 줘.
```

- 참고 사이트는 **URL 대신 좋은 점을 말로** 적습니다. Hallmark는 프롬프트 속 URL을 '제품 자체' 신호로 읽습니다(측정).
- `--fast`, "quick·rough·prototype" 같은 표현은 Hallmark의 빠른 모드 신호입니다(측정). 이 단계에서는 쓰지 않습니다.
- Hallmark는 수치·후기·로고를 지어내지 않습니다(측정). 실제 자료를 먼저 준비합니다.
- 편집할 때마다 도는 Hallmark 자동 검사 hook은 `install-hook.mjs`를 실행해야만 켜집니다(측정). 켜지 말고 9-3에서 audit을 직접 돌립니다.
- Figma·시안 이미지가 있으면 Hallmark 대신 `/interfaces:build-design`을 씁니다.

**4-7. 반려·미세조정** — 대표 페이지에만, 한 번에 한 측면

반려 기준(하나라도 해당하면 승인하지 않음): 기본 시스템 폰트 / 파란 링크·검정 글자·흰 배경뿐 / 회색 박스·Lorem ipsum·"이미지 자리" / 참고 사이트보다 덜 만든 느낌

```text
지금 결과는 와이어프레임 수준이라 승인하지 않을 거야.
특히 (폰트 / 색 대비 / 여백 / 카드 그림자)가 부족해. 그 부분만 다시 만들어 줘.
```

```text
/impeccable:impeccable quieter 히어로
배경 그라데이션이 과해. 차분하게, 다른 섹션은 건드리지 마.
```

쓸 수 있는 것: `bolder` · `quieter` · `/interfaces:better-typography` · `/interfaces:better-colors`

**4-8. 기준 고정 — `impeccable document`**

```text
/impeccable:impeccable document
승인한 홈(tokens.css·base.css·<홈 경로>) 기준으로 DESIGN.md를 만들어 줘.
색·타입 스케일·간격·모서리·그림자·모션을 실제 코드 값 그대로.
```

- Hallmark가 끝에 `lock the system`(design.md 생성)을 권해도 하지 않습니다. 두 스킬 모두 루트에 design.md를 쓰고, Windows는 `design.md`와 `DESIGN.md`를 같은 파일로 봅니다.

**통과 조건**
- [ ] 홈이 "이대로 출시해도 된다" 수준이다 (반려 기준 0개)
- [ ] 375px·1280px 스크린샷을 둘 다 봤다
- [ ] `DESIGN.md` 값이 실제 코드 값과 같다
- [ ] "이 결과가 앞으로의 기준선"이라는 생각으로 승인했다

---

### 5단계. 스펙·계획 — `CLAUDE.md` → `brainstorming` → `writing-plans`

**5-1. CLAUDE.md** (이후 모든 세션이 자동으로 읽음)

```text
지금까지의 문서를 읽고 프로젝트 CLAUDE.md를 50줄 이내로 만들어 줘.
- 목적 한 문장, 스택, 실행·빌드·테스트 명령
- 문서 지도: brief·GLOSSARY·adr·PRODUCT·DESIGN·specs·plans의 경로와 역할 한 줄씩(내용 복사 금지)
- 규칙: DESIGN.md 밖의 색·폰트 금지, 사이트 이름·URL은 설정 파일 한 곳, 공용 컴포넌트 재사용, 완료 전 테스트 출력·스크린샷 제시, 사소한 문제·지적(Minor)이 나올 경우 미루지 않고 바로 해결하고 미뤄야 한다면 마일스톤에 바로 추가하고 수정해서 잊지 않고 해결되도록 할 것.
```

결과 예시:

```markdown
# 책방 오늘 웹사이트
'심야 책 모임' 예약을 받는 동네 서점 사이트.

## 명령 (스택에 따라 다름)
개발 `npm run dev` · 빌드 `npm run build` · 테스트 `npm test` · e2e `npx playwright test`

## 문서 지도
- 디자인 기준: DESIGN.md (변경 금지)
- 범위: docs/brief.md · 용어: GLOSSARY.md · 결정: docs/adr/
- 스펙: docs/superpowers/specs/ · 플랜: docs/superpowers/plans/

## 규칙
- DESIGN.md 토큰 밖의 색·폰트·간격 금지
- 사이트 이름·URL은 src/config/site.ts와 .env에서만
- 새 페이지는 기존 레이아웃·공용 컴포넌트 사용
- 완료 선언 전 테스트 출력과 375/1280 스크린샷 제시
```

**5-2. 스펙 — `brainstorming`**

```text
/superpowers:brainstorming
결정은 끝났어. CLAUDE.md의 문서 지도에 있는 파일을 먼저 읽고, 정해진 건 다시 묻지 말고 빈 곳만 하나씩 물어봐.
스펙에 꼭 넣을 것:
- 컴포넌트 구조, 데이터 흐름, 에러·빈 상태 처리
- 테스트 전략: 로직은 단위 테스트, 페이지 동작은 Playwright e2e, 시각 품질은 375/768/1280 스크린샷 대조
- 전역 제약: DESIGN.md 토큰만 사용, 사이트 이름·URL은 설정 한 곳
- 마일스톤: M0 골격+배포 → M1~Mn 기능 → 콘텐츠 → 품질 패스. 각각 한 세션 크기, 눈으로 확인 가능한 완료 기준 2~4개
- 플랜 네이밍 규칙: writing-plans로 플랜의 네이밍은 `<날짜>-Mn.md`로 할 것. (예시: 2026-11-13-M1.md)
```

새 프로젝트이므로 brainstorming은 architectural 경로(스펙 파일 작성 → 사용자 검토)로 진행됩니다(측정).

**5-3. M0 플랜 — `writing-plans`**

스펙 파일을 직접 읽고 승인한 뒤:

```text
스펙 승인. writing-plans로 M0(골격+즉시 배포)만 플랜을 써 줘.
- 사이트맵 전 페이지(제목만), 공통 레이아웃, 공용 컴포넌트, 404, siteConfig, 자동 배포
- 완료 기준: 배포 URL에서 전 페이지가 열리고, 헤더·푸터가 홈과 같은 품질
나머지 마일스톤은 각자 새 세션에서 따로 플랜을 쓴다.
```

플랜이 나오면 실행 방식을 고릅니다(측정).

| 방식 | 내용 | 고를 때 |
|---|---|---|
| Subagent-driven (`subagent-driven-development`) | 태스크마다 새 구현자 + 리뷰어, 끝에 브랜치 전체 리뷰 | 품질 우선 |
| Native (`executing-plans`) | 현재 세션이 직접 구현, 끝에 리뷰 1회 | 기본 추천. 비용 절약. 작은 마일스톤 |

**통과 조건**
- [ ] 마일스톤마다 눈으로 확인 가능한 완료 기준이 있다 (✗ "게시판 구현" → ○ "목록에 글 3개가 보이고 클릭하면 상세로 이동")
- [ ] 콘텐츠·품질 패스가 마일스톤으로 들어 있다 (명시하지 않으면 오지 않음)
- [ ] 테스트 전략(단위·e2e·스크린샷)이 스펙에 있다

---

### 6단계. M0 골격 → 즉시 배포

```text
CLAUDE.md를 먼저 읽어 줘.
/superpowers:executing-plans docs/superpowers/plans/<날짜>-M0.md
- 공통 레이아웃·공용 컴포넌트는 DESIGN.md 기준, 홈과 같은 품질로
- 계정 로그인·저장소 연결처럼 내 계정이 필요한 일은 멈추고 절차를 알려 줘
- 끝나면 배포 URL, 전 페이지 375/1280 스크린샷, 테스트 출력, 다음 진행사항을 보여 줘
```

(Subagent를 골랐다면 `/superpowers:subagent-driven-development`.) 직접 확인한 뒤 병합합니다. merge·PR·유지·폐기 중에서 고르고, push는 직접 승인합니다.

```text
/superpowers:finishing-a-development-branch
```

**통과 조건**
- [ ] 배포된 실제 URL이 있고, 전 페이지가 404 없이 열린다
- [ ] 헤더·푸터·버튼이 4단계 홈과 같은 품질이다
- [ ] 사이트 이름·URL이 설정 파일 한 곳에 있다
- [ ] 커밋·병합했다

---

### 7단계. 기능 마일스톤 루프 (M1~Mn, 마일스톤마다 새 세션)

| 순서 | 할 일 | 스킬 | 누가 |
|---|---|---|---|
| 1 | 새 세션 + 시작 문구 | — | 사용자 |
| 2 | 이번 마일스톤만 플랜 | `/superpowers:writing-plans` | Claude → 사용자 검토 |
| 3 | 실행 (TDD·태스크 리뷰 내장) | `subagent-driven-development` 또는 `executing-plans` | Claude |
| 4 | 완료 증거 제시 | `/superpowers:verification-before-completion` | Claude |
| 5 | 브라우저로 완료 기준 확인 | — | **사용자** |
| 6 | 실패 시 원인부터 | `/superpowers:systematic-debugging` | Claude |
| 7 | 병합 → 자동 배포 확인 | `/superpowers:finishing-a-development-branch` | 사용자가 선택 |

**2. 플랜**

```text
CLAUDE.md와 스펙(docs/superpowers/specs/<날짜>-chaekbang-design.md)을 읽어 줘.
이번 세션 목표: M2 모임 예약 폼.
/superpowers:writing-plans 로 M2만 플랜을 써 줘.
- M0 공용 컴포넌트 재사용, DESIGN.md 밖 스타일 금지
- 폼 검증 로직은 TDD, 예약 흐름은 Playwright e2e로 완료 기준을 테스트로 만든다
```

**4. 증거**

```text
/superpowers:verification-before-completion
M2 완료 기준을 하나씩 실제 명령 출력과 375/1280 스크린샷으로 증명해 줘.
```

**6. 반려**

```text
완료 기준 2번("…")이 안 됐어. (스크린샷 설명)
/superpowers:systematic-debugging 으로 원인부터 찾고, 그 부분만 고쳐 줘. 다른 곳은 건드리지 마.
```

필요할 때만 쓰는 보조 스킬
- 날짜 선택·토스트 같은 UI 라이브러리 고르기: `/pick-ui-library` (직접 입력)
- 이름·연락처를 받는 폼: `/security-and-hardening`
- 새 컴포넌트에 최악의 데이터 넣어 보기: `/break-ui`

**통과 조건 (마일스톤마다)**
- [ ] 완료 기준을 전부 통과했다 (증거 확인)
- [ ] 새 화면이 기존 화면과 같은 디자인 품질이다
- [ ] 병합하고 배포를 확인했다

> ⚠️ "M2~M5 전부 해 줘"는 금지. 품질이 떨어지고 통합할 때 깨지는 가장 흔한 패턴입니다.

---

### 8단계. 실제 콘텐츠·메타

```text
이 세션은 superpowers 브레인스토밍 없이 진행해.
1) "Lorem ipsum", "여기에…", 임시 이미지 위치를 전부 표로 뽑아 줘. 문구·사진은 내가 줄게
2) 페이지별 title·description, OG(제목·설명·이미지), favicon을 siteConfig 값으로 연결해 줘
```

```text
/interfaces:better-writing
버튼·안내·에러·빈 상태·404 문구를 PRODUCT.md 목소리(조용하고 따뜻함)에 맞게 다시 써 줘.
가격·시간 같은 사실 정보는 바꾸지 마.
```

SEO·OG 전용 스킬은 설치돼 있지 않아 일반 요청으로 처리합니다(측정).

**통과 조건**
- [ ] 자리표시자가 0개다
- [ ] 카카오톡·슬랙에 링크를 붙이면 제목·이미지가 보인다
- [ ] 브라우저 탭에 favicon이 보인다

---

### 9단계. 품질 패스

순서: **다듬기 → 모션 → 검사(보고서) → 고른 것 수정 → 마감 → 성능 → 최종 검증**. 첫 프롬프트에 "브레인스토밍 없이 진행" 줄을 붙입니다.

**9-1. 세부 다듬기** — DESIGN.md 범위 안에서, 한 번에 한 측면

| 고칠 것 | 1순위 | 대안 |
|---|---|---|
| 글자 크기·줄간격·줄바꿈 | `/interfaces:better-typography` | `impeccable typeset` |
| 색 체계·대비 | `/interfaces:better-colors` | `impeccable colorize` |
| 정렬·그룹·반응형 구조 | `/interfaces:better-layout` | `impeccable layout` |
| 그림자·모서리·아이콘 | `/interfaces:better-ui` | `/emil-design-eng` |
| 너무 밋밋함 / 너무 요란함 | `impeccable bolder` / `quieter` | — |
| 군더더기 | `impeccable distill` | — |
| 시안 여러 개 비교 | `impeccable generate` / `live` | — |

```text
/interfaces:better-typography <페이지 경로>
DESIGN.md 타입 스케일은 유지하고 한글 본문 줄간격·자간·제목 줄바꿈(어절 단위)만 고쳐 줘.
```

**9-2. 모션**

| 상황 | 스킬 |
|---|---|
| 넣을지 말지, 이징·길이부터 | `/animate` |
| 페이지 전체에 의미 있는 모션 | `/impeccable:impeccable animate` |
| 드래그·스와이프·시트 | `/apple-design` |
| 끊기거나 버벅임 | `/animation-performance` |

```text
/animate
모임 카드가 스크롤로 보일 때 등장 모션을 넣을지 먼저 판단하고, 넣는다면 구현해 줘. prefers-reduced-motion 대응 필수.
```

**9-3. 검사 — 보고서만**

```text
/interfaces:better-interface <페이지 경로>
문제를 심각도 순으로 정리만 해 줘. 수정은 내가 고른 것만.
```

```text
/hallmark audit <페이지 경로>
```

```text
/break-ui 모임 카드
이름 40자, 소개 500자, 사진 없음, 아랍어 텍스트로 깨지는 곳을 찾아 줘.
```

(선택) `/impeccable:impeccable audit` — 접근성·성능·반응형 기술 점검

**9-4. 고른 항목 수정 + 접근성**

```text
보고서 1, 3, 4번만 고쳐 줘. 나머지는 건드리지 마.
```

```text
/interfaces:better-accessibility
WCAG 2.2 기준으로 키보드 이동·포커스·ARIA·대비를 점검하고 고쳐 줘.
```

**9-5. 마감** — 하나씩 차례로

```text
/impeccable:impeccable harden 예약 폼
```

```text
/impeccable:impeccable adapt
```

```text
/impeccable:impeccable polish
```

**9-6. 성능·실기기**

```text
/performance-optimization
chrome-devtools-mcp로 모바일 Lighthouse를 돌려 점수와 개선 항목을 보고해 줘. 목표 90 이상.
```

LCP가 느리면 `/chrome-devtools-mcp:debug-optimize-lcp`, 휴대폰 사용감은 `/mobile-native`.

**9-7. 최종 검증·병합**

```text
/superpowers:requesting-code-review
품질 패스 브랜치 전체를 스펙과 DESIGN.md 기준으로 리뷰해 줘.
```

→ `/superpowers:finishing-a-development-branch`

**통과 조건**
- [ ] 375·768·1280px에서 깨지는 곳이 없다
- [ ] Tab 키만으로 모든 버튼·링크에 갈 수 있다
- [ ] Lighthouse 성능·접근성 점수를 확인했다
- [ ] DESIGN.md에 없는 토큰이 새로 생기지 않았다

---

### 출시 게이트

```text
/shipping-and-launch
이 사이트의 출시 전 체크리스트를 만들고 하나씩 확인해 줘.
도메인 연결·분석 도구처럼 내 계정이 필요한 건 절차만 알려 줘.
```

---

### 10단계. 출시 후 피드백 루프

```text
출시 후 피드백이야: (목록)
각 항목을 버그 / 작은 변경 / 디자인 / 새 기능으로 분류하고 우선순위를 매겨 줘.
```

| 분류 | 경로 |
|---|---|
| 버그 | `/superpowers:systematic-debugging` → 재현 테스트 → 수정 → verification |
| 작은 변경 (기존 화면) | `/superpowers:brainstorming` bounded 경로: 채팅으로 짧은 설계 승인 → 구현. 스펙·플랜 문서 없음 |
| 디자인 | 9단계 표에서 스킬 하나 |
| 새 기능·범위 변경 | `/grill-with-docs` → brainstorming → writing-plans → 7단계 루프 |
| 전면 개편 | `DESIGN.md`를 `DESIGN.old.md`로 이름 변경 → `/hallmark redesign <경로>` → `document` 재실행 |

brainstorming은 애매하면 무거운 경로를 택하고, 작업 중 복잡도가 드러나면 경로를 올립니다(측정).

---

## 4. 섞을 때 생기는 충돌과 해결

| 충돌 | 원인 (측정) | 해결 |
|---|---|---|
| 같은 질문을 여러 번 받음 | grill·brainstorming·impeccable init·Hallmark 모두 질문으로 시작 | 결정은 grill에서만. 이후엔 "문서 읽고 빈 곳만" |
| 디자인 단계에서 brainstorming부터 하려 함 | superpowers는 창작 작업 전 brainstorming 필수 | "브레인스토밍 없이 진행" 명시. 사용자 지시가 스킬보다 우선 |
| brainstorming 뒤 writing-plans로 바로 넘어감 | architectural 경로의 다음 스킬은 writing-plans뿐 | 디자인(4)을 brainstorming(5) 앞에 둠 |
| 실행이 중간에 안 멈춤 | 실행 스킬은 플랜 끝까지 연속 실행 | 플랜 1개 = 마일스톤 1개 |
| DESIGN.md를 두 스킬이 만듦 | impeccable document와 Hallmark lock 모두 루트 design.md 작성, Windows는 대소문자 무시 | document 하나만 사용 |
| TDD가 UI 코드를 지움 | superpowers TDD는 테스트 전에 쓴 코드를 지움 | 로직=단위, 동작=e2e, 시각=스크린샷을 스펙에 명시 |
| grill 후 GLOSSARY.md가 없음 | grill-with-docs는 두 스킬을 부르라는 지시뿐 | `/domain-modeling` 다시 요청 |
| 범위·사이트맵이 기록되지 않음 | GLOSSARY는 용어만, ADR은 세 조건 충족 결정만 | `docs/brief.md`에 기록 |
| 리뷰를 두 번 함 | subagent-driven은 태스크·브랜치 리뷰 내장, Native도 마지막 1회 | 7단계에선 별도 리뷰 불필요 |

---

## 5. 자주 쓰는 문구

```text
# 세션 시작
CLAUDE.md를 먼저 읽어 줘. 이번 세션 목표: (단계 또는 마일스톤)
규칙: DESIGN.md 토큰 변경 금지, 범위 밖 기능 금지, 끝나면 완료 기준별 증거(명령 출력·스크린샷).

# 토큰 이탈
DESIGN.md에 없는 색·폰트를 썼어. 토큰으로 되돌려 줘.

# 범위 초과
요청하지 않은 (기능)이 들어갔어. 이번 마일스톤 범위만 남기고 빼 줘.

# 증거 없는 완료
완료 기준을 하나씩 실제로 확인한 증거(명령 출력·스크린샷)를 보여 줘.
```

---

## 6. 근거

**측정 (이 PC, 2026-11-08)**
- `grill-with-docs`: `~/.claude/skills/grill-with-docs/SKILL.md` — `disable-model-invocation: true`, grilling + domain-modeling 호출 지시
- grilling(라운드·추천 답·"yes" 채택·사실 조사는 Claude 몫), domain-modeling(`GLOSSARY.md`, `docs/adr/`, ADR 세 조건): 각 `SKILL.md`
- superpowers 6.4.2: README "The Basic Workflow"·설치 명령, brainstorming(세 경로·HARD-GATE·스펙 경로·다음 스킬은 writing-plans뿐), writing-plans(플랜 경로·실행 방식 두 가지), subagent-driven-development·executing-plans(연속 실행), using-superpowers(사용자 지시 우선)
- superpowers 활성 상태: 동기화 meta `installation_preference: available`, `settings.json` enabledPlugins에 없음
- Hallmark 2.0.0: `SKILL.md`(design.md·DESIGN.md를 잠긴 기준으로 읽음, URL을 제품 신호로 읽음, 빠른 모드 신호, 자료 질문), `references/design-md.md`(lock은 기존 파일을 덮어쓰지 않음), `references/flow.md`(hook은 install-hook.mjs 실행 시에만)
- impeccable 4.8.0: 명령 표, `reference/init.md`(문서 선확인, 미감 질문 안 함), `reference/document.md`(기존 DESIGN.md는 묻고 갱신)
- ui-ux-pro-max 2.15.0: `search.py` 옵션(`--design-system`, `--persist`, `--project-name`, `--force`, `--variance/--motion/--density`)

**검색 확인**
- superpowers: [obra/superpowers](https://github.com/obra/superpowers), [설치·흐름 가이드](https://www.developersdigest.tech/blog/claude-code-superpowers-plugin-guide)
- grill-with-docs: [AI Hero](https://www.aihero.dev/grill-with-docs), [skills.sh](https://skills.sh/mattpocock/skills/grill-with-docs)
- Claude Code 공식 권장(탐색 → 계획 → 구현 → 커밋, 짧은 CLAUDE.md, 작업 사이 컨텍스트 비우기): [Best Practices](https://code.claude.com/docs/en/best-practices)
- Hallmark: [Nutlope/hallmark](https://github.com/Nutlope/hallmark)

**추측 (직접 검증 안 함)**
- 이 순서 전체를 처음부터 끝까지 실제로 돌려 보지는 않았습니다.
- "브레인스토밍 없이 진행" 문구로 superpowers 자동 호출이 멈추는지 (사용자 지시 우선 조항에 근거한 추론)
- 한국어 "빠르게·대충·시안"도 Hallmark 빠른 모드를 켜는지
- Hallmark가 프레임워크 프로젝트 안에서 실제 라우트로 빌드하는 방식
- 데스크톱 앱에서 superpowers를 켜는 메뉴 경로 (그래서 터미널 명령만 안내)
