// Playwright 설정: e2e 한 프로젝트 + 시각 대조 8 프로젝트(4폭 × 라이트·다크). 스펙 §6.
import { defineConfig } from '@playwright/test';

const widths = [375, 768, 1280, 1440];
const schemes = ['light', 'dark'];

export default defineConfig({
  testDir: './tests',
  webServer: {
    command: 'python -m http.server 8000 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8000',
    reuseExistingServer: true,
    stderr: 'ignore', // http.server 접속 기록이 테스트 출력을 덮지 않게
  },
  // GSAP(JS) 모션은 Playwright가 멈추지 못하므로 전체를 '동작 줄이기'로 돌린다.
  use: { baseURL: 'http://127.0.0.1:8000', reducedMotion: 'reduce' },
  snapshotPathTemplate: '{testFileDir}/__screenshots__/{platform}/{projectName}/{arg}{ext}',
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002 } },
  projects: [
    { name: 'e2e', testMatch: '**/e2e/**/*.spec.mjs', use: { viewport: { width: 1280, height: 800 }, colorScheme: 'light' } },
    ...widths.flatMap((w) => schemes.map((scheme) => ({
      name: `visual-${w}-${scheme}`,
      testMatch: '**/visual/**/*.spec.mjs',
      use: { viewport: { width: w, height: 900 }, colorScheme: scheme },
    }))),
  ],
});
