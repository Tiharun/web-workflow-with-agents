import { test, expect } from '@playwright/test';
import { render } from './helpers.mjs';
import { siteConfig } from '../../js/site-config.js';

const { ui } = siteConfig;
const fence = (lang, body) => `\`\`\`${lang}\n${body}\n\`\`\`\n`;

test('wide tables become cards with labels', async ({ page }) => {
  await render(page, '| 가 | 나 | 다 |\n|---|---|---|\n| 1 | `a/b/c` | 3 |\n');
  const table = page.locator('#doc .table-wrap > table.table--cards');
  await expect(table).toHaveCount(1);
  const cells = table.locator('tbody tr').first().locator('td');
  for (const [i, label] of ['가', '나', '다'].entries()) await expect(cells.nth(i)).toHaveAttribute('data-label', label);
  await expect(cells.nth(1).locator('code wbr')).toHaveCount(2);
});

test('narrow tables stay tables', async ({ page }) => {
  await render(page, '| 가 | 나 |\n|---|---|\n| 1 | 2 |\n');
  await expect(page.locator('#doc .table-wrap > table')).toHaveCount(1);
  await expect(page.locator('#doc .table--cards')).toHaveCount(0);
});

test('checklists are read-only and named', async ({ page }) => {
  await render(page, '- [ ] 할 일\n- [x] 끝난 일\n');
  await expect(page.locator('#doc ul.checklist')).toHaveCount(1);
  const todo = page.getByRole('checkbox', { name: '할 일', exact: true });
  await expect(todo).toBeDisabled();
  await expect(todo).not.toBeChecked();
  await expect(todo).toHaveAttribute('tabindex', '-1');
  await expect(page.getByRole('checkbox', { name: '끝난 일' })).toBeChecked();
});

test('pass condition becomes a box', async ({ page }) => {
  await render(page, '**통과 조건**\n- [ ] a\n');
  await expect(page.locator('#doc .pass > p.pass__title')).toHaveCount(1);
  await expect(page.locator('#doc .pass > ul')).toHaveCount(1);
});

test('pass label without a list stays plain', async ({ page }) => {
  await render(page, '**통과 조건**\n\n문장\n');
  await expect(page.locator('#doc .pass')).toHaveCount(0);
});

test('warnings get a mark and a hidden label', async ({ page }) => {
  await render(page, '- ⚠️ 조심할 점\n');
  const li = page.locator('#doc li.is-warn');
  await expect(li).toHaveCount(1);
  await expect(li.locator('.warn-mark svg')).toHaveCount(1);
  await expect(li.locator('.warn-mark .visually-hidden')).toHaveText(`${ui.warning}:`);
  await expect(li).not.toContainText('⚠');
});

test('badges for measure, search and guess', async ({ page }) => {
  await render(page, '값(측정) 그리고 근거(검색 확인: MDN) 또 생각(추측) 끝(참고)\n');
  const badges = page.locator('#doc .badge');
  await expect(badges).toHaveText(['측정', '검색 확인: MDN', '추측']);
  expect(await badges.evaluateAll((els) => els.map((e) => e.dataset.kind))).toEqual(['measure', 'search', 'guess']);
  await expect(page.locator('#doc .badge svg.badge__icon')).toHaveCount(1);
  await expect(page.locator('#doc .badge[data-kind="measure"] svg.badge__icon')).toHaveCount(1);
  await expect(page.locator('#doc p')).toContainText('(참고)');
});

test('badges wrap inline code inside the parentheses', async ({ page }) => {
  await render(page, '실행됩니다(`a: true`, 측정). 끝(`x`) 그리고(`y`, 참고)\n');
  const badge = page.locator('#doc .badge');
  await expect(badge).toHaveCount(1);
  await expect(badge).toHaveAttribute('data-kind', 'measure');
  await expect(badge).toHaveText('a: true, 측정');
  await expect(badge.locator('code')).toHaveText('a: true');
  await expect(badge.locator('svg.badge__icon')).toHaveCount(1);
  await expect(page.locator('#doc p')).toHaveText('실행됩니다 a: true, 측정. 끝(x) 그리고(y, 참고)');
});

test('code blocks keep text exact', async ({ page }) => {
  await render(page, fence('bash', 'echo "⚠️ (측정)"'));
  await expect(page.locator('#doc .prompt .prompt__lang')).toHaveText('bash');
  await expect(page.locator('#doc .prompt button[data-copy]')).toHaveAttribute('aria-label', ui.copy);
  expect(await page.locator('#doc .prompt code').evaluate((c) => c.textContent)).toBe('echo "⚠️ (측정)"');
  await expect(page.locator('#doc .prompt .badge, #doc .prompt .warn-mark')).toHaveCount(0);
});

test('text fences have no language label', async ({ page }) => {
  await render(page, fence('text', 'hi'));
  await expect(page.locator('#doc .prompt')).toHaveCount(1);
  await expect(page.locator('#doc .prompt__lang')).toHaveCount(0);
});

test('box drawings become scrollable figures', async ({ page }) => {
  await render(page, fence('', '┌─┐\n│가│\n└─┘'));
  await expect(page.locator('#doc figure.diagram > pre[tabindex="0"]')).toHaveCount(1);
  await expect(page.locator('#doc span.w2')).toHaveText('가');
  await expect(page.locator('#doc .prompt')).toHaveCount(0);
});

test('inline code badges and warnings stay as written', async ({ page }) => {
  await render(page, '문장 `⚠️ (추측)`\n');
  await expect(page.locator('#doc .badge, #doc .warn-mark')).toHaveCount(0);
  await expect(page.locator('#doc code')).toHaveText('⚠️ (추측)');
});
