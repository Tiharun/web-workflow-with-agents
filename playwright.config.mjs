// Playwright 설정: e2e 한 프로젝트 + 시각 대조 8 프로젝트(4폭 × 라이트·다크). 스펙 §6.
import { defineConfig } from '@playwright/test';

const widths = [375, 768, 1280, 1440];
const schemes = ['light', 'dark'];

export default defineConfig({
  testDir: './tests',
  // 이 PC에서 새 브라우저 8개가 동시에 첫 촬영을 하면 가끔 촬영이 멈춘다(측정: 8개 약 8%, 4개 0/96).
  workers: 4,
  webServer: {
    // 개발용 8000과 겹치지 않는 포트. http.server 대신 대기열을 늘린 tests/serve.py를 쓴다.
    command: 'python tests/serve.py 8123',
    url: 'http://127.0.0.1:8123',
    reuseExistingServer: false,
  },
  // GSAP(JS) 모션은 Playwright가 멈추지 못하므로 전체를 '동작 줄이기'로 돌린다.
  use: { baseURL: 'http://127.0.0.1:8123', reducedMotion: 'reduce' },
  snapshotPathTemplate: '{testDir}/{testFileDir}/__screenshots__/{platform}/{projectName}/{arg}{ext}',
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
