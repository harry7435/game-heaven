# game-heaven 설계 문서 (1단계: 로컬 전용)

날짜: 2026-08-13
상태: 승인됨 (Firebase 연동은 2단계로 연기)

## 목적

여러 웹 게임을 담는 개인 게임 플랫폼. 첫 게임은 2048.
게임을 계속 추가할 예정이므로 "새 게임 추가가 쉬운 구조"가 핵심 목표.

## 범위

### 1단계 (이 문서의 범위)
- 플랫폼: 홈 화면(게임 카드 목록) + 게임 화면 라우팅
- 2048 게임: 기본 플레이, 애니메이션, Undo, 이어하기
- 점수 저장: localStorage만 사용

### 2단계 (제외 — 추후 별도 설계)
- Firebase Auth(Google 로그인) + Firestore 개인 기록 저장
- 로그인 시 로컬 최고점과 서버 값 병합

## 기술 스택

- Next.js (App Router) + TypeScript + Tailwind CSS
- 테스트: Vitest (게임 로직 단위 테스트, TDD)
- 외부 애니메이션 라이브러리 없음 (CSS transform 기반)

## 플랫폼 구조

### 라우팅
- `/` — 홈. 게임 레지스트리를 순회해 게임 카드 렌더링
- `/games/2048` — 2048 게임 화면

### 게임 레지스트리 패턴
- 각 게임은 `src/games/<게임id>/` 폴더에 독립 모듈로 존재
- 게임 모듈이 export하는 것:
  - `meta`: `{ id, name, description, themeColor }`
  - `GameComponent`: 게임 화면 React 컴포넌트
- `src/games/registry.ts`에서 게임 목록을 배열로 관리
- **새 게임 추가 = 폴더 하나 + 레지스트리 한 줄 등록**

### 공통 저장 유틸
- `src/lib/storage.ts` — localStorage 래퍼
  - 최고점수: `gh:<gameId>:best`
  - 진행 상태: `gh:<gameId>:save`
- 저장소 인터페이스를 이 모듈로 추상화해 2단계에서 서버 연동 시 교체 지점을 한 곳으로 유지

## 2048 게임

### 로직 (순수 함수, React 무관)
`src/games/2048/logic.ts`:
- 보드: 4×4, 타일 배열. 각 타일은 `{ id, value, row, col }` — **고유 id로 이동/병합 추적** (애니메이션 기반)
- `move(state, direction)` → `{ state, gained, moved }` (이동/병합 결과, 획득 점수, 실제 이동 여부)
- `spawnTile(state, rng)` — 빈 칸에 2(90%) 또는 4(10%) 생성. rng 주입으로 테스트 가능하게
- `isGameOver(state)` — 이동 가능한 수가 없으면 종료
- `hasWon(state)` — 2048 타일 달성 (달성 후 계속하기 가능)
- 한 수의 규칙: 같은 값 타일은 이동 방향으로 한 번만 병합, 병합 결과값만큼 점수 획득

### UI / 애니메이션
- 타일을 absolute 포지션 + CSS `transform: translate`로 배치, 이동 시 트랜지션
- 병합/등장 시 scale 팝 효과
- 입력: 키보드 방향키 + 모바일 스와이프(터치)
- 애니메이션 진행 중 입력은 큐잉하지 않고 즉시 다음 상태로 스냅 처리(단순성 우선)

### Undo
- 상태 스택(보드 + 점수)으로 무제한 되돌리기
- 정책: undo를 써도 최고점수로 인정 (개인 기록이므로 캐주얼 정책)

### 이어하기
- 매 수마다 진행 상태(보드, 점수, undo 스택 제외)를 localStorage에 저장
- 재방문 시 저장된 판 복원, "새 게임" 버튼으로 초기화

## 테스트

- `logic.ts`의 이동/병합/점수/게임오버/승리 판정을 Vitest로 단위 테스트 (TDD)
- UI는 수동 확인 위주

## 구현 순서

1. 프로젝트 스캐폴딩 (Next.js + TS + Tailwind + Vitest) + 홈/레지스트리
2. 2048 로직 TDD
3. 2048 UI + 애니메이션
4. Undo + 이어하기 + 최고점수
