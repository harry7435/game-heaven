import type { GameMeta } from "./types";
import { meta as game2048 } from "./2048/meta";

/** 새 게임 추가: 게임 폴더를 만들고 여기에 meta를 등록한다. */
export const games: GameMeta[] = [game2048];
