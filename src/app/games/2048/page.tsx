import type { Metadata } from "next";
import { meta } from "@/games/2048/meta";
import { GameClient } from "./game-client";

export const metadata: Metadata = {
  title: `${meta.name} — Game Heaven`,
  description: meta.description,
};

export default function Page() {
  return <GameClient />;
}
