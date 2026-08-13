"use client";

import dynamic from "next/dynamic";

/**
 * 게임은 localStorage 기반이라 서버 프리렌더가 의미 없다.
 * SSR을 끄고 클라이언트에서만 렌더한다.
 */
export const GameClient = dynamic(
  () => import("@/games/2048/Game2048").then((m) => m.Game2048),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto aspect-square w-full max-w-md animate-pulse rounded-xl bg-[#bbada0]/40" />
    ),
  },
);
