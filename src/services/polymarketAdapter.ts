import type { Market, MarketOutcome, OddsPoint, OrderBookData, OrderBookLevel } from '@/types';

const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';
const TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;

async function fetchWithTimeout(url: string, retries = MAX_RETRIES): Promise<Response> {
  let lastError: Error = new Error('Request failed');
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

function safeParseJSON<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return isFinite(n) ? n : fallback;
  }
  return fallback;
}

function parseDate(value: unknown): number {
  if (typeof value !== 'string') return 0;
  const ms = Date.parse(value);
  return isFinite(ms) ? ms : 0;
}

interface GammaMarket {
  id: string;
  question?: string;
  slug?: string;
  description?: string;
  outcomes?: string;
  outcomePrices?: string;
  clobTokenIds?: string;
  volumeNum?: number;
  liquidityNum?: number;
  volume24hr?: number;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  lastTradePrice?: number;
  oneDayPriceChange?: number;
  events?: Array<{ title?: string; slug?: string }>;
}

function deriveCategory(gm: GammaMarket): string {
  const events = gm.events;
  if (events && events.length > 0 && events[0].slug) {
    const slug = events[0].slug;
    if (slug.includes('politic') || slug.includes('election') || slug.includes('senate') ||
        slug.includes('president') || slug.includes('congress') || slug.includes('governor')) {
      return 'Politics';
    }
    if (slug.includes('crypto') || slug.includes('bitcoin') || slug.includes('btc') ||
        slug.includes('solana') || slug.includes('sol') || slug.includes('eth') || slug.includes('token')) {
      return 'Crypto';
    }
    if (slug.includes('sport') || slug.includes('nba') || slug.includes('nfl') || slug.includes('mlb') ||
        slug.includes('nhl') || slug.includes('super-bowl') || slug.includes('champion') || slug.includes('ufc')) {
      return 'Sports';
    }
    if (slug.includes('fed') || slug.includes('rate') || slug.includes('cpi') || slug.includes('inflation') ||
        slug.includes('economic') || slug.includes('gdp') || slug.includes('recession')) {
      return 'Economics';
    }
    if (slug.includes('ai') || slug.includes('gpt') || slug.includes('tech') || slug.includes('openai') ||
        slug.includes('google') || slug.includes('apple') || slug.includes('release')) {
      return 'Tech';
    }
    if (slug.includes('oscar') || slug.includes('movie') || slug.includes('music') || slug.includes('award') ||
        slug.includes('culture') || slug.includes('celebrity')) {
      return 'Culture';
    }
    if (slug.includes('geopolit') || slug.includes('war') || slug.includes('treaty') || slug.includes('eu-')) {
      return 'Geopolitics';
    }
  }
  const q = (gm.question || '').toLowerCase();
  if (q.match(/elect|senate|president|congress|governor|politic|party|vote/)) return 'Politics';
  if (q.match(/bitcoin|crypto|solana|btc|eth|token|blockchain/)) return 'Crypto';
  if (q.match(/nba|nfl|mlb|nhl|sport|championship|game|match|tournament/)) return 'Sports';
  if (q.match(/fed|rate|cpi|inflation|economic|gdp|recession|interest/)) return 'Economics';
  if (q.match(/ai|gpt|tech|openai|google|apple|software|model|release/)) return 'Tech';
  if (q.match(/oscar|movie|music|award|celebrity|film|culture/)) return 'Culture';
  if (q.match(/war|treaty|geopolit|country|nation|foreign|eu /)) return 'Geopolitics';
  return 'Other';
}

function mapStatus(gm: GammaMarket): Market['status'] {
  if (gm.closed) return 'resolved';
  const endsAt = parseDate(gm.endDate);
  const twoDays = 2 * 24 * 60 * 60 * 1000;
  if (endsAt && endsAt - Date.now() < twoDays && endsAt > Date.now()) return 'closing-soon';
  return 'active';
}

