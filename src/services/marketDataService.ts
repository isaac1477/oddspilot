import type { Market, MarketCategory } from '@/types';
import { sampleMarkets } from '@/data/sampleMarkets';

export interface MarketQuery {
  search?: string;
  category?: 'All' | MarketCategory;
  sortBy?: 'volume' | 'liquidity' | 'ending' | 'prob-change';
}

export interface MarketQueryResult {
  markets: Market[];
  total: number;
}

const LATENCY = 350;

function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

function getProbChange(market: Market): number {
  const history = market.oddsHistory;
  if (history.length < 2) return 0;
  const latest = history[history.length - 1].prob;
  const earliest = history[0].prob;
  return latest - earliest;
}

export const marketDataService = {
  async getMarkets(query: MarketQuery = {}): Promise<MarketQueryResult> {
    let markets = [...sampleMarkets];

    if (query.category && query.category !== 'All') {
      markets = markets.filter(m => m.category === query.category);
    }

    if (query.search) {
      const q = query.search.toLowerCase();
      markets = markets.filter(
        m =>
          m.question.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.outcomes.some(o => o.label.toLowerCase().includes(q)),
      );
    }

    switch (query.sortBy) {
      case 'volume':
        markets.sort((a, b) => b.totalVolume - a.totalVolume);
        break;
      case 'liquidity':
        markets.sort((a, b) => b.liquidity - a.liquidity);
        break;
      case 'ending':
        markets.sort((a, b) => a.endsAt - b.endsAt);
        break;
      case 'prob-change':
        markets.sort((a, b) => Math.abs(getProbChange(b)) - Math.abs(getProbChange(a)));
        break;
    }

    return delay({ markets, total: markets.length });
  },

  async getMarketById(id: string): Promise<Market | null> {
    const market = sampleMarkets.find(m => m.id === id || m.slug === id);
    return delay(market ?? null);
  },

  async getMarketByIds(ids: string[]): Promise<Market[]> {
    const markets = sampleMarkets.filter(m => ids.includes(m.id));
    return delay(markets, 200);
  },

  async getTrendingMarkets(limit = 5): Promise<Market[]> {
    const sorted = [...sampleMarkets].sort((a, b) => b.totalVolume - a.totalVolume);
    return delay(sorted.slice(0, limit), 200);
  },
};
