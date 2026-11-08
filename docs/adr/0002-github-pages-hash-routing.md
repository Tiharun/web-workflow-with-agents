# GitHub Pages 브랜치 배포 + `.nojekyll` + 해시 주소

GitHub Pages에 `main` 브랜치 루트를 그대로 배포한다(빌드 없음). Pages 기본 Jekyll은 front matter 없는 md도 HTML로 바꿔 버려 md 원본을 읽을 수 없게 되므로 `.nojekyll`을 반드시 둔다. Pages는 서버 주소 재작성 없이 404.html만 지원하므로, 한 HTML 안의 화면 전환은 `#/가이드/단계` 같은 해시 주소로 하고 모든 경로는 하위 경로(`/web-workflow-with-agents/`)에서도 동작하도록 상대 경로로 쓴다.

## Consequences

- `.nojekyll`을 지우면 md 불러오기가 깨진다.
- 무료 계정에서는 저장소가 공개여야 한다.
