# 디자인 스킬 워크플로 가이드

웹사이트를 기획하고 만들고 다듬을 때, 설치된 디자인 스킬을 **어떤 순서로, 어떤 명령과 프롬프트로** 쓰는지 정리한 문서입니다.

- 기준 버전(이 PC에서 확인): impeccable 4.8.0 · interfaces 1.17.0 · ui-ux-pro-max 2.15.0 · playground(플러그인)
- Hallmark: [GitHub SKILL.md v2.0.0](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/SKILL.md) 기준 (설치를 가정)
- 예시 프로젝트: 동네 독립서점 **「책방 오늘」** 랜딩 페이지

---

## 0. 핵심 원칙 5가지

1. **한 단계에는 메인 스킬 하나만 씁니다.** 디자인 스킬 여러 개를 한 프롬프트에 섞으면 규칙끼리 충돌합니다.
2. **디자인 기준 파일은 하나만 둡니다.** 스킬마다 기준 파일을 따로 씁니다.
   | 파일 | 만드는 스킬 | 비고 |
   |---|---|---|
   | `PRODUCT.md` | impeccable `init` | 제품·고객·목표 같은 맥락. 디자인 값은 들어가지 않음 |
   | `DESIGN.md` | impeccable `document` | **Hallmark는 루트의 `design.md`를 바꿀 수 없는 기준으로 보고 따릅니다** |
   | `design-system/<slug>/MASTER.md` | ui-ux-pro-max `--persist` | 리서치 결과. 다른 스킬이 자동으로 읽지는 않음 |
   | `.hallmark/`, `tokens.css`, `base.css` | Hallmark | 빌드 기록과 토큰 |
3. **Windows는 파일 이름의 대소문자를 구분하지 않습니다.** 그래서 `DESIGN.md`와 `design.md`는 같은 파일입니다. Hallmark로 **새 디자인**을 만들 때는 `DESIGN.md`가 없어야 합니다. 이미 있다면 `DESIGN.old.md` 같은 이름으로 바꿔 두세요(추측: 대소문자 처리 방식은 Hallmark 문서에 나와 있지 않음).
4. **"만들기 → 기준 파일로 고정 → 다듬기 → 검사" 순서를 지킵니다.** 다듬기 단계부터는 새 디자인을 만들지 않고, 정해진 기준 안에서만 고칩니다.
5. **Hallmark 자동 검사 hook은 처음에는 켜지 않습니다.** 필요할 때만 `audit`를 직접 실행하세요. hook을 끄는 방법이 문서에 나와 있지 않기 때문입니다.

---

## 1. 전체 흐름 한눈에 보기

```
[1] 맥락 정리      impeccable init
      ↓
[2] 리서치·방향    ui-ux-pro-max (--design-system)  →  impeccable shape
      ↓
[3] 시각 탐색      playground (선택)
      ↓
[4] 첫 빌드        hallmark            (Figma나 시안이 있으면 interfaces:build-design)
      ↓
[5] 기준 고정      impeccable document  → DESIGN.md
      ↓
[6] 세부 다듬기    interfaces:better-* · impeccable typeset/layout/... · emil-design-eng
      ↓
[7] 모션           animate · apple-design · impeccable animate
      ↓
[8] 검사           interfaces:better-interface → hallmark audit → break-ui → better-accessibility
      ↓
[9] 출시 전 마감   impeccable harden → adapt → polish
```

> **명령어 표기**: 플러그인 스킬은 `/플러그인:스킬` 형태로 호출합니다(예: `/impeccable:impeccable`). Hallmark를 `npx skills add`로 설치했다면 `/hallmark`, 플러그인으로 설치했다면 `/hallmark:hallmark`입니다. 입력창에 `/`를 치면 나오는 목록에서 정확한 이름을 확인하세요.

---

## 2. 단계별 사용법과 프롬프트 예시

### [1] 맥락 정리 — `impeccable init`

**언제**: 프로젝트를 처음 시작할 때 한 번 실행합니다. `PRODUCT.md`에 대상 고객, 목표, 톤을 기록해 두면 이후 단계에서 계속 참고합니다.

