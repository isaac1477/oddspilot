import type { Market, MarketCategory } from '@/types';

const now = Date.now();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function genOddsHistory(currentProb: number, points: number, volatility: number): { t: number; prob: number }[] {
  const history: { t: number; prob: number }[] = [];
  let prob = currentProb + (Math.random() - 0.5) * volatility * 0.3;
  for (let i = points; i >= 0; i--) {
    const t = now - i * HOUR * 3;
    prob += (Math.random() - 0.5) * volatility * 0.08;
    prob += (currentProb - prob) * 0.05; // mean-revert
    prob = Math.max(0.02, Math.min(0.98, prob));
    history.push({ t, prob: Math.round(prob * 1000) / 1000 });
  }
  // Force last point to current probability
  history[history.length - 1].prob = currentProb;
  return history;
}

function genActivity(outcomeLabels: string[], count: number) {
  const actions: ('buy' | 'sell')[] = ['buy', 'sell'];
  const users = ['solanawhale', 'degendan', 'arbitrage_anna', 'oracle_ox', 'faded_fox', 'limit_lucy', 'gamma_gus', 'theta_tia'];
  const activity = [];
  for (let i = 0; i < count; i++) {
    const outcome = outcomeLabels[Math.floor(Math.random() * outcomeLabels.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const shares = Math.floor(Math.random() * 500) + 10;
    const price = Math.round((Math.random() * 0.9 + 0.05) * 100) / 100;
    activity.push({
      id: `act-${Math.random().toString(36).slice(2, 9)}`,
      time: now - Math.floor(Math.random() * 6 * HOUR),
      action,
      outcome,
      shares,
      price,
      user: users[Math.floor(Math.random() * users.length)],
    });
  }
  return activity.sort((a, b) => b.time - a.time);
}

function mkMarket(
  id: string,
  slug: string,
  question: string,
  category: MarketCategory,
  description: string,
  endsAt: number,
  outcomes: { label: string; probability: number; volume24h: number }[],
  liquidity: number,
  totalVolume: number,
  vol = 0.15,
): Market {
  const outcomeData = outcomes.map((o, i) => ({
    id: `${id}-o${i}`,
    label: o.label,
    probability: o.probability,
    price: o.probability,
    volume24h: o.volume24h,
  }));
  return {
    id,
    slug,
    question,
    category,
    status: endsAt - now < 2 * DAY ? 'closing-soon' : 'active',
    endsAt,
    liquidity,
    totalVolume,
    outcomes: outcomeData,
    oddsHistory: genOddsHistory(outcomes[0].probability, 40, vol),
    recentActivity: genActivity(outcomes.map(o => o.label), 12),
    description,
    resolutionSource: 'Resolves via UMA optimistic oracle on Solana. Resolution criteria published on-chain.',
  };
}

export const sampleMarkets: Market[] = [
  mkMarket(
    'mkt-sol-200',
    'sol-above-200',
    'Will SOL close above $200 on November 30?',
    'Crypto',
    'This market resolves YES if the closing price of Solana (SOL) on November 30, 2026 exceeds $200 USD on at least 2 major exchanges (Binance, Coinbase, Kraken). Resolution will use the 24h close price reported by CoinGecko.',
    now + 17 * DAY,
    [
      { label: 'Yes', probability: 0.64, volume24h: 184_000 },
      { label: 'No', probability: 0.36, volume24h: 102_000 },
    ],
    1_240_000,
    8_900_000,
  ),
  mkMarket(
    'mkt-fed-dec',
    'fed-rate-cut-december',
    'Will the Fed cut rates at the December FOMC meeting?',
    'Economics',
    'Resolves YES if the Federal Reserve announces a federal funds rate cut at the December 2026 FOMC meeting. A 25bp or larger cut qualifies. Source: Official FOMC statement.',
    now + 22 * DAY,
    [
      { label: 'Cut', probability: 0.71, volume24h: 256_000 },
      { label: 'Hold', probability: 0.29, volume24h: 98_000 },
    ],
    2_100_000,
    12_400_000,
  ),
  mkMarket(
    'mkt-us-elec',
    'us-senate-control-2026',
    'Which party will control the US Senate after the 2026 midterms?',
    'Politics',
    'Resolves based on the party with 51 or more seats in the US Senate following the 2026 midterm elections and any runoff results. Independents who caucus with a party count toward that party.',
    now + 365 * DAY,
    [
      { label: 'Democrats', probability: 0.48, volume24h: 142_000 },
      { label: 'Republicans', probability: 0.52, volume24h: 155_000 },
    ],
    3_200_000,
    18_700_000,
    0.2,
  ),
  mkMarket(
    'mkt-btc-100k',
    'btc-above-100k',
    'Will Bitcoin close above $100,000 by end of 2026?',
    'Crypto',
    'Resolves YES if Bitcoin (BTC) closes at or above $100,000 USD on any day before January 1, 2027 on Binance. The closing price is the 24h candle close.',
    now + 48 * DAY,
    [
      { label: 'Yes', probability: 0.78, volume24h: 320_000 },
      { label: 'No', probability: 0.22, volume24h: 88_000 },
    ],
    4_500_000,
    22_100_000,
  ),
  mkMarket(
    'mkt-super-bowl',
    'super-bowl-winner-2027',
    'Which team will win Super Bowl LXI?',
    'Sports',
    'Resolves to the team that wins Super Bowl LXI scheduled for February 2027. If the game is cancelled or postponed beyond March 2027, market resolves N/A.',
    now + 80 * DAY,
    [
      { label: 'Chiefs', probability: 0.18, volume24h: 67_000 },
      { label: '49ers', probability: 0.15, volume24h: 55_000 },
      { label: 'Ravens', probability: 0.12, volume24h: 44_000 },
      { label: 'Lions', probability: 0.11, volume24h: 40_000 },
      { label: 'Field', probability: 0.44, volume24h: 120_000 },
    ],
    1_800_000,
    6_300_000,
    0.25,
  ),
  mkMarket(
    'mkt-gpt6',
    'gpt6-release-2026',
    'Will OpenAI release GPT-6 before December 31, 2026?',
    'Tech',
    'Resolves YES if OpenAI publicly releases a model branded "GPT-6" (or equivalent successor to GPT-5) with general availability before December 31, 2026. A limited preview or research paper does not qualify—must be publicly accessible.',
    now + 48 * DAY,
    [
      { label: 'Yes', probability: 0.38, volume24h: 89_000 },
      { label: 'No', probability: 0.62, volume24h: 145_000 },
    ],
    980_000,
    3_400_000,
  ),
  mkMarket(
    'mkt-inflation',
    'us-cpi-below-3',
    'Will US CPI YoY come in below 3% for November 2026?',
    'Economics',
    'Resolves based on the US Bureau of Labor Statistics CPI report for November 2026. Resolves YES if the year-over-year headline CPI is below 3.0%.',
    now + 15 * DAY,
    [
      { label: 'Yes', probability: 0.55, volume24h: 112_000 },
      { label: 'No', probability: 0.45, volume24h: 90_000 },
    ],
    760_000,
    4_100_000,
  ),
  mkMarket(
    'mkt-etf-sol',
    'sol-etf-approved-2026',
    'Will a Solana spot ETF be approved by the SEC in 2026?',
    'Crypto',
    'Resolves YES if the SEC approves at least one Solana spot ETF application by December 31, 2026. Approval must be the final effective order, not just filing acceptance.',
    now + 50 * DAY,
    [
      { label: 'Yes', probability: 0.42, volume24h: 78_000 },
      { label: 'No', probability: 0.58, volume24h: 104_000 },
    ],
    650_000,
    2_800_000,
  ),
  mkMarket(
    'mkt-ai-conviction',
    'ai-conviction-rate-2026',
    'Will Anthropic reach $10B annualized revenue by Q4 2026?',
    'Tech',
    'Resolves YES if Anthropic publicly reports or credible sources confirm annualized revenue run-rate of $10B or more by end of Q4 2026.',
    now + 30 * DAY,
    [
      { label: 'Yes', probability: 0.31, volume24h: 54_000 },
      { label: 'No', probability: 0.69, volume24h: 120_000 },
    ],
    420_000,
    1_900_000,
  ),
  mkMarket(
    'mkt-eu-election',
    'eu-ai-act-enforced',
    'Will the EU AI Act be fully enforced by March 2027?',
    'Geopolitics',
    'Resolves YES if the European Commission confirms full enforcement of the AI Act, including all provisions for high-risk systems, by March 1, 2027.',
    now + 110 * DAY,
    [
      { label: 'Yes', probability: 0.67, volume24h: 41_000 },
      { label: 'No', probability: 0.33, volume24h: 22_000 },
    ],
    320_000,
    1_100_000,
  ),
  mkMarket(
    'mkt-oscar',
    'oscar-best-picture-2027',
    'Which film will win Best Picture at the 2027 Oscars?',
    'Culture',
    'Resolves to the film that wins the Academy Award for Best Picture at the 99th Academy Awards ceremony in March 2027.',
    now + 100 * DAY,
    [
      { label: 'Dune: Part Three', probability: 0.28, volume24h: 33_000 },
      { label: 'Avatar 3', probability: 0.22, volume24h: 28_000 },
      { label: 'Field', probability: 0.50, volume24h: 56_000 },
    ],
    280_000,
    870_000,
    0.3,
  ),
  mkMarket(
    'mkt-sol-mcap',
    'sol-mcap-top3',
    'Will Solana become a top-3 crypto by market cap in 2026?',
    'Crypto',
    'Resolves YES if Solana (SOL) ranks in the top 3 cryptocurrencies by market capitalization on CoinGecko at any point before December 31, 2026, maintained for at least 24 hours.',
    now + 48 * DAY,
    [
      { label: 'Yes', probability: 0.35, volume24h: 67_000 },
      { label: 'No', probability: 0.65, volume24h: 119_000 },
    ],
    540_000,
    2_300_000,
  ),
];

export const categories: ('All' | MarketCategory)[] = [
  'All',
  'Politics',
  'Crypto',
  'Sports',
  'Economics',
  'Tech',
  'Culture',
  'Geopolitics',
];
