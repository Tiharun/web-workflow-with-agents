# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Web Workflow Guide
**Generated:** 2026-11-08 16:16:21
**Category:** Knowledge Base/Documentation
**Design Dials:** Motion 5/10 (Standard)

---

## 프로젝트 적용 메모 (2026-11-08, 아래 생성 결과보다 우선)

> 이 파일은 ui-ux-pro-max가 생성한 **후보안**이다. 최종 기준은 4단계에서 잠그는 `DESIGN.md`이고, 제품 규칙은 [PRODUCT.md](../../PRODUCT.md)와 [docs/brief.md](../../docs/brief.md)를 따른다.

- **검색 없음**: Page Pattern의 "Hero with search bar"와 Anti-Patterns의 "No search"는 적용하지 않는다(brief '안 만들 것'). 찾기는 메가메뉴와 목차 드로어가 맡는다.
- **문의 CTA·FAQ 아코디언 없음**: 1인용 가이드라서 brief에 없다.
- **한글 글꼴**: Atkinson Hyperlegible은 라틴 문자용이다. 확장판도 4,464자로 한글 11,172자를 담지 못한다. 한글 글꼴을 따로 쌓아야 한다(예: `Pretendard Variable`).
- **글꼴 전달**: 아래 Google Fonts `@import`는 쓰지 않는다. ADR 0003에 따라 woff2 파일을 `vendor/`에 넣는다.
- **누르는 영역**: 최소 기준은 WCAG 2.2 AA의 24×24px다. 44px는 권장값이다.
- **명암비**(측정): 이 팔레트는 본문 13.98:1, 링크 #2563EB 4.94:1, 강조 버튼 글자 5.17:1로 AA를 통과한다. 테두리 #E2E8F0은 배경과 1.18:1이라 장식용으로만 쓴다. 의미 있는 경계는 3:1 이상이어야 한다.
- **다크 모드 팔레트는 생성되지 않았다.** 4단계에서 정한다.

### 플레이그라운드에서 고른 값 (2026-11-08, 4-6 대표 페이지 빌드 입력)

[playground.html](playground.html)에서 사용자가 고른 값이다. 최종 확정은 빌드 뒤 `DESIGN.md`에서 한다.

| 항목 | 값 |
|---|---|
| 팔레트 | ① 회색 + 링크 파랑. 배경 #F8FAFC, 글자 #1E293B, 포인트 #2563EB, 버튼 글자 #FFFFFF |
| 글꼴 | 본문과 제목 모두 Inter + Pretendard (고딕) |
| 제목 크기 | h1 39px · h2 27px · h3 21px, 본문 17px |
| 본문 줄간격 | 1.55 |
| 버튼 모서리 | 24px (알약형) |
| 명암비(측정) | 본문 13.98:1, 링크 4.94:1, 버튼 5.17:1. AA 통과 |

- 참고(검색 확인): 한글 본문 줄간격은 실무 가이드에서 1.6~1.8을 권하는 경우가 많다. 1.55는 그보다 조금 촘촘하다. 공인된 단일 기준은 없으므로 빌드 화면에서 다시 확인한다.

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#475569` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#64748B` | `--color-secondary` |
| On Secondary | `#FFFFFF` | `--color-on-secondary` |
| Accent/CTA | `#2563EB` | `--color-accent` |
| On Accent/CTA | `#FFFFFF` | `--color-on-accent` |
| Background | `#F8FAFC` | `--color-background` |
| Foreground | `#1E293B` | `--color-foreground` |
| Card | `#FFFFFF` | `--color-card` |
| Card Foreground | `#1E293B` | `--color-card-foreground` |
| Muted | `#EAEFF3` | `--color-muted` |
| Muted Foreground | `#475569` | `--color-muted-foreground` |
| Border | `#E2E8F0` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `--color-on-destructive` |
| Ring | `#475569` | `--color-ring` |

**Color Notes:** Neutral grey + link blue

### Typography

- **Heading Font:** Atkinson Hyperlegible
- **Body Font:** Atkinson Hyperlegible
- **Mood:** accessible, readable, inclusive, WCAG, dyslexia-friendly, clear
- **Google Fonts:** [Atkinson Hyperlegible + Atkinson Hyperlegible](https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #2563EB;
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #475569;
  border: 2px solid #475569;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #F8FAFC;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #475569;
  outline: none;
  box-shadow: 0 0 0 3px #47556920;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Minimalism & Swiss Style

**Keywords:** Clean, simple, spacious, functional, white space, high contrast, geometric, sans-serif, grid-based, essential

**Best For:** Enterprise apps, dashboards, documentation sites, SaaS platforms, professional tools

**Key Effects:** Subtle hover (200-250ms), smooth transitions, sharp shadows if any, clear type hierarchy, fast loading

### Page Pattern

**Pattern Name:** FAQ/Documentation Landing

- **Conversion Strategy:** Reduce support tickets. Track search analytics. Show related articles. Contact escalation path.
- **CTA Placement:** Search bar prominent + Contact CTA for unresolved questions
- **Section Order:** Hero with search bar > Popular categories > FAQ accordion > Contact/support CTA

---

## Motion

**Stagger List** (Standard) — Trigger: load or scroll | Duration: 300-450ms | Easing: `back.out(1.4)`

```js
gsap.from('.grid-item', { opacity: 0, scale: 0.92, y: 16, duration: 0.4, stagger: { each: 0.06, from: 'start', grid: 'auto' }, ease: 'back.out(1.4)' });
```

**Framework notes:** grid: 'auto' lets GSAP infer rows/columns from a CSS grid layout for a natural wave stagger; Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately

- ✅ Combine with from: 'center' for a bento-grid layout to draw the eye inward first
- ❌ Don't use back.out on dense data tables; the overshoot reads as sloppy on informational UI
- ⚡ Group DOM writes; avoid interleaving layout reads (getBoundingClientRect) between staggered tweens

---

## Anti-Patterns (Do NOT Use)

- ❌ Poor navigation
- ❌ No search

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