```
/impeccable:impeccable init
```
프롬프트 예시:
```
/impeccable:impeccable init
「책방 오늘」은 서울 망원동의 12평 독립서점이야.
- 대상: 20~40대 동네 주민, 책 모임에 관심 있는 직장인
- 목표: 월 1회 '심야 책 모임' 예약 받기 (페이지의 단 하나의 행동)
- 톤: 조용하고 따뜻한 편집 디자인, 과한 장식 없이
- 실제 자료: 매장 사진 6장(/assets/photos), 모임 참여자 후기 3개(이름 공개 동의 받음)
PRODUCT.md로 정리해 줘.
```

---

### [2] 리서치·방향 — `ui-ux-pro-max` → `impeccable shape`

**ui-ux-pro-max**: 업종에 맞는 스타일, 색 팔레트, 폰트 조합을 데이터에서 찾아 추천받습니다. 최종 결정을 하는 단계가 아니라 **선택지를 모으는 단계**입니다.

```
/ui-ux-pro-max:ui-ux-pro-max
```
프롬프트 예시:
```
/ui-ux-pro-max:ui-ux-pro-max
"independent bookstore community events editorial" 로 --design-system 검색해 줘.
슬라이더는 --variance 6 --motion 3 --density 3, 프로젝트명 "Chaekbang Oneul".
결과를 --persist 로 프로젝트 루트(--output-dir)에 저장하고,
추천 팔레트 2개와 폰트 조합 2개를 표로 비교해 줘. 한글 웹폰트 대안도 같이.
```
- `--persist`로 저장하면 결과는 `design-system/<slug>/MASTER.md`에 쌓입니다. 같은 파일이 이미 있으면 덮어쓰지 않고 건너뜁니다(`--force`를 붙여야 덮어씀).

**impeccable shape**: 코드를 쓰기 전에 화면 구성과 UX를 기획합니다.
```
/impeccable:impeccable shape 랜딩 페이지
```
프롬프트 예시:
```
/impeccable:impeccable shape 랜딩 페이지
PRODUCT.md 기준으로 「책방 오늘」 랜딩의 섹션 구성과 정보 우선순위를 잡아 줘.
모임 예약 버튼까지 가는 흐름을 최단으로. 코드는 아직 쓰지 마.
```

---

### [3] 시각 탐색 (선택) — `playground`

**언제**: 색, 폰트, 여백, 모서리 둥글기 같은 값을 **말로 정하기 어려울 때** 씁니다. 슬라이더로 조정하면서 미리보기를 보고, 마음에 드는 조합이 나오면 하단에 생성된 프롬프트를 복사해 다음 단계에 붙여 넣습니다.

```
/playground:playground
```
프롬프트 예시:
```
/playground:playground
「책방 오늘」 히어로 섹션용 디자인 플레이그라운드 만들어 줘.
조절 항목: 배경색(종이색 계열), 포인트 색, 제목 폰트(명조/고딕), 제목 크기, 줄간격, 버튼 모서리.
프리셋: '심야 서점', '아침 햇살', '흑백 활판' 3개.
ui-ux-pro-max가 추천한 팔레트 2개도 프리셋으로 넣어 줘.
```
→ 복사한 프롬프트는 [4] Hallmark 브리프의 "분위기/기준 색" 부분에 붙여 넣습니다.

---

### [4] 첫 빌드 — `hallmark`

**언제**: 새 페이지를 만들거나 전체를 다시 디자인할 때. 미리 `DESIGN.md`가 없는지 확인하세요(원칙 3).

```
/hallmark <브리프>
/hallmark redesign <경로>       # 기존 페이지 전면 개편
```
프롬프트 예시 (브리프는 **자료, 대상, 행동, 톤, 분위기, 기준 색** 순서로 쓰면 좋습니다):
```
/hallmark 「책방 오늘」 랜딩 페이지
- 자료: /assets/photos 매장 사진 6장, 후기 3개(아래), 로고 /assets/logo.svg
  후기: "퇴근 후 유일하게 휴대폰을 덮는 시간" — 김지은 / ...
- 대상: 망원동 20~40대 직장인
- 단 하나의 행동: '심야 책 모임' 예약
- 톤: editorial
- 분위기: 늦은 밤 스탠드 불빛 아래 종이 냄새
- 기준 색: #2F3A2E (playground에서 고른 값)
테마 후보 3개 보여주고 고른 이유 설명해 줘.
```
- 테마를 직접 고르고 싶다면 `"Atelier 테마로"`라고 적습니다.
- 빠르게 시안만 보려면 끝에 `--fast`를 붙입니다(마지막 다듬기 단계 생략).
- 테마 없이 처음부터 자유롭게 만들려면 브리프에 `custom`을 넣습니다.

