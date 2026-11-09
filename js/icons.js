// 선 아이콘(24 그리드, 1.75 선). 모두 장식이므로 aria-hidden. 이름은 버튼 글자나 aria-label이 맡는다.
const PATHS = {
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  warning: '<path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z"/><path d="M12 9.5v4"/><path d="M12 17h.01"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  right: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  left: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
  download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  loop: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.7"/><path d="M20 4v4.7h-4.7"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.3"/><path d="M4 20v-4.7h4.7"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  // 코드 작성 정도(✗ 없음 · △ 일부 · ○ 전부): 빈 원, 왼쪽 반 채움, 채움
  'mark-node': '<circle cx="12" cy="12" r="7"/>', // 표시 없는 흐름 마디
  'mark-none': '<path d="M8 8l8 8M16 8l-8 8"/>', // md ✗(코드 없음). md ○(전부)와 헷갈리지 않게 원이 아니다
  'mark-part': '<circle cx="12" cy="12" r="7"/><path d="M12 5a7 7 0 0 0 0 14Z" fill="currentColor"/>',
  'mark-full': '<circle cx="12" cy="12" r="7" fill="currentColor"/>',
};

export const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PATHS[name]}</svg>`;
