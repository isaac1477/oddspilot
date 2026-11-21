import type { Market, MarketCategory, OrderBookData, OddsPoint } from '@/types';
import { sampleMarkets, demoCategories } from '@/data/sampleMarkets';
import { polymarketAdapter } from '@/services/polymarketAdapter';

export interface MarketQuery {
  search?: string;
  category?: 'All' | MarketCategory;
  sortBy?: 'volume' | 'liquidity' | 'ending' | 'prob-change';
  offset?: number;
  limit?: number;
}

export interface MarketQueryResult {
  markets: Market[];
  total: number;
  hasMore: boolean;
  source: 'polymarket' | 'demo' | 'mixed';
  lastUpdated: number;
  error?: string;
}

function getProbChange(market: Market): number {
  const history = market.oddsHistory;
  if (history.length < 2) return 0;
  return history[history.length - 1].prob - history[0].prob;
}

function applySort(markets: Market[], sortBy: MarketQuery['sortBy']): Market[] {
  const result = [...markets];
  switch (sortBy) {
    case 'volume':
      result.sort((a, b) => b.totalVolume - a.totalVolume);
      break;
    case 'liquidity':
      result.sort((a, b) => b.liquidity - a.liquidity);
      break;
    case 'ending':
      result.sort((a, b) => a.endsAt - b.endsAt);
      break;
    case 'prob-change':
      result.sort((a, b) => Math.abs(getProbChange(b)) - Math.abs(getProbChange(a)));
      break;
  }
  return result;
}

function applyFilters(markets: Market[], query: MarketQuery): Market[] {
  let result = [...markets];

  if (query.category && query.category !== 'All') {
    result = result.filter(m => m.category === query.category);
  }

  if (query.search) {
    const q = query.search.toLowerCase();
    result = result.filter(
      m =>
        m.question.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.outcomes.some(o => o.label.toLowerCase().includes(q)),
    );
  }

  return result;
}

function applyFiltersAndSort(markets: Market[], query: MarketQuery): Market[] {
  return applySort(applyFilters(markets, query), query.sortBy);
}

function demoResult(query: MarketQuery, reason?: string): MarketQueryResult {
  const markets = applyFiltersAndSort(sampleMarkets, query);
  return {
    markets,
    total: markets.length,
    hasMore: false,
    source: 'demo',
    lastUpdated: Date.now(),
    error: reason ?? 'Live API unavailable — showing demo data',
  };
}

export const marketDataService = {
  async getMarkets(query: MarketQuery = {}): Promise<MarketQueryResult> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    try {
      const result = await polymarketAdapter.getMarkets(offset, limit);
      // Live API returned nothing on the first page — only then fall back to demo.
      if (result.markets.length === 0 && offset === 0) {
        return demoResult(query, 'No live markets returned — showing demo data');
      }

      const filtered = applyFiltersAndSort(result.markets, query);

      return {
        markets: filtered,
        // `total` reflects the count returned for this page after filtering.
        // The Gamma /markets endpoint does not expose a global count, so we
        // do not pretend to know the full universe size.
        total: filtered.length,
        // hasMore is driven by the raw page size, NOT the filtered count,
        // so users can keep paging to find matches that filter may hide.
        hasMore: result.hasMore,
        source: 'polymarket',
        lastUpdated: Date.now(),
      };
    } catch {
      return demoResult(query);
    }
  },

  async getMarketById(id: string): Promise<Market | null> {
    const demoMarket = sampleMarkets.find(m => m.id === id || m.slug === id);
    try {
      const market = await polymarketAdapter.getMarketById(id);
      if (market) {
        if (market.oddsHistory.length === 0 && market.outcomes[0]?.clobTokenId) {
          try {
            const history = await polymarketAdapter.getPricesHistory(market.outcomes[0].clobTokenId);
            if (history.length >= 2) {
              market.oddsHistory = history;
              market.oddsHistoryEstimated = false;
            }
          } catch {
            // Price history is optional
          }
        }
        return market;
      }
      return demoMarket ?? null;
    } catch {
      return demoMarket ?? null;
    }
  },

  async getMarketByIds(ids: string[]): Promise<Market[]> {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) return [];

    // Try live first for each id.
    let liveMarkets: Market[] = [];
    try {
      liveMarkets = await polymarketAdapter.getMarketByIds(unique);
    } catch {
      // fall through to demo
    }

    // For any ids not resolved live, fill from demo data so compare/portfolio
    // still works for older saved references. Mark the result as mixed when
    // both sources contribute.
    const resolvedIds = new Set(liveMarkets.map(m => m.id));
    const missing = unique.filter(id => !resolvedIds.has(id));
    const demoMatches = sampleMarkets.filter(
      m => missing.includes(m.id) || missing.includes(m.slug),
    );

    return [...liveMarkets, ...demoMatches];
  },

  async getOrderBook(tokenId: string): Promise<OrderBookData | null> {
    try {
      return await polymarketAdapter.getOrderBook(tokenId);
    } catch {
      return null;
    }
  },

  async getPricesHistory(tokenId: string): Promise<OddsPoint[]> {
    try {
      return await polymarketAdapter.getPricesHistory(tokenId);
    } catch {
      return [];
    }
  },

  async getTrendingMarkets(limit = 5): Promise<Market[]> {
    try {
      const result = await polymarketAdapter.getMarkets(0, limit);
      return result.markets.slice(0, limit);
    } catch {
      const sorted = [...sampleMarkets].sort((a, b) => b.totalVolume - a.totalVolume);
      return sorted.slice(0, limit);
    }
  },

  getCategories(): string[] {
    return ['All', ...demoCategories];
  },
};
