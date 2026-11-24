# 테스트 자원 예산

이 PC(Ryzen 7 3800XT 8코어 16스레드, RAM 32GB)에서는 과부하로 블루스크린이 난 적이 있다.
테스트는 아래 예산 안에서만 자원을 쓰도록 계획하고 실행한다. 예산은 최대치가 아니라 PC가 여유를 유지하는 선이다.

## 예산
- CPU: 테스트에 쓰는 프로세스 합계 10스레드
- RAM: 테스트 합계 12GB. 단, 시작 전 가용 메모리에서 6GB를 뺀 값이 12GB보다 작으면 그 값으로 줄인다.
  가용 메모리 확인: `[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1MB,1)` (GB)

## 단가 (보수적으로 잡은 1개당 예상 최대치)
| 단위 | CPU | RAM |
|---|---|---|
| 단위 테스트 worker (Vitest, Jest, node --test, pytest) | 1 | 0.5GB |
| 브라우저 테스트 worker (Playwright 등, Chromium 1개) | 3 | 1.5GB |
| 테스트가 띄우는 dev 서버 1개 | 1 | 1GB |

동시 실행 수 = min(남은 CPU 예산 ÷ CPU 단가, 남은 RAM 예산 ÷ RAM 단가), 소수점 버림.
기본값은 단위 테스트 10, 브라우저 테스트 3(dev 서버 1개 포함)이다. 명령줄 옵션으로 지정해서 설정 파일 값보다 우선하게 한다.
- Vitest `--maxWorkers=N` / Jest `--maxWorkers=N` / node `--test-concurrency=N` / pytest-xdist `-n N` / Playwright `--workers=N`

## 실행 범위: 좁은 범위부터 넓힌다
1. 수정한 코드와 직접 관련된 테스트만 돌린다.
   `vitest related <파일>`, `vitest --changed`, `jest --findRelatedTests <파일>`, `playwright test --only-changed`
2. 통과하면 영향을 받는 모듈 단위로 넓힌다.
3. 전체 테스트는 작업 마무리 검증 때 한 번 돌린다.

## 실행 방식
- 테스트 명령은 한 번에 하나만 실행한다. 병렬 도구 호출이나 서브에이전트로 여러 테스트를 겹쳐 돌리면 예산이 그만큼 곱해지기 때문이다.
- 실행 중인 dev 서버와 브라우저도 예산에 포함해 계산한다.
- 예산이 부족하면 worker를 늘리지 말고 나눠서 순서대로 돌린다(예: Playwright `--project`를 하나씩).
- 테스트가 끝나면 띄운 dev 서버와 브라우저를 종료하고, 남은 node·chrome 프로세스가 없는지 확인한다.
- 단가보다 무겁게 느껴지는 테스트(시간 초과, 시스템이 느려짐)는 동시 실행 수를 줄여 다시 돌리고, 사용자에게 알린다.
