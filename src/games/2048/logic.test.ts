import { describe, expect, it } from "vitest";
import {
  createInitialState,
  hasWon,
  isGameOver,
  move,
  spawnTile,
  type GameState,
  type Tile,
} from "./logic";

/** 값 그리드로부터 테스트용 상태를 만든다. 0은 빈 칸. */
function makeState(grid: number[][]): GameState {
  const tiles: Tile[] = [];
  let id = 1;
  grid.forEach((rowVals, row) =>
    rowVals.forEach((value, col) => {
      if (value !== 0) tiles.push({ id: id++, value, row, col });
    }),
  );
  return { size: 4, score: 0, nextId: id, tiles };
}

/** 상태를 값 그리드로 되돌린다. */
function toGrid(state: GameState): number[][] {
  const grid = Array.from({ length: state.size }, () =>
    Array<number>(state.size).fill(0),
  );
  for (const tile of state.tiles) grid[tile.row][tile.col] = tile.value;
  return grid;
}

describe("move", () => {
  it("왼쪽 이동 시 타일이 왼쪽 끝까지 미끄러진다", () => {
    const state = makeState([
      [0, 0, 2, 0],
      [0, 0, 0, 0],
      [0, 4, 0, 2],
      [0, 0, 0, 0],
    ]);
    const result = move(state, "left");
    expect(toGrid(result.state)).toEqual([
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [4, 2, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(result.moved).toBe(true);
    expect(result.gained).toBe(0);
  });

  it("같은 값 타일이 병합되고 결과값만큼 점수를 얻는다", () => {
    const state = makeState([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [4, 0, 4, 0],
      [0, 0, 0, 0],
    ]);
    const result = move(state, "left");
    expect(toGrid(result.state)).toEqual([
      [4, 0, 0, 0],
      [0, 0, 0, 0],
      [8, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(result.gained).toBe(12);
    expect(result.state.score).toBe(12);
  });

  it("병합 타일은 새 id를 받고 원본 두 타일의 id를 mergedFrom에 기록한다", () => {
    const state = makeState([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const result = move(state, "left");
    expect(result.state.tiles).toHaveLength(1);
    const merged = result.state.tiles[0];
    expect(merged.value).toBe(4);
    expect(merged.id).toBe(state.nextId);
    expect(merged.mergedFrom).toEqual([1, 2]);
  });

  it("한 수에 병합 결과가 다시 병합되지 않는다 ([4,2,2] → [4,4])", () => {
    const state = makeState([
      [4, 2, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const result = move(state, "left");
    expect(toGrid(result.state)[0]).toEqual([4, 4, 0, 0]);
    expect(result.gained).toBe(4);
  });

  it("[2,2,2,2]는 앞에서부터 짝지어 [4,4]가 된다", () => {
    const state = makeState([
      [2, 2, 2, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const result = move(state, "left");
    expect(toGrid(result.state)[0]).toEqual([4, 4, 0, 0]);
    expect(result.gained).toBe(8);
  });

  it("아무 타일도 움직이지 않으면 moved=false", () => {
    const state = makeState([
      [2, 4, 8, 16],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const result = move(state, "left");
    expect(result.moved).toBe(false);
    expect(result.gained).toBe(0);
    expect(toGrid(result.state)).toEqual(toGrid(state));
  });

  it("오른쪽 이동은 오른쪽 변부터 채운다", () => {
    const state = makeState([
      [2, 2, 0, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const result = move(state, "right");
    expect(toGrid(result.state)[0]).toEqual([0, 0, 4, 4]);
  });

  it("위/아래 이동은 열 단위로 동작한다", () => {
    const state = makeState([
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [4, 0, 0, 8],
      [0, 0, 0, 8],
    ]);
    const up = move(state, "up");
    expect(toGrid(up.state)).toEqual([
      [4, 0, 0, 16],
      [4, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const down = move(state, "down");
    expect(toGrid(down.state)).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [4, 0, 0, 0],
      [4, 0, 0, 16],
    ]);
  });
});

describe("spawnTile", () => {
  it("빈 칸에 새 타일을 만든다 (rng<0.9 → 값 2)", () => {
    const state = makeState([
      [2, 4, 8, 16],
      [16, 8, 4, 2],
      [2, 4, 8, 16],
      [16, 8, 4, 0],
    ]);
    const next = spawnTile(state, () => 0);
    expect(next.tiles).toHaveLength(16);
    const spawned = next.tiles.find((t) => t.row === 3 && t.col === 3);
    expect(spawned?.value).toBe(2);
    expect(spawned?.id).toBe(state.nextId);
  });

  it("rng≥0.9면 값 4를 만든다", () => {
    const state = makeState([
      [2, 4, 8, 16],
      [16, 8, 4, 2],
      [2, 4, 8, 16],
      [16, 8, 4, 0],
    ]);
    const next = spawnTile(state, () => 0.95);
    const spawned = next.tiles.find((t) => t.row === 3 && t.col === 3);
    expect(spawned?.value).toBe(4);
  });
});

describe("createInitialState", () => {
  it("타일 2개, 점수 0으로 시작한다", () => {
    const state = createInitialState(() => 0);
    expect(state.size).toBe(4);
    expect(state.score).toBe(0);
    expect(state.tiles).toHaveLength(2);
  });
});

describe("isGameOver", () => {
  it("빈 칸이 있으면 게임오버가 아니다", () => {
    const state = makeState([
      [2, 4, 8, 16],
      [16, 8, 4, 2],
      [2, 4, 8, 16],
      [16, 8, 4, 0],
    ]);
    expect(isGameOver(state)).toBe(false);
  });

  it("가득 찼어도 인접한 같은 값이 있으면 게임오버가 아니다", () => {
    const state = makeState([
      [2, 4, 8, 16],
      [16, 8, 4, 2],
      [2, 4, 4, 16],
      [16, 8, 2, 4],
    ]);
    expect(isGameOver(state)).toBe(false);
  });

  it("가득 차고 병합할 수 없으면 게임오버다", () => {
    const state = makeState([
      [2, 4, 8, 16],
      [16, 8, 4, 2],
      [2, 4, 8, 16],
      [16, 8, 4, 2],
    ]);
    expect(isGameOver(state)).toBe(true);
  });
});

describe("hasWon", () => {
  it("2048 타일이 있으면 승리", () => {
    const state = makeState([
      [2048, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(hasWon(state)).toBe(true);
  });

  it("2048 미만이면 승리가 아니다", () => {
    const state = makeState([
      [1024, 1024, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(hasWon(state)).toBe(false);
  });
});