**Figma나 시안 이미지가 있을 때는 Hallmark 대신** `interfaces:build-design`을 씁니다.
```
/interfaces:build-design
이 Figma 프레임(링크)을 기존 토큰과 컴포넌트로 그대로 구현해 줘.
```

---

### [5] 기준 고정 — `impeccable document`

**언제**: 첫 빌드 결과가 마음에 들 때. 실제로 만들어진 코드에서 디자인 체계를 뽑아 `DESIGN.md`로 저장합니다. 이 파일이 생기면 이후 Hallmark도 이 기준을 따릅니다.

```
/impeccable:impeccable document
```
프롬프트 예시:
```
/impeccable:impeccable document
방금 Hallmark로 만든 tokens.css·base.css·index.html 기준으로 DESIGN.md 만들어 줘.
색·타입 스케일·간격·모서리·그림자·모션 값을 실제 코드 값 그대로.
```

---

### [6] 세부 다듬기 — `interfaces:better-*` / `impeccable` / `emil-design-eng`

**한 번에 한 가지 측면만** 다룹니다. 아래 표에서 고칠 부분에 맞는 스킬을 하나 고르세요.

| 고칠 것 | 1순위 스킬 | 대안 |
|---|---|---|
| 글자 크기·줄간격·줄바꿈 | `/interfaces:better-typography` | `/impeccable:impeccable typeset` |
| 색 체계·대비 | `/interfaces:better-colors` | `/impeccable:impeccable colorize` |
| 정렬·그룹·반응형 구조 | `/interfaces:better-layout` | `/impeccable:impeccable layout` |
| 그림자·모서리·아이콘 디테일 | `/interfaces:better-ui` | `/emil-design-eng` |
| 너무 밋밋함 / 너무 요란함 | `/impeccable:impeccable bolder` / `quieter` | — |
| 군더더기 정리 | `/impeccable:impeccable distill` | — |
| 버튼·안내·에러 문구 | `/interfaces:better-writing` | `/impeccable:impeccable clarify` |
| 시안 여러 개 비교 | `/impeccable:impeccable live` 또는 `generate` | — |

프롬프트 예시:
```
/interfaces:better-typography index.html
DESIGN.md의 타입 스케일은 유지하고, 한글 본문 줄간격·자간·제목 줄바꿈(어절 단위)만 고쳐 줘.
```
```
/impeccable:impeccable quieter 히어로 섹션
배경 그라데이션이 과해. DESIGN.md 범위 안에서 차분하게.
```
```
/impeccable:impeccable generate 3 variants 예약 버튼
```
```
/interfaces:better-writing
예약 폼의 라벨·에러·완료 문구를 PRODUCT.md 톤(조용하고 따뜻함)에 맞게 다시 써 줘.
```

---

### [7] 모션 — `animate` / `apple-design` / `impeccable animate`

| 상황 | 스킬 |
|---|---|
| 모션을 넣을지 말지, 이징·길이를 처음부터 정할 때 | `/animate` |
| 드래그·스와이프·바텀시트처럼 손으로 조작하는 모션 | `/apple-design` |
| 페이지 전체에 의미 있는 모션 추가 | `/impeccable:impeccable animate` |
| 애니메이션이 끊기거나 버벅일 때 | `/animation-performance` |

프롬프트 예시:
```
/animate
후기 카드가 스크롤로 보일 때 등장 모션을 넣을지 판단하고, 넣는다면 구현해 줘.
prefers-reduced-motion 대응 필수.
```

---

### [8] 검사 — `better-interface` → `hallmark audit` → `break-ui` → `better-accessibility`

