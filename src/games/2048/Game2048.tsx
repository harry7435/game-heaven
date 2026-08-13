"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createInitialState,
  hasWon,
  isGameOver,
  move,
  spawnTile,
  type Direction,
  type GameState,
  type Tile,
} from "./logic";
import { meta } from "./meta";
import {
  clearSavedGame,
  loadBestScore,
  loadSavedGame,
  saveBestScore,
  saveGame,
} from "@/lib/storage";

interface SaveData {
  state: GameState;
  keepPlaying: boolean;
}

/** 병합으로 사라지는 타일. 병합 지점까지 미끄러진 뒤 새 타일에 덮인다. */
type GhostTile = Tile;

const GAP = 2.5; // 보드 폭 대비 % 단위 간격
const CELL = (100 - GAP * 5) / 4;

function posStyle(row: number, col: number): React.CSSProperties {
  return {
    width: `${CELL}%`,
    height: `${CELL}%`,
    left: `${GAP + col * (CELL + GAP)}%`,
    top: `${GAP + row * (CELL + GAP)}%`,
  };
}

const TILE_COLORS: Record<number, { bg: string; fg: string }> = {
  2: { bg: "#eee4da", fg: "#776e65" },
  4: { bg: "#ede0c8", fg: "#776e65" },
  8: { bg: "#f2b179", fg: "#f9f6f2" },
  16: { bg: "#f59563", fg: "#f9f6f2" },
  32: { bg: "#f67c5f", fg: "#f9f6f2" },
  64: { bg: "#f65e3b", fg: "#f9f6f2" },
  128: { bg: "#edcf72", fg: "#f9f6f2" },
  256: { bg: "#edcc61", fg: "#f9f6f2" },
  512: { bg: "#edc850", fg: "#f9f6f2" },
  1024: { bg: "#edc53f", fg: "#f9f6f2" },
  2048: { bg: "#edc22e", fg: "#f9f6f2" },
};

function tileColor(value: number) {
  return TILE_COLORS[value] ?? { bg: "#3c3a33", fg: "#f9f6f2" };
}

function tileFontClass(value: number) {
  if (value < 100) return "text-3xl";
  if (value < 1000) return "text-2xl";
  return "text-xl";
}

