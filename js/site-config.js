// 사이트 설정은 이 파일 한 곳에서만 관리한다. (docs/brief.md '데이터 필드')
// summary·lead는 md 원문을 그대로 옮긴 것이다. md 문장이 바뀌면 여기도 같이 고친다.
export const siteConfig = {
  site: {
    name: '웹사이트 제작 워크플로우',
    url: '', // GitHub Pages를 켠 뒤 실제 주소로 채운다.
    repoUrl: 'https://github.com/Tiharun/web-workflow-with-agents',
    branch: 'main',
  },

  guides: [
    {
      id: 'final',
      menuLabel: '최종 워크플로우',
      file: 'content/final-workflow.md',
      downloadName: '최종 워크플로우 (Opus 5.5 Max).md',
      // level: 메뉴에 올릴 제목 수준. expand: 아래 단계까지 펼칠 장 제목(앞부분 일치).
      stageRule: { level: 2, expand: ['3. 단계별 진행과 프롬프트'] },
      // 첫 문단은 히어로의 한 줄 요약과 겹쳐서, md 머리말의 이 문장을 쓴다(.impeccable/surfaces/home.md).
      summary: '이 문서는 **순서 · 스킬 · 프롬프트**만 다룹니다.',
      stageCount: '0~10단계',
      legacyNames: ['최종 워크플로우 (Opus 5.5 Max).md', 'final-workflow.md'],
    },
    {
      id: 'steps',
      menuLabel: '웹사이트 제작 순서',
      file: 'content/website-steps.md',
      downloadName: '웹사이트 제작 순서.md',
      stageRule: { level: 2, expand: [] },
      summary: '이 문서는 "결정은 앞에서 글로 고정하고, 코드는 얇게 전체를 먼저 관통시킨 뒤 기능별로 살을 붙인다"는 원칙으로 짜여 있습니다.',
      stageCount: '10단계',
      legacyNames: ['웹사이트 제작 순서.md', 'website-steps.md'],
    },
    {
      id: 'design',
      menuLabel: '디자인 스킬 워크플로우',
      file: 'content/design-skills.md',
      downloadName: 'design-skills-workflow 디자인 스킬 사용 순서.md',
      stageRule: { level: 2, expand: ['2. 단계별 사용법과 프롬프트 예시'] },
      summary: '웹사이트를 기획하고 만들고 다듬을 때, 설치된 디자인 스킬을 **어떤 순서로, 어떤 명령과 프롬프트로** 쓰는지 정리한 문서입니다.',
      stageCount: '9단계',
      legacyNames: ['design-skills-workflow 디자인 스킬 사용 순서.md', 'design-skills.md'],
    },
  ],

  home: {
    featuredGuideId: 'final',
    // 최종 md '한 줄 요약' 원문
    lead: '결정은 `/grill-with-docs`로 글로 고정하고, 디자인은 대표 페이지 1개를 최종 품질로 만들어 `DESIGN.md`로 잠근 뒤, 스펙 → 플랜 → 실행 → 검증은 superpowers로 **마일스톤 하나씩** 돌린다.',
  },

  // 단계 자: 최종 md '3. 단계별 진행과 프롬프트' 아래 제목에서 만든다.
  ruler: {
    guideId: 'final',
    parentTitle: '3. 단계별 진행과 프롬프트',
    loop: { from: '6', to: '9', label: '마일스톤 루프' }, // 라벨은 md '1. 전체 루프 한눈에' 원문
  },

  visuals: [
    { guideId: 'final', headingId: '1-전체-루프-한눈에', type: 'stage-ruler' },
  ],

  // 화면 글(문서 밖 안내 문구). 한 곳에서 고친다.
  ui: {
    skip: '본문으로 건너뛰기',
    home: '홈',
    menu: '메뉴',
    guides: '가이드',
    openMenu: '메뉴 열기',
    closeMenu: '메뉴 닫기',
    guideTop: '처음부터 읽기',
    toc: '목차',
    tocOpen: '목차 열기',
    tocClose: '목차 닫기',
    download: 'md',
    downloadLabel: '원본 md 받기',
    copy: '복사',
    copied: '복사됨',
    copyFailed: '복사 못 함',
    darkMode: '다크 모드',
    warning: '경고',
    newTab: '(새 탭)',
    loading: '문서를 불러오는 중',
    loadError: '문서를 불러오지 못했습니다.',
    loadErrorHint: '네트워크를 확인한 뒤 다시 시도하거나 GitHub에서 원본을 여세요.',
    retry: '다시 시도',
    sourceLink: 'GitHub에서 원본 보기',
    stageMissing: '찾는 단계가 없어 가이드 맨 위를 보여 드립니다.',
    notFoundTitle: '찾을 수 없는 주소입니다',
    notFoundBody: '주소가 바뀌었거나 잘못 입력되었습니다. 아래 가이드에서 다시 시작하세요.',
    rulerLabel: '최종 워크플로우 단계 자',
  },
};

export const guideById = (id) => siteConfig.guides.find((g) => g.id === id);
