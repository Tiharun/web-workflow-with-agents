import { test, expect } from '@playwright/test';
import { render } from './helpers.mjs';
import { siteConfig } from '../../js/site-config.js';

test('external links open in a new tab with a hidden note', async ({ page }) => {
  await render(page, '[깃허브](https://github.com/x)\n');
  const a = page.getByRole('link', { name: `깃허브 ${siteConfig.ui.newTab}` });
  await expect(a).toHaveAttribute('target', '_blank');
  await expect(a).toHaveAttribute('rel', 'noopener noreferrer');
});

test('guide file links become site routes in the same tab', async ({ page }) => {
  await render(page, '[순서](<웹사이트 제작 순서.md>)\n');
  const a = page.getByRole('link', { name: '순서' });
  await expect(a).toHaveAttribute('href', '#/steps');
  await expect(a).not.toHaveAttribute('target', /.+/);
});
