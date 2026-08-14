# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev                                  # 개발 서버 (http://localhost:3000)
pnpm build                                # 프로덕션 빌드
pnpm lint                                 # eslint
pnpm test                                 # vitest run — 전체 테스트 1회 실행
pnpm test:watch                           # vitest watch 모드
pnpm vitest run src/games/2048/logic.test.ts   # 단일 파일 테스트
pnpm vitest run -t "테스트 이름"               # 이름으로 단일 테스트 실행
```

## 아키텍처

**게임 레지스트리 패턴.** 각 게임은 `src/games/<게임id>/`에 독립 모듈로 존재하며 `meta.ts`(`GameMeta`: id/name/description/themeClass/symbol)를 export한다. `src/games/registry.ts`의 `games` 배열에 등록되면 홈 화면(`src/app/page.tsx`)이 이를 순회해 카드로 렌더링한다. 새 게임을 추가할 때는 폴더 하나 + 레지스트리 한 줄이면 된다.

**게임 로직과 UI 분리.** 게임 규칙은 React와 무관한 순수 함수로 작성한다 (`src/games/2048/logic.ts`). 난수가 필요한 함수는 `Rng` 함수를 인자로 주입받아 테스트에서 결정론적으로 검증할 수 있게 한다. 타일처럼 애니메이션 대상이 되는 엔티티는 안정적인 `id`를 유지해 이동/병합 전후 매칭에 사용한다.

**게임 화면은 클라이언트 전용.** 게임은 초기화 시점에 localStorage를 바로 읽으므로 서버 프리렌더가 무의미하다. 라우트 페이지(`src/app/games/<id>/page.tsx`)는 `next/dynamic`으로 `ssr: false` 클라이언트 컴포넌트를 로드한다 (`src/app/games/2048/game-client.tsx` 참고). 새 게임도 이 패턴을 따른다.

**저장소 추상화.** `src/lib/storage.ts`가 localStorage를 래핑해 게임별 최고점수(`gh:<gameId>:best`)와 진행 상태(`gh:<gameId>:save`)를 관리한다. 향후 서버 저장(Firebase 등) 도입 시 이 모듈이 유일한 교체 지점이 되도록 게임 코드는 이 모듈을 통해서만 저장소에 접근한다.

**경로 별칭.** `@/*`는 `src/*`로 매핑된다 (`tsconfig.json`).

설계 배경은 `docs/superpowers/specs/2026-08-13-game-heaven-design.md`에 있다. 현재는 1단계(로컬 전용, localStorage)만 구현되어 있고, Firebase Auth/Firestore 연동은 2단계로 의도적으로 미뤄둔 상태다.
