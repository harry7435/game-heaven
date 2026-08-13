export type Direction = "left" | "right" | "up" | "down";

export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  /** 이 타일이 병합으로 생겼다면, 원본 두 타일의 id */
  mergedFrom?: [number, number];
}

export interface GameState {
  size: number;
  score: number;
  nextId: number;
  tiles: Tile[];
}

export interface MoveResult {
  state: GameState;
  gained: number;
  moved: boolean;
}

/** 0 이상 1 미만 난수를 반환하는 함수. 테스트에서 주입 가능. */
export type Rng = () => number;

export function createEmptyState(size = 4): GameState {
  return { size, score: 0, nextId: 1, tiles: [] };
}

/** 빈 칸 하나에 2(90%) 또는 4(10%) 타일을 생성한다. */
export function spawnTile(state: GameState, rng: Rng): GameState {
  const occupied = new Set(state.tiles.map((t) => t.row * state.size + t.col));
  const empties: { row: number; col: number }[] = [];
  for (let row = 0; row < state.size; row++) {
    for (let col = 0; col < state.size; col++) {
      if (!occupied.has(row * state.size + col)) empties.push({ row, col });
    }
  }
  if (empties.length === 0) return state;

  const cell = empties[Math.floor(rng() * empties.length)];
  const value = rng() < 0.9 ? 2 : 4;
  return {
    ...state,
    nextId: state.nextId + 1,
    tiles: [...state.tiles, { id: state.nextId, value, ...cell }],
  };
}

export function createInitialState(rng: Rng, size = 4): GameState {
  return spawnTile(spawnTile(createEmptyState(size), rng), rng);
}

export function isGameOver(state: GameState): boolean {
  if (state.tiles.length < state.size * state.size) return false;
  const grid = new Map(
    state.tiles.map((t) => [t.row * state.size + t.col, t.value]),
  );
  for (const t of state.tiles) {
    const right = grid.get(t.row * state.size + t.col + 1);
    const down = grid.get((t.row + 1) * state.size + t.col);
    if (t.col + 1 < state.size && right === t.value) return false;
    if (t.row + 1 < state.size && down === t.value) return false;
  }
  return true;
}

export function hasWon(state: GameState): boolean {
  return state.tiles.some((t) => t.value >= 2048);
}

export function move(state: GameState, dir: Direction): MoveResult {
  const horizontal = dir === "left" || dir === "right";
  // forward = 인덱스 0 방향으로 이동 (left/up)
  const forward = dir === "left" || dir === "up";
  let nextId = state.nextId;
  let gained = 0;
  let moved = false;
  const newTiles: Tile[] = [];

  for (let line = 0; line < state.size; line++) {
    // 이동 축 기준으로, 목표 변에 가까운 순으로 정렬
    const lineTiles = state.tiles
      .filter((t) => (horizontal ? t.row : t.col) === line)
      .sort((a, b) => {
        const pa = horizontal ? a.col : a.row;
        const pb = horizontal ? b.col : b.row;
        return forward ? pa - pb : pb - pa;
      });

    let slot = 0; // 목표 변에서부터 채워지는 칸 순번
    let i = 0;
    while (i < lineTiles.length) {
      const target = forward ? slot : state.size - 1 - slot;
      const row = horizontal ? line : target;
      const col = horizontal ? target : line;
      const cur = lineTiles[i];
      const next = lineTiles[i + 1];

      if (next !== undefined && next.value === cur.value) {
        // 병합: 같은 값 두 타일은 이동 방향으로 한 번만 합쳐진다
        const merged: Tile = {
          id: nextId++,
          value: cur.value * 2,
          row,
          col,
          mergedFrom: [cur.id, next.id],
        };
        gained += merged.value;
        moved = true;
        newTiles.push(merged);
        i += 2;
      } else {
        if (cur.row !== row || cur.col !== col) moved = true;
        newTiles.push({ id: cur.id, value: cur.value, row, col });
        i += 1;
      }
      slot++;
    }
  }

  return {
    state: { ...state, tiles: newTiles, score: state.score + gained, nextId },
    gained,
    moved,
  };
}