검사 단계에서는 **먼저 보고서를 받고, 그다음에 고칩니다.**

```
/interfaces:better-interface index.html        # 접근성·레이아웃·문구·타이포·색·UI를 한 번에 보고 우선순위 보고서
/hallmark audit index.html                      # AI 티 나는 부분 + 최소 기준(대비·포커스·모바일) 보고서만
/break-ui 후기 카드                              # 긴 이름·빈 데이터·이모지 등 최악의 데이터 넣어 보기
/interfaces:better-accessibility                # WCAG 2.2 기준 키보드·포커스·ARIA 수정
/impeccable:impeccable audit index.html         # 접근성·성능·반응형 기술 점검
```
프롬프트 예시:
```
/interfaces:better-interface index.html
문제를 심각도 순으로 정리만 해 줘. 수정은 내가 고른 것만 할게.
```
```
/break-ui 후기 카드 컴포넌트
이름 40자, 후기 500자, 사진 없음, 아랍어 텍스트 케이스로 깨지는 곳 찾아 줘.
```

---

### [9] 출시 전 마감 — `impeccable harden → adapt → polish`

```
/impeccable:impeccable harden 예약 폼     # 에러, 빈 상태, 극단적인 입력값 처리
/impeccable:impeccable adapt               # 모바일·태블릿 대응
/impeccable:impeccable polish              # 출시 직전 마지막 다듬기
```
필요하면 `/performance-optimization`(로딩 속도, Core Web Vitals)과 `/mobile-native`(실제 휴대폰에서의 사용감)도 이어서 실행합니다.

---

## 3. 상황별 빠른 경로

| 상황 | 순서 |
|---|---|
| **새 랜딩·마케팅 사이트** | [1] → [2] → [3] → [4] hallmark → [5] → [6] → [8] → [9] |
| **앱·대시보드·관리자 화면** | [1] → ui-ux-pro-max(`--density 8`) → impeccable shape → impeccable으로 빌드 → [6] → [8] |
| **기존 사이트 조금 개선** | `/interfaces:better-interface`로 진단 → 표의 해당 스킬로 하나씩 → `/impeccable:impeccable polish` |
| **기존 사이트 전면 개편** | `DESIGN.md` 이름 바꿔 두기 → `/hallmark redesign <경로>` → [5]부터 진행 |
| **Figma·시안을 구현** | `/interfaces:build-design` → [6] → [8] |
| **잘 만든 사이트 참고** | (interfaces의 explain-interface 스킬은 설치 폴더에는 있지만, 현재 호출 목록에서는 확인되지 않음) |

---

## 4. 자주 하는 실수

- ❌ `/hallmark`와 `/impeccable:impeccable bolder`를 한 프롬프트에 같이 쓰기 → 서로 반대 방향으로 고칩니다.
- ❌ 다듬기 단계에서 "더 멋지게 해 줘"처럼 막연하게 요청하기 → **무엇을, 어느 범위에서** 고칠지 적습니다.
- ❌ 실제 수치·후기·로고 없이 빌드하기 → Hallmark는 사실 정보를 지어내지 않고 그 부분을 비워 둡니다.
- ❌ ui-ux-pro-max 리서치 결과를 그대로 최종안으로 쓰기 → 선택지로만 쓰고, 최종 결정은 [4]·[5]에서 합니다.
- ❌ 검사와 수정을 한 번에 시키기 → 보고서를 먼저 받고, 고칠 항목을 직접 골라 수정을 맡깁니다.

---

## 5. 확인 근거

- **측정(이 PC)**: impeccable 명령 목록(`SKILL.md` Commands 표), ui-ux-pro-max `search.py` 옵션(`--design-system`, `--persist`, `--output-dir`, `--variance/--motion/--density`), interfaces 스킬 설명, playground 템플릿 구성
- **검색 확인**: Hallmark 명령·브리프·파일 구조 — [SKILL.md](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/SKILL.md), [README](https://github.com/Nutlope/hallmark)
- **추측(직접 검증 안 함)**: Hallmark가 `DESIGN.md`(대문자)를 `design.md`로 인식하는지, Hallmark와 impeccable을 실제로 같이 썼을 때의 동작
