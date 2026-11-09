---
name: 웹사이트 제작 워크플로우
description: 웹사이트 제작 순서를 단계 자 위에 재어 보여 주는 한국어 가이드
colors:
  paper: "#f8fafc"
  paper-2: "#f1f5f9"
  paper-3: "#e2e8f0"
  surface: "#ffffff"
  ink: "#1e293b"
  ink-2: "#334155"
  muted: "#475569"
  rule: "#e2e8f0"
  rule-2: "#cbd5e1"
  rule-strong: "#64748b"
  graphite: "#0f172a"
  graphite-2: "#1e293b"
  graphite-ink: "#e2e8f0"
  graphite-muted: "#94a3b8"
  graphite-rule: "#334155"
  accent: "#2563eb"
  accent-2: "#93c5fd"
  accent-wash: "#eff6ff"
  accent-ink: "#ffffff"
  accent-deep: "#1d4ed8"
  accent-edge: "#1e40af"
  focus: "#2563eb"
  warn: "#b45309"
  warn-wash: "#fffbeb"
  warn-rule: "#fcd34d"
  note: "oklch(0.95 0.075 158)"
  note-edge: "oklch(0.80 0.12 158)"
  note-fold: "oklch(0.87 0.11 158)"
  note-ink: "oklch(0.40 0.10 158)"
  key-face: "#ffffff"
  key-edge: "#cbd5e1"
  scrim: "rgb(15 23 42 / 0.45)"
  feature-from: "#1d4ed8"
  feature-to: "#1e3a8a"
  feature-ink: "#ffffff"
  feature-muted: "#c7d7fe"
  feature-rule: "rgb(255 255 255 / 0.22)"
  dark-paper: "#0b1220"
  dark-paper-2: "#111a2e"
  dark-paper-3: "#1a2540"
  dark-surface: "#111a2e"
  dark-ink: "#e2e8f0"
  dark-ink-2: "#cbd5e1"
  dark-muted: "#9aa8bd"
  dark-rule: "#1e2a44"
  dark-rule-2: "#2c3a58"
  dark-rule-strong: "#7c8aa3"
  dark-graphite: "#060b16"
  dark-graphite-2: "#0f172a"
  dark-graphite-rule: "#24314d"
  dark-accent: "#6ea8fe"
  dark-accent-wash: "#13234a"
  dark-accent-ink: "#0b1220"
  dark-accent-deep: "#a8c8ff"
  dark-accent-edge: "#3b6fd1"
  dark-warn: "#fbbf24"
  dark-warn-wash: "#241a07"
  dark-warn-rule: "#6b4e12"
  dark-note: "oklch(0.29 0.055 160)"
  dark-note-edge: "oklch(0.46 0.09 160)"
  dark-note-fold: "oklch(0.38 0.075 160)"
  dark-note-ink: "oklch(0.86 0.13 158)"
  dark-key-face: "#16213a"
  dark-key-edge: "#334155"
  dark-scrim: "rgb(2 6 16 / 0.62)"
  dark-feature-from: "#1e40af"
  dark-feature-to: "#172554"
  dark-feature-ink: "#f1f5ff"
  dark-feature-muted: "#b9cbf5"
  dark-feature-rule: "rgb(255 255 255 / 0.16)"
typography:
  display:
    fontFamily: "Inter Variable, Pretendard Variable, system-ui, sans-serif"
    fontSize: "clamp(1.9375rem, 1.45rem + 2.1vw, 2.4375rem)"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter Variable, Pretendard Variable, system-ui, sans-serif"
    fontSize: "clamp(1.4375rem, 1.2rem + 1vw, 1.6875rem)"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter Variable, Pretendard Variable, system-ui, sans-serif"
    fontSize: "clamp(1.1875rem, 1.1rem + 0.4vw, 1.3125rem)"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  figure:
    fontFamily: "Inter Variable, Pretendard Variable, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.4rem + 2.4vw, 3rem)"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  lead:
    fontFamily: "Inter Variable, Pretendard Variable, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "Inter Variable, Pretendard Variable, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Inter Variable, Pretendard Variable, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
  caption:
    fontFamily: "Inter Variable, Pretendard Variable, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
  mono:
    fontFamily: "ui-monospace, SF Mono, Consolas, Pretendard Variable, monospace"
    fontSize: "0.86em"
