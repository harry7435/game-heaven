# game-heaven

여러 웹 게임을 담는 개인 게임 플랫폼. 새 게임을 계속 추가할 예정이라 "게임 추가가 쉬운 구조"를 목표로 만들었습니다. 첫 게임은 [2048](https://play2048.co/)입니다.

## Getting Started

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 스크립트

```bash
npm run dev        # 개발 서버
npm run build       # 프로덕션 빌드
npm start           # 빌드 결과 실행
npm run lint         # eslint
npm test            # vitest run (게임 로직 단위 테스트)
npm run test:watch  # vitest watch 모드
```

## 구조

- 게임은 `src/games/<게임id>/` 폴더에 독립 모듈로 존재하며 `src/games/registry.ts`에 등록됩니다. 새 게임 추가 = 폴더 하나 + 레지스트리 한 줄.
- 게임 로직은 React와 무관한 순수 함수로 작성하고 Vitest로 단위 테스트합니다 (예: `src/games/2048/logic.ts` / `logic.test.ts`).
- 점수·진행 상태는 `src/lib/storage.ts`를 통해 localStorage에 저장합니다.

자세한 설계는 [`docs/superpowers/specs/2026-08-13-game-heaven-design.md`](docs/superpowers/specs/2026-08-13-game-heaven-design.md)를 참고하세요.

## 기술 스택

Next.js (App Router) · TypeScript · Tailwind CSS · Vitest
