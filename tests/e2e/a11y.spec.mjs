// WCAG 2.2 AA 자동 검사(axe-core): 화면 9종 × 라이트·다크 × 375·1280px(계획 M7 Task 2).
// 대비(1.4.3)·누르는 영역(2.5.8)·이름·구조를 함께 본다. 열린 상태까지 재야 다크 모드의 메뉴·툴팁 대비를 놓치지 않는다.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { screens, contrastFailures, openPage } from './helpers.mjs';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const scheme of ['light', 'dark']) for (const width of [375, 1280]) {
  test.describe(`${scheme} ${width}px`, () => {
    test.use({ colorScheme: scheme, viewport: { width, height: 900 } });
    for (const s of screens) {
      test(`no WCAG 2.2 AA violations: ${s.name}`, async ({ page }) => {
        await s.open(page);
        const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
      });
      // axe는 그라데이션 배경 위 글자의 대비를 '판정 보류'로 넘긴다(final에서 420개, 측정). 그래서 직접 잰다.
      test(`text contrast meets AA on every background: ${s.name}`, async ({ page }) => {
        await s.open(page);
        expect(await contrastFailures(page, { scroll: !s.name.endsWith('-open') })).toEqual([]);
      });
    }
  });
}

// 대조군: 검사기가 실제로 낮은 대비를 잡는지 확인한다(그라데이션 배경 위 본문).
test('the contrast check catches low-contrast body text', async ({ page }) => {
  await openPage(page, '/#/final');
  await page.addStyleTag({ content: '#doc p { color: #c8cdd4 !important; }' });
  expect((await contrastFailures(page)).some((f) => f.startsWith('p'))).toBe(true);
});