rounded:
  hair: "4px"
  input: "6px"
  card: "8px"
  cut: "8px"
  cut-l: "16px"
  button: "24px"
  pill: "999px"
spacing:
  3xs: "2px"
  2xs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
  3xl: "96px"
  4xl: "144px"
components:
  button:
    backgroundColor: "{colors.key-face}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    padding: "0 24px"
    height: "44px"
  button-hover:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    padding: "0 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-deep}"
    textColor: "{colors.accent-ink}"
  icon-button:
    backgroundColor: "{colors.key-face}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    size: "40px"
  nav-button:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "0 12px"
    height: "40px"
  nav-button-hover:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
  nav-button-open:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.accent-deep}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.cut-l}"
    padding: "24px"
  card-featured:
    backgroundColor: "{colors.feature-from}"
    textColor: "{colors.feature-ink}"
    rounded: "{rounded.cut-l}"
    padding: "24px"
  stage-tile:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.cut-l}"
    padding: "12px 16px"
  stage-tile-hover:
    backgroundColor: "{colors.accent-wash}"
  pass-note:
    backgroundColor: "{colors.note}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px 24px 24px"
---

# Design System: 웹사이트 제작 워크플로우

<!-- 출처: css/tokens.css · css/base.css · css/site.css(홈 #/ 와 공통 헤더). 값은 코드에서 그대로 옮겼다. 코드를 바꾸면 이 파일도 같이 고친다. -->

## Overview

**Creative North Star: "The Stage Ruler (단계 자)"**

이 사이트는 웹사이트 제작 과정을 하나의 자로 잰다. 0단계부터 10단계, 그리고 출시 게이트까지가 한 축 위의 눈금이다. 화면의 모든 요소는 그 자의 말투를 따른다. 가는 선, 정확한 간격, 숫자는 같은 폭으로 정렬하고, 포인트색은 '여기가 중요하다'는 눈금에만 쓴다.

바탕은 차가운 종이(슬레이트 계열)이고, 코발트 한 가지가 길잡이 역할을 한다. 문서를 읽는 사이트(Read 모드)라서 화려함보다 정밀함이 먼저다. 그래서 장식은 세 군데로만 제한한다. 첫 화면 위쪽에 번지는 코발트 빛, 코발트 면으로 된 강조 카드, 단계 자 눈금 무늬다. 버튼은 눌리는 키처럼 아래쪽에 두께가 있고, 카드는 한쪽 모서리만 크게 깎인 잎 모양이다.

라이트·다크 두 모드는 색상(hue)을 그대로 두고 밝기만 뒤집는다. 다크에서는 그림자를 끄고 테두리로 경계를 만든다. `prefers-reduced-motion`이면 모든 모션은 사실상 0초가 되고, 스크립트가 없어도 글은 처음부터 보인다.

**Key Characteristics:**
- 한 축의 단계 자가 사이트의 상징이며, 홈과 가이드에서 같은 눈금 말투를 쓴다.
- 포인트색은 코발트 하나다. 주요 단계(4단계)·현재 위치·포커스·강조 카드에만 쓴다.
- 차가운 슬레이트 바탕에 1px 선으로 구획하고, 그림자는 얕다.
- 키 모양 버튼, 잎 모양 카드(한쪽만 16px로 깎임)를 쓴다.
- 라틴 문자는 Inter, 한글은 Pretendard 가변 글꼴로 쓰고, 제목은 굵기 650 한 가지다.

## Colors

차가운 슬레이트 종이 위에 코발트 한 가지를 쓰고, 경고(호박색)와 통과 조건(초록)만 의미 색으로 따로 둔다.

### Primary
- **Cobalt Signal (코발트)** (`accent`): 링크 밑줄, 현재 메뉴 표시(아래 2px 선), 4단계 눈금과 숫자, 마우스를 올린 눈금, 강조 버튼 바탕에 쓴다. 다크에서는 밝은 코발트(`dark-accent`)로 바뀐다.
- **Deep Cobalt (짙은 코발트)** (`accent-deep`): 강조 버튼 마우스 올림, 열린 메가메뉴 버튼 글자, 반복 구간 표시 글자에 쓴다.
- **Cobalt Edge (코발트 테두리)** (`accent-edge`): 강조 버튼의 테두리와 아래쪽 키 두께 그림자에 쓴다.
- **Cobalt Mist (코발트 안개)** (`accent-wash`): 열린 메뉴 버튼 바탕, 단계 타일 마우스 올림 바탕, 첫 화면 위쪽 배경에 쓴다.
- **Sky Tick (하늘 눈금)** (`accent-2`): 첫 화면 배경의 두 번째 빛 번짐, 통과 조건 메모의 테이프, 어두운 코드 상자의 포커스·복사 완료 표시에 쓴다.
- **Feature Slab (강조 카드 면)** (`feature-from` → `feature-to`, 135° 그라데이션): 홈의 '최종 워크플로우' 카드 하나에만 쓴다. 글자는 `feature-ink`, 보조 글은 `feature-muted`, 아래쪽 눈금 무늬는 `feature-rule`이다.

### Tertiary
- **Pass Mint (통과 민트)** (`note`, 테두리 `note-edge`, 접힌 모서리 `note-fold`, 제목 `note-ink`): 가이드 각 단계 끝의 '통과 조건' 메모 카드에만 쓴다. 코발트(정보)와 호박색(경고) 어느 쪽과도 겹치지 않게 초록(성공)을 골랐다.
- **Caution Amber (주의 호박색)** (`warn`, `warn-wash`, `warn-rule`): ⚠ 경고 항목의 아이콘, 바탕, 테두리에만 쓴다.

### Neutral
- **Cool Paper (차가운 종이)** (`paper`): 페이지 바탕. `paper-2`는 마우스 올림·코드 조각 바탕, `paper-3`는 로딩 뼈대(skeleton)에 쓴다.
- **White Sheet (흰 면)** (`surface`): 카드, 메가메뉴 패널 바탕.
- **Slate Ink (슬레이트 잉크)** (`ink`): 본문과 제목. `ink-2`는 요약문·카드 본문·메뉴 버튼 글자, `muted`는 단위·캡션·보조 아이콘에 쓴다.
- **Hairlines (가는 선)** (`rule`, `rule-2`, `rule-strong`): `rule`은 장식용 구분선이다(배경 대비 1.18:1). `rule-2`는 카드·타일 테두리와 단계 이름 연결선, `rule-strong`은 단계 자 축과 체크박스 테두리처럼 의미 있는 경계에 쓴다.
- **Graphite (그라파이트)** (`graphite`, `graphite-2`, `graphite-ink`, `graphite-muted`, `graphite-rule`): 프롬프트 코드 상자 같은 어두운 면에 쓴다.
- **Key Face / Key Edge (키 면 / 키 두께)** (`key-face`, `key-edge`): 일반 버튼의 면과 아래쪽 두께.
- **Scrim (가림막)** (`scrim`): 목차 드로어와 모바일 메뉴 뒤 배경.

### Named Rules
**The One Signal Rule.** 포인트색은 코발트 하나다. 새 색이 필요하면 먼저 의미를 묻는다. 경고는 호박색, 통과는 민트만 허용한다.

**The Same Hue, Flipped Light Rule.** 다크 모드는 새 팔레트가 아니다. 같은 색상을 두고 밝기만 뒤집는다. 값은 frontmatter의 `dark-*` 토큰을 쓴다.

**The Meaningful Border Rule.** 경계가 정보라면 배경 대비 3:1 이상인 `rule-strong` 이상을 쓴다. `rule`은 장식에만 쓴다.

## Typography

**Display Font:** Inter Variable (한글은 Pretendard Variable, 마지막은 system-ui, sans-serif)
**Body Font:** Inter Variable (같은 글꼴 묶음)
**Label/Mono Font:** ui-monospace, SF Mono, Consolas, Pretendard Variable, monospace (명령어·파일 경로 전용)

**Character:** 기하학적인 산세리프 한 벌로 제목과 본문을 모두 쓴다. 위계는 크기, 굵기 650, 좁힌 자간(-0.02em)으로만 만든다. 한글은 Pretendard가 받아 줘서 두 문자가 한 줄에서 같은 무게로 읽힌다.

### Hierarchy
- **Display** (650, `clamp(1.9375rem, 1.45rem + 2.1vw, 2.4375rem)`, 줄간격 1.3, 자간 -0.02em): 홈 히어로의 사이트 이름(h1). 최대 12em 폭.
- **Headline** (650, `clamp(1.4375rem, 1.2rem + 1vw, 1.6875rem)`, 1.3): 섹션 제목(h2), 강조 카드 제목, 보조 카드 숫자.
- **Title** (650, `clamp(1.1875rem, 1.1rem + 0.4vw, 1.3125rem)`, 1.3): 카드 제목(h3).
- **Figure** (650, `clamp(2rem, 1.4rem + 2.4vw, 3rem)`, 1, 자간 -0.03em, 같은 폭 숫자): 강조 카드의 '0~10' 같은 큰 숫자.
- **Lead** (400, 1.1875rem, 1.65): 히어로 한 줄 요약. 최대 40em 폭, `ink-2` 색.
- **Body** (400, 1.0625rem, 1.55): 본문. 일반 단락은 최대 65ch.
- **Label** (600, 0.9375rem): 메뉴 버튼, 카드 단위('단계'), 메가메뉴 링크.
- **Caption** (400, 0.8125rem): 단계 자의 단계 이름, 메가메뉴 설명.
- **Mono** (0.86em, 1px 테두리 + `paper-2` 바탕, 4px 모서리): 문장 안의 명령어와 경로.

화면 폭 40rem 이하에서는 Display 1.9375rem, Headline 1.5rem, Title 1.1875rem, Figure 2.25rem으로 고정한다.

### Named Rules
**The One Weight Rule.** 제목은 모두 굵기 650 한 가지다. 위계는 굵기가 아니라 크기로 만든다.

**The Tabular Count Rule.** 단계 번호와 개수는 항상 같은 폭 숫자(`font-variant-numeric: tabular-nums`)로 쓴다. 자의 눈금이 흔들리지 않게 하기 위해서다.

**The No-Tracked-Caps Rule.** 라벨·캡션·메뉴는 본문 글꼴의 작은 크기로, 문장형 대소문자로 쓴다. 자간을 벌린 대문자 라벨은 쓰지 않는다.

## Layout

- **컨테이너:** 최대 1440px, 가운데 정렬, 좌우 여백 64px. 60rem 이하에서 24px, 40rem 이하에서 16px로 줄인다. 1920px에서는 여백만 넓어지고 본문 폭과 그리드는 그대로다.
- **간격 단위:** 2 · 4 · 8 · 12 · 16 · 24 · 40 · 64 · 96 · 144px(frontmatter `spacing`). 그 사이 값은 쓰지 않는다.
- **헤더:** 높이 64px(48rem 미만 56px), 상단에 붙는다(sticky).
- **앵커 여백:** 제목으로 이동하면 붙어 있는 막대(헤더, 80rem 미만은 가이드 도구 막대까지) 아래 20px에 멈춘다(`--anchor-offset`, 루트 `scroll-padding-top` 한 번만 적용). 붙어 있는 막대의 조작 요소는 초점을 받아도 페이지를 굴리지 않는다(스냅 영역을 앵커 여백만큼 아래로 옮긴다. 메뉴 본문은 제외). 메뉴(메가메뉴·모바일 메뉴)가 열린 동안은 루트 앵커 여백을 0으로 둬 메뉴 안 초점 이동이 페이지를 굴리지 않게 한다.
- **홈 히어로:** 기본은 한 열(간격 24px, 위아래 40/24px). 48rem 이상에서 위아래 64/40px. 80rem 이상에서 5:7 두 열(열 간격 64px)로 바뀐다. 왼쪽은 제목, 오른쪽은 요약, 아래 전체 폭에 단계 자가 온다. 위아래 96/40px이다.
- **입구 카드:** 한 열(간격 16px) → 48rem 이상 2열, 강조 카드는 두 칸을 다 쓰고 안에서 '본문 | 숫자' 두 열이 된다 → 80rem 이상 간격 24px, 카드 안 여백 40px, 최소 높이 15rem.
- **배경:** 첫 화면 위쪽에만 코발트 빛 두 개(오른쪽 위 64×34rem, 왼쪽 위 40×24rem)가 번지고, 40rem 아래부터는 원래 바탕색이다.
- **읽기 폭:** 본문 46rem.

## Elevation & Depth

평평한 면 위에 얕은 그림자를 더하는 혼합 방식이다. 기본은 1px 선과 색의 단차로 구획한다. 그림자는 세 경우에만 쓴다. 키 모양 버튼의 두께, 떠 있는 패널, 마우스를 올렸을 때의 들림이다. 다크 모드에서는 대부분의 그림자를 끄고 테두리로 바꾼다.

### Shadow Vocabulary
- **Card rest** (`box-shadow: 0 1px 2px rgb(15 23 42 / 0.06)`): 카드와 통과 조건 메모의 기본 상태. 다크에서는 없음.
- **Key** (`box-shadow: 0 2px 0 0 var(--color-key-edge), 0 4px 8px -4px rgb(15 23 42 / 0.22)`): 일반 버튼의 아래쪽 두께. 다크에서는 `0 2px 0 0 var(--color-key-edge)`만 남는다.
- **Key accent** (`box-shadow: 0 2px 0 0 var(--color-accent-edge), 0 6px 10px -6px rgb(30 64 175 / 0.5)`): 강조 버튼. 다크에서는 없음.
- **Key press** (`box-shadow: inset 0 1px 2px rgb(15 23 42 / 0.14)`): 버튼을 누르는 순간.
- **Panel** (`box-shadow: 0 18px 40px -18px rgb(15 23 42 / 0.28)`): 메가메뉴 패널. 다크에서는 `0 0 0 1px var(--color-rule-2)` 테두리로 바뀐다.
- **Lift** (`box-shadow: 0 14px 28px -16px rgb(30 64 175 / 0.45)`): 마우스를 올린 보조 카드(3px 위로). 다크에서는 `0 14px 28px -16px rgb(0 0 0 / 0.6)`.
- **Feature** (`box-shadow: 0 18px 36px -22px rgb(30 64 175 / 0.6)`): 강조 카드. 다크에서는 없음.
- **Glass header:** 헤더는 바탕색 82% + `backdrop-filter: blur(14px) saturate(1.2)`로 뒤 배경을 살짝 비친다.

### Named Rules
**The Flat-At-Rest Rule.** 면은 기본적으로 평평하다. 들림(Lift)은 마우스 올림에 대한 반응으로만 나타난다. 마우스가 없는 기기에는 적용하지 않는다(`@media (hover: hover)`).

## Shapes

모서리는 쓰임에 따라 네 가지로 나눈다.

- **잎 모양 (`16px 4px`):** 카드와 메가메뉴 단계 타일. 왼쪽 위·오른쪽 아래는 16px, 나머지 두 모서리는 4px인 비대칭 모서리다. 사이트를 알아보게 하는 형태다.
- **알약형 (24px):** 버튼, 메뉴 버튼, 복사 버튼. 현재 메뉴는 아래 두 모서리만 0으로 만들어 2px 코발트 밑줄과 이어진다.
- **작은 모서리 (6px · 4px):** 메가메뉴 링크와 입력 요소(6px), 코드 조각과 뼈대(4px).
- **메모지 (8px, 오른쪽 위만 0):** 통과 조건 카드. 오른쪽 위는 24px 접힌 모서리, 위 가운데에는 -2° 기울어진 76×18px 테이프가 붙는다.

선은 모두 1px(`--rule-hair`)이다. 단계 자의 굵은 눈금(4단계·출시)만 2px다.

## Components

### Buttons
눌리는 키처럼 단단하고, 아래쪽에 2px 두께가 있다.
- **Shape:** 알약형(24px), 1px 테두리(`key-edge`).
- **Default:** `key-face` 바탕, `ink` 글자, 굵기 600. 높이 44px, 좌우 24px(`.btn`). 도구 버튼은 40px, 아이콘 버튼은 40×40px.
- **Primary:** `accent` 바탕, `accent-ink` 글자, `accent-edge` 테두리, Key accent 그림자. 마우스를 올리면 `accent-deep`이 된다.
- **Hover / Active / Focus:** 올리면 `paper-2` 바탕과 함께 1px 위로, 누르면 1px 아래로 내려가며 Key press 그림자가 된다. 포커스는 2px `focus` 윤곽선에 3px 간격이다. 비활성은 투명도 0.5.
- **Motion:** transform·배경·글자색·그림자에 120ms `ease-out`.

### Cards / Containers
잎 모양 면이며, 카드 전체가 하나의 링크다.
- **Corner Style:** `16px 4px`.
- **Background:** `surface`, 1px `rule-2` 테두리, Card rest 그림자.
- **Internal Padding:** 24px(80rem 이상 40px). 본문과 아래쪽(숫자·화살표) 사이 40px.
- **Hover:** 테두리가 `accent`로 바뀌고, 3px 위로 뜨며 Lift 그림자가 생긴다. 오른쪽 아래 화살표는 4px 오른쪽으로 가며 `accent`가 된다(220ms `ease-out`). 누르면 원위치.
- **Focus:** 2px `focus` 윤곽선에 3px 간격.
- **Featured:** 홈의 첫 카드만 코발트 면(`feature-from` → `feature-to`, 135°)이다. 테두리는 투명하고, 아래쪽 22px 높이에 단계 자 눈금 무늬가 있다(12px 간격 짧은 눈금 + 60px 간격 긴 눈금, `feature-rule`).

### Navigation
- **헤더:** 왼쪽에 사이트 이름(650, 1.0625rem, 자간 -0.01em), 오른쪽에 가이드 버튼 3개와 다크 모드 키. 버튼 사이에 18px 높이의 세로 구분선이 있다.
- **가이드 버튼:** 높이 40px, 0.9375rem 굵기 600, `ink-2` 글자. 올리면 `paper-2` 바탕, 열리면 `accent-wash` 바탕에 `accent-deep` 글자이고 화살표가 180° 돈다(220ms). 현재 가이드는 아래 2px 코발트 선으로 표시한다.
- **메가메뉴:** 헤더 바로 아래 전체 폭 패널(`surface`, Panel 그림자). 6px 위에서 내려오며 나타난다(220ms `ease-out`). 열은 13rem | 16rem | 나머지, 간격 40px. 48~80rem에서는 가이드 이름과 '처음부터 읽기'가 위 한 줄로 올라가고, 아래가 16rem | 나머지 두 열(단계 타일 2열, 단계 열이 없는 가이드는 장 목록이 전체 폭 2열)이 된다. 단계 타일은 잎 모양이고, 올리면 `accent` 테두리에 `accent-wash` 바탕이 된다.
- **모바일(48rem 미만):** 가이드 버튼을 숨기고 메뉴 버튼(햄버거)과 시트형 메뉴로 바꾼다.

### Footer
- **틀:** 위 1px `rule` 선, `paper` 바탕, 위아래 여백 `xl`(40px). 왼쪽 `.brand`, 가운데 가이드 링크, 오른쪽 저장소 링크.
- **링크:** label(0.9375rem, 600), `ink-2` 글자, 최소 높이 40px. 올리면 `accent` 글자와 밑줄. 화살표 없음.
- **모바일(48rem 미만):** 세로로 쌓고 간격은 `md`(16px). 다크 모드는 토큰 그대로.
- **위치:** 본문이 짧아도 화면 바닥에 붙는다(본문이 남은 높이를 채운다).

### Stage Ruler (단계 자, 시그니처)
워크플로우 전체를 한 축으로 보여 주는 홈의 상징이다. 눈금 하나하나가 해당 단계로 가는 링크다.
- **축:** 1px `rule-strong` 가로선, 그 아래 8px 간격의 5px 잔눈금(`rule-2`).
- **눈금:** 1px × 14px `ink` 세로선. 주요 단계(4단계)는 2px × 18px `accent`, 출시 게이트는 2px × 18px `ink`다. 마우스를 올리면 모든 눈금이 1.45배 길어지고 `accent`가 된다(220ms).
- **숫자:** 같은 폭 숫자, 굵기 650. 0.8125rem이며 자 폭 40rem 이상에서 1.0625rem.
- **단계 이름:** 자 폭 40rem 이상에서만 보인다. 0.8125rem, `ink-2`, 줄간격 1.35, 숫자 아래 40px. 짝수 번째 이름은 40px 더 내려 겹치지 않게 하고, 1px `rule-2` 선으로 눈금과 잇는다. 양 끝 이름도 눈금 가운데에 맞춘다.
- **반복 구간:** 7~9단계 위에 1px `accent` 테두리의 괄호와 아이콘·라벨(`accent-deep`, `accent-wash` 바탕)이 있다.
- **첫 그리기(GSAP):** 축이 왼쪽부터 1.1초(`power3.inOut`) 동안 그어진다. 눈금은 0.25초부터 0.06초 간격으로 솟고(0.6초, `expo.out`), 숫자·이름·반복 구간이 뒤따른다. 동작 줄이기 설정이면 처음부터 다 그려진 상태다.

### Diagrams (도식 비주얼)
md 제목 바로 아래 `.visual` 틀 안에 붙는 그림이다. 단계 자의 말투를 그대로 쓴다. 글자·링크는 HTML이고, 기호·화살표만 `aria-hidden` SVG(`currentColor`)다. 자체 모션은 없고 스크롤 등장만 따른다. 가로·세로 전환은 도식 폭 40rem(컨테이너 쿼리) 기준이다.
- **흐름(`.flow`):** 40rem 이상은 단계마다 한 칸인 가로 축(1px `rule-strong`), 미만은 왼쪽 세로 축. 칸마다 같은 폭 숫자(650) → 축 위 기호(20px) → 이름(0.8125rem, `ink-2`, 줄간격 1.35). 주요 단계는 숫자·기호 `accent`, 이름 `ink` 600. 선택 단계는 1px dashed `rule-strong` 점. 코드 작성 정도는 원 기호(빈 원·반 채움·채움)이고, 범례는 축 아래 오른쪽 0.8125rem `muted`. 누르는 영역은 24px 이상, 올리면 `accent`.
- **문서 지도(`.docmap`):** 단계 칸을 40rem 이상은 가로로, 미만은 세로로 늘어놓고 칸 사이에 순서 화살표(`rule-strong`, 세로일 때 아래로)를 둔다. 칸 머리는 위 1px `rule-strong` 선, 같은 폭 숫자(650, 1.0625rem)와 단계 이름(0.8125rem, `ink-2`). 아래에 파일 칩을 쌓는다(세로형은 줄바꿈해 늘어놓는다).
- **칩(문서 지도·빠른 경로 공용):** 1px `rule-2` 테두리, 6px 모서리, `paper-2` 바탕, 0.8125rem, 파일 이름은 `font-outlier`. 긴 이름은 아무 데서나 줄바꿈한다. 강조 칩은 `accent` 테두리 + `accent-wash` 바탕, 라벨 `accent-deep`.

### Pass Note (통과 조건 메모)
가이드 각 단계 끝의 확인 목록을 메모지처럼 붙여, 지나치지 않게 한다.
- `note` 바탕, 1px `note-edge` 테두리, 8px 모서리(오른쪽 위만 0), 안쪽 여백 16px 24px 24px, Card rest 그림자.
- 제목 '통과 조건'은 `note-ink`, 1.0625rem. 체크박스 테두리는 `note-edge`.
- 접힌 모서리(24px, `note-fold`)와 테이프(`accent-2` 50% 투명)를 둔다.

### Motion
- **토큰:** `ease-out` = `cubic-bezier(0.16, 1, 0.3, 1)`, `ease-in` = `cubic-bezier(0.7, 0, 0.84, 0)`, `ease-in-out` = `cubic-bezier(0.65, 0, 0.35, 1)`. 시간은 micro 120ms, short 220ms, long 420ms.
- **쓰임:** 색 변화는 120ms, 들림·회전·패널은 220ms. 목차 드로어는 420ms `ease-out`으로 열리고 220ms `ease-in-out`으로 닫힌다. 로딩 뼈대는 1.4초 맥박.
- **스크롤 등장(GSAP ScrollTrigger):** 화면 아래에 있는 블록만 28px 아래에서 올라오며 나타난다(0.9초, `expo.out`, 0.08초 간격, 한 번만).
- **원칙:** `transform`과 `opacity`만 움직인다. `prefers-reduced-motion: reduce`이면 모든 애니메이션·전환이 0.01ms가 된다.

## Do's and Don'ts

### Do:
- **Do** 색·글꼴은 `css/tokens.css`의 토큰으로만 쓴다. 바깥 규칙에 색 값을 직접 적지 않는다.
- **Do** 단계를 나타내는 새 요소는 단계 자의 말투(1px 선, 굵은 눈금 2px, 같은 폭 숫자)를 따른다.
- **Do** 카드형 링크는 잎 모양(`16px 4px`)과 1px `rule-2` 테두리로 만든다.
- **Do** 다크 모드는 `dark-*` 값으로 밝기만 뒤집고, 그림자 대신 테두리를 쓴다.
- **Do** 모든 조작 요소에 2px `focus` 윤곽선을 즉시 보이게 둔다.
- **Do** 움직임은 `transform`·`opacity`만 쓰고, 동작 줄이기와 스크립트 꺼짐에서도 글이 바로 보이게 한다.

### Don't:
- **Don't** 코발트 외의 포인트색을 추가하지 않는다. 의미 색은 경고(호박색)와 통과(민트)뿐이다.
- **Don't** 강조 카드의 코발트 면을 다른 카드에 복제하지 않는다. 화면당 하나다.
- **Don't** 자간을 벌린 대문자 라벨, 가운뎃점으로 이은 메타 문자열, 링크 글자에 붙인 화살표를 쓰지 않는다.
- **Don't** `transition: all`을 쓰거나 `width`·`height`·`top`·`left`를 애니메이션하지 않는다.
- **Don't** 카드 안에 카드를 넣지 않는다.
