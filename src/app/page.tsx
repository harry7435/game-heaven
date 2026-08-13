import Link from "next/link";
import { games } from "@/games/registry";

export default function Home() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">게임 목록</h1>
      <p className="mb-6 text-sm text-foreground/60">
        하고 싶은 게임을 골라 보세요.
      </p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <li key={game.id}>
            <Link
              href={`/games/${game.id}`}
              className="block overflow-hidden rounded-2xl border border-black/10 transition-transform hover:-translate-y-1 hover:shadow-lg dark:border-white/10"
            >
              <div
                className={`flex h-32 items-center justify-center bg-gradient-to-br ${game.themeClass}`}
              >
                <span className="text-4xl font-extrabold text-white drop-shadow">
                  {game.symbol}
                </span>
              </div>
              <div className="p-4">
                <h2 className="font-semibold">{game.name}</h2>
                <p className="mt-1 text-sm text-foreground/60">
                  {game.description}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