function normalizeGammaMarket(gm: GammaMarket): Market | null {
  const id = String(gm.id || '');
  const question = gm.question || '';
  if (!id || !question) return null;

  const outcomeLabels = safeParseJSON<string[]>(gm.outcomes, []);
  const outcomePrices = safeParseJSON<string[]>(gm.outcomePrices, []);
  const clobTokenIds = safeParseJSON<string[]>(gm.clobTokenIds, []);

  if (outcomeLabels.length === 0) return null;

  const outcomes: MarketOutcome[] = outcomeLabels.map((label, i) => {
    const priceStr = outcomePrices[i] ?? '0';
    const price = Math.max(0, Math.min(1, toNumber(priceStr, 0)));
    return {
      id: `${id}-o${i}`,
      label,
      probability: price,
      price,
      volume24h: toNumber(gm.volume24hr, 0) / Math.max(outcomeLabels.length, 1),
      clobTokenId: clobTokenIds[i] || undefined,
    };
  });

  const endsAt = parseDate(gm.endDate);
  const oddsHistory: OddsPoint[] = [];

  if (gm.lastTradePrice !== undefined && outcomes.length > 0) {
    oddsHistory.push({
      t: Date.now() - 24 * 60 * 60 * 1000,
      prob: Math.max(0, Math.min(1, gm.lastTradePrice - toNumber(gm.oneDayPriceChange, 0))),
    });
    oddsHistory.push({
      t: Date.now(),
      prob: Math.max(0, Math.min(1, gm.lastTradePrice)),
    });
  }

  const category = deriveCategory(gm);

  return {
    id,
    slug: gm.slug || id,
    question,
    category,
    status: mapStatus(gm),
    endsAt,
    liquidity: toNumber(gm.liquidityNum ?? gm.liquidityNum, 0),
    totalVolume: toNumber(gm.volumeNum ?? gm.volumeNum, 0),
    volume24h: toNumber(gm.volume24hr, 0),
    outcomes,
    oddsHistory,
    recentActivity: [],
    description: gm.description || '',
    resolutionSource: gm.events?.[0]?.title || 'Polymarket — UMA oracle resolution',
    source: 'polymarket' as const,
    lastUpdated: Date.now(),
  };
}

export interface PolymarketMarketsResult {
  markets: Market[];
  total: number;
  hasMore: boolean;
}

export const polymarketAdapter = {
  async getMarkets(offset = 0, limit = 50): Promise<PolymarketMarketsResult> {
    const url = `${GAMMA_API}/markets?active=true&closed=false&limit=${limit}&offset=${offset}&order=volumeNum&ascending=false`;
    const res = await fetchWithTimeout(url);
    const data = await res.json() as GammaMarket[];
    const markets: Market[] = [];
    for (const gm of data) {
      const market = normalizeGammaMarket(gm);
      if (market) markets.push(market);
    }
    return {
      markets,
      total: markets.length,
      hasMore: data.length === limit,
    };
  },

  async getMarketById(id: string): Promise<Market | null> {
    const url = `${GAMMA_API}/markets?slug=${encodeURIComponent(id)}`;
    const res = await fetchWithTimeout(url);
    const data = await res.json() as GammaMarket[];
    if (data.length === 0) {
      const urlById = `${GAMMA_API}/markets/${encodeURIComponent(id)}`;
      const resById = await fetchWithTimeout(urlById);
      const gm = await resById.json() as GammaMarket;
      return normalizeGammaMarket(gm);
    }
    return normalizeGammaMarket(data[0]);
  },

  async getMarketByIds(ids: string[]): Promise<Market[]> {
    const results = await Promise.allSettled(
      ids.map(id => this.getMarketById(id)),
    );
    const markets: Market[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        markets.push(result.value);
      }
    }
    return markets;
  },

  async getOrderBook(tokenId: string): Promise<OrderBookData | null> {
    const url = `${CLOB_API}/book?token_id=${tokenId}`;
    const res = await fetchWithTimeout(url);
    const data = await res.json() as {
      bids?: Array<{ price: string; size: string }>;
      asks?: Array<{ price: string; size: string }>;
      timestamp?: string;
    };

    const bids: OrderBookLevel[] = (data.bids || [])
      .map(b => ({ price: toNumber(b.price, 0), size: toNumber(b.size, 0) }))
      .sort((a, b) => b.price - a.price);

    const asks: OrderBookLevel[] = (data.asks || [])
      .map(a => ({ price: toNumber(a.price, 0), size: toNumber(a.size, 0) }))
      .sort((a, b) => a.price - b.price);

    const bestBid = bids.length > 0 ? bids[0].price : null;
    const bestAsk = asks.length > 0 ? asks[0].price : null;
    const spread = bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null;

    return {
      bids,
      asks,
      bestBid,
      bestAsk,
      spread,
      timestamp: toNumber(data.timestamp, Date.now()),
    };
  },

  async getPricesHistory(tokenId: string, interval = '1d'): Promise<OddsPoint[]> {
    const url = `${CLOB_API}/prices-history?market=${tokenId}&interval=${interval}`;
    const res = await fetchWithTimeout(url);
    const data = await res.json() as { history?: Array<{ t: number; p: number }> };
    if (!data.history || !Array.isArray(data.history)) return [];
    const points: OddsPoint[] = data.history.map(h => ({
      t: h.t * 1000,
      prob: Math.max(0, Math.min(1, toNumber(h.p, 0))),
    }));
    if (points.length > 200) {
      const step = Math.ceil(points.length / 200);
      return points.filter((_, i) => i % step === 0);
    }
    return points;
  },
};
