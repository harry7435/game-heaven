/**
 * localStorage 래퍼. 게임별 최고점수와 진행 상태를 저장한다.
 * 2단계(서버 저장) 도입 시 이 모듈이 교체 지점이 된다.
 */

const key = (gameId: string, kind: "best" | "save") => `gh:${gameId}:${kind}`;

const available = () => typeof window !== "undefined" && !!window.localStorage;

export function loadBestScore(gameId: string): number {
  if (!available()) return 0;
  const raw = window.localStorage.getItem(key(gameId, "best"));
  const parsed = raw === null ? 0 : Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function saveBestScore(gameId: string, score: number): void {
  if (!available()) return;
  window.localStorage.setItem(key(gameId, "best"), String(score));
}

export function loadSavedGame<T>(gameId: string): T | null {
  if (!available()) return null;
  const raw = window.localStorage.getItem(key(gameId, "save"));
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveGame<T>(gameId: string, data: T): void {
  if (!available()) return;
  window.localStorage.setItem(key(gameId, "save"), JSON.stringify(data));
}

export function clearSavedGame(gameId: string): void {
  if (!available()) return;
  window.localStorage.removeItem(key(gameId, "save"));
}
