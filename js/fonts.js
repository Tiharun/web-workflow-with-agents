// 첫 화면 글이 쓸 웹폰트(유니코드 범위별 하위 집합)를 글을 넣기 전에 받는다.
// 대체 글꼴로 먼저 그렸다가 바뀌면 줄 수가 달라져 아래 내용이 밀린다(측정: 홈 카드 31px, CLS 0.238).
// 느린 망에서는 오래 기다리지 않고 그대로 그린다.

/**
 * @param {string} text 곧 그릴 글(이 글자가 든 하위 집합만 받는다)
 * @param {number} ms 최대 대기 시간
 * @returns {Promise<void>} 거부하지 않는다
 */
export function fontsFor(text, ms = 1000) {
  if (!text || !document.fonts?.load) return Promise.resolve();
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-body').trim();
  if (!family) return Promise.resolve();
  return Promise.race([
    document.fonts.load(`1em ${family}`, text).then(() => {}, () => {}),
    new Promise((ok) => setTimeout(ok, ms)),
  ]);
}
