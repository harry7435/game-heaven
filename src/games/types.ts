export interface GameMeta {
  /** URL 경로에 쓰이는 게임 식별자 (예: "2048") */
  id: string;
  name: string;
  description: string;
  /** 홈 카드에 쓰이는 Tailwind 그라디언트 클래스 */
  themeClass: string;
  /** 카드에 크게 표시할 심볼 문자 */
  symbol: string;
}
