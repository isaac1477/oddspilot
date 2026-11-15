export type MarketCategory =
  | 'Politics'
  | 'Crypto'
  | 'Sports'
  | 'Economics'
  | 'Tech'
  | 'Culture'
  | 'Geopolitics';

export type MarketStatus = 'active' | 'closing-soon' | 'resolved';

export interface MarketOutcome {
  id: string;
  label: string;
  probability: number;       // 0..1
  price: number;             // 0..1 in USDC terms
  volume24h: number;
}

export interface OddsPoint {
  t: number;   // timestamp (ms)
  prob: number; // 0..1
}

export interface MarketActivity {
  id: string;
  time: number;
  action: 'buy' | 'sell';
  outcome: string;
  shares: number;
  price: number;
  user: string;
}

export interface Market {
  id: string;
  slug: string;
  question: string;
  category: MarketCategory;
  status: MarketStatus;
  endsAt: number;
  liquidity: number;
  totalVolume: number;
  outcomes: MarketOutcome[];
  oddsHistory: OddsPoint[];
  recentActivity: MarketActivity[];
  description: string;
  resolutionSource: string;
}

export type TradeSide = 'buy' | 'sell';

export interface SimTrade {
  id: string;
  marketId: string;
  marketQuestion: string;
  outcomeId: string;
  outcomeLabel: string;
  side: TradeSide;
  shares: number;
  price: number;        // price per share at trade time
  cost: number;         // total cost / proceeds
  timestamp: number;
}

export interface SimPosition {
  id: string;
  marketId: string;
  marketQuestion: string;
  outcomeId: string;
  outcomeLabel: string;
  shares: number;
  avgPrice: number;
  openedAt: number;
}

export interface Portfolio {
  cashBalance: number;
  positions: SimPosition[];
  tradeHistory: SimTrade[];
}