/** 이 컴포넌트는 SSR 없이 렌더된다(page 참고) — 초기화에서 localStorage를 바로 읽는다. */
export function Game2048() {
  const [state, setState] = useState<GameState>(
    () => loadSavedGame<SaveData>(meta.id)?.state ?? createInitialState(Math.random),
  );
  const [keepPlaying, setKeepPlaying] = useState<boolean>(
    () => loadSavedGame<SaveData>(meta.id)?.keepPlaying ?? false,
  );
  const [best, setBest] = useState(() => loadBestScore(meta.id));
  const [ghosts, setGhosts] = useState<GhostTile[]>([]);
  const [spawnedId, setSpawnedId] = useState<number | null>(null);
  const [undoStack, setUndoStack] = useState<GameState[]>([]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const persist = useCallback(
    (next: GameState, keep: boolean) => {
      saveGame<SaveData>(meta.id, { state: next, keepPlaying: keep });
      if (next.score > best) {
        saveBestScore(meta.id, next.score);
        setBest(next.score);
      }
    },
    [best],
  );

  const doMove = useCallback(
    (dir: Direction) => {
      if (isGameOver(state)) return;
      if (hasWon(state) && !keepPlaying) return;

      const result = move(state, dir);
      if (!result.moved) return;
      const next = spawnTile(result.state, Math.random);
      // spawnTile은 타일을 배열 끝에 추가한다
      const spawned = next.tiles[next.tiles.length - 1];

      // 병합으로 사라진 타일 → 병합 지점까지 미끄러지는 고스트
      const surviving = new Set(result.state.tiles.map((t) => t.id));
      const destByOldId = new Map<number, Tile>();
      for (const t of result.state.tiles) {
        if (t.mergedFrom) {
          destByOldId.set(t.mergedFrom[0], t);
          destByOldId.set(t.mergedFrom[1], t);
        }
      }
      setGhosts(
        state.tiles
          .filter((t) => !surviving.has(t.id))
          .map((t) => {
            const dest = destByOldId.get(t.id)!;
            return { ...t, row: dest.row, col: dest.col };
          }),
      );
      setSpawnedId(spawned.id);
      setUndoStack((stack) => [...stack, state]);
      setState(next);
      persist(next, keepPlaying);
    },
    [state, keepPlaying, persist],
  );

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, -1));
    setState(prev);
    setGhosts([]);
    setSpawnedId(null);
    persist(prev, keepPlaying);
  }, [undoStack, keepPlaying, persist]);

  const newGame = useCallback(() => {
    clearSavedGame(meta.id);
    const fresh = createInitialState(Math.random);
    setState(fresh);
    setGhosts([]);
    setSpawnedId(null);
    setUndoStack([]);
    setKeepPlaying(false);
    saveGame<SaveData>(meta.id, { state: fresh, keepPlaying: false });
  }, []);

  // 키보드 입력
  useEffect(() => {
    const keyToDir: Record<string, Direction> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const dir = keyToDir[e.key];
      if (!dir) return;
      e.preventDefault();
      doMove(dir);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [doMove]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? "right" : "left");
    else doMove(dy > 0 ? "down" : "up");
  };

  const gameOver = isGameOver(state);
  const won = hasWon(state) && !keepPlaying;

  return (
    <div className="mx-auto w-full max-w-md select-none">
      <div className="mb-4 flex items-end justify-between">
        <h1 className="text-3xl font-extrabold text-[#776e65] dark:text-[#eee4da]">
          2048
        </h1>
        <div className="flex gap-2">
          <ScoreBox label="점수" value={state.score} />
          <ScoreBox label="최고" value={best} />
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={newGame}
          className="rounded-lg bg-[#8f7a66] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7f6a56]"
        >
          새 게임
        </button>
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="rounded-lg bg-[#8f7a66] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7f6a56] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↩ 되돌리기
        </button>
      </div>

      <div
        className="relative aspect-square w-full touch-none rounded-xl bg-[#bbada0]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* 배경 셀 */}
        {Array.from({ length: 16 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-lg bg-[#eee4da]/35"
            style={posStyle(Math.floor(i / 4), i % 4)}
          />
        ))}

        {/* 고스트 타일: 병합 지점까지 미끄러진 뒤 새 타일에 덮임 */}
        {ghosts.map((tile) => (
          <TileView key={`ghost-${tile.id}`} tile={tile} />
        ))}

        {/* 실제 타일 */}
        {state.tiles.map((tile) => (
          <TileView
            key={tile.id}
            tile={tile}
            spawned={tile.id === spawnedId}
            merged={tile.mergedFrom !== undefined}
          />
        ))}

        {/* 게임 종료 / 승리 오버레이 */}
        {(gameOver || won) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-[#eee4da]/80">
            <p className="text-3xl font-extrabold text-[#776e65]">
              {won ? "🎉 2048 달성!" : "게임 오버"}
            </p>
            <div className="flex gap-2">
              {won && (
                <button
                  onClick={() => {
                    setKeepPlaying(true);
                    persist(state, true);
                  }}
                  className="rounded-lg bg-[#8f7a66] px-4 py-2 font-semibold text-white hover:bg-[#7f6a56]"
                >
                  계속하기
                </button>
              )}
              {gameOver && undoStack.length > 0 && (
                <button
                  onClick={undo}
                  className="rounded-lg bg-[#8f7a66] px-4 py-2 font-semibold text-white hover:bg-[#7f6a56]"
                >
                  ↩ 되돌리기
                </button>
              )}
              <button
                onClick={newGame}
                className="rounded-lg bg-[#8f7a66] px-4 py-2 font-semibold text-white hover:bg-[#7f6a56]"
              >
                새 게임
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-foreground/60">
        방향키 또는 스와이프로 타일을 움직이세요.
      </p>
    </div>
  );
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-16 rounded-lg bg-[#bbada0] px-3 py-1 text-center">
      <div className="text-[11px] font-semibold uppercase text-[#eee4da]">
        {label}
      </div>
      <div className="text-lg font-bold text-white tabular-nums">{value}</div>
    </div>
  );
}

function TileView({
  tile,
  spawned = false,
  merged = false,
}: {
  tile: Tile;
  spawned?: boolean;
  merged?: boolean;
}) {
  const color = tileColor(tile.value);
  return (
    <div
      className="absolute transition-[left,top] duration-100 ease-in-out"
      style={posStyle(tile.row, tile.col)}
    >
      <div
        className={`flex h-full w-full items-center justify-center rounded-lg font-extrabold ${tileFontClass(tile.value)} ${
          spawned ? "animate-tile-spawn" : ""
        } ${merged ? "animate-tile-merge" : ""}`}
        style={{ backgroundColor: color.bg, color: color.fg }}
      >
        {tile.value}
      </div>
    </div>
  );
}
