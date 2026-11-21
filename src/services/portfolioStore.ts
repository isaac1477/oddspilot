import type { Portfolio, SimTrade, SimPosition, TradeSide } from '@/types';

const STORAGE_KEY = 'oddspilot_portfolio_v1';
const DEFAULT_BALANCE = 10_000;

// Simulated fee + slippage accounting scaffold. Fees are hypothetical and do
// NOT alter execution price (we never invent a fill price — the user-supplied
// price is used as-is). These fields are prepared for future realistic
// accounting but currently kept at zero so existing trades are unaffected.
export interface TradeCosts {
  feeRate: number;      // fraction of notional, e.g. 0.001 = 0.1%
  slippageRate: number; // fraction of notional, reserved; not applied to fill price
}

const DEFAULT_TRADE_COSTS: TradeCosts = {
  feeRate: 0,
  slippageRate: 0,
};

function defaultPortfolio(): Portfolio {
  return {
    cashBalance: DEFAULT_BALANCE,
    positions: [],
    tradeHistory: [],
  };
}

function isFiniteNumber(value: number): boolean {
  return typeof value === 'number' && isFinite(value);
}

function sanitizePortfolio(parsed: Partial<Portfolio>): Portfolio {
  const cashBalance = isFiniteNumber(parsed.cashBalance as number)
    ? (parsed.cashBalance as number)
    : DEFAULT_BALANCE;

  const positions: SimPosition[] = Array.isArray(parsed.positions)
    ? parsed.positions.filter(
        (p): p is SimPosition =>
          !!p &&
          isFiniteNumber(p.shares) &&
          p.shares >= 0 &&
          isFiniteNumber(p.avgPrice) &&
          p.avgPrice >= 0,
      )
    : [];

  const tradeHistory: SimTrade[] = Array.isArray(parsed.tradeHistory)
    ? parsed.tradeHistory.filter(
        (t): t is SimTrade =>
          !!t &&
          isFiniteNumber(t.shares) &&
          isFiniteNumber(t.price) &&
          isFiniteNumber(t.cost),
      )
    : [];

  return { cashBalance, positions, tradeHistory };
}

function load(): Portfolio {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPortfolio();
    const parsed = JSON.parse(raw) as Partial<Portfolio>;
    return sanitizePortfolio(parsed);
  } catch {
    return defaultPortfolio();
  }
}

function save(portfolio: Portfolio) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  } catch {
    // Storage may be unavailable (quota / private mode); keep in-memory state.
  }
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type Listener = (portfolio: Portfolio) => void;

export interface TradeValidation {
  ok: boolean;
  error?: string;
}

function validateTradeInput(
  shares: number,
  price: number,
): TradeValidation {
  if (!isFiniteNumber(shares)) return { ok: false, error: 'Share quantity is not a valid number.' };
  if (!isFiniteNumber(price)) return { ok: false, error: 'Price is not a valid number.' };
  if (shares <= 0) return { ok: false, error: 'Shares must be greater than zero.' };
  if (price < 0 || price > 1) return { ok: false, error: 'Price must be between 0 and 1.' };
  return { ok: true };
}

class PortfolioStore {
  private portfolio: Portfolio;
  private listeners = new Set<Listener>();
  private tradeCosts: TradeCosts = { ...DEFAULT_TRADE_COSTS };

  constructor() {
    this.portfolio = load();
  }

  get(): Portfolio {
    return this.portfolio;
  }

  getTradeCosts(): TradeCosts {
    return { ...this.tradeCosts };
  }

  setTradeCosts(costs: Partial<TradeCosts>) {
    this.tradeCosts = { ...this.tradeCosts, ...costs };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    save(this.portfolio);
    this.listeners.forEach(l => l(this.portfolio));
  }

  private notional(shares: number, price: number): number {
    return shares * price;
  }

  private feeFor(notional: number): number {
    return notional * this.tradeCosts.feeRate;
  }

  buy(
    marketId: string,
    marketQuestion: string,
    outcomeId: string,
    outcomeLabel: string,
    shares: number,
    price: number,
  ): { success: boolean; error?: string; trade?: SimTrade } {
    const inputCheck = validateTradeInput(shares, price);
    if (!inputCheck.ok) return { success: false, error: inputCheck.error };

    const notional = this.notional(shares, price);
    const fee = this.feeFor(notional);
    const cost = notional + fee;

    if (cost > this.portfolio.cashBalance + 1e-9) {
      return { success: false, error: 'Insufficient virtual cash for this trade.' };
    }

    this.portfolio.cashBalance -= cost;

    const existing = this.portfolio.positions.find(
      p => p.marketId === marketId && p.outcomeId === outcomeId,
    );

    if (existing) {
      const totalCost = existing.shares * existing.avgPrice + notional;
      existing.shares += shares;
      existing.avgPrice = totalCost / existing.shares;
    } else {
      const position: SimPosition = {
        id: genId(),
        marketId,
        marketQuestion,
        outcomeId,
        outcomeLabel,
        shares,
        avgPrice: price,
        openedAt: Date.now(),
      };
      this.portfolio.positions.push(position);
    }

    const trade: SimTrade = {
      id: genId(),
      marketId,
      marketQuestion,
      outcomeId,
      outcomeLabel,
      side: 'buy' as TradeSide,
      shares,
      price,
      cost,
      timestamp: Date.now(),
    };
    this.portfolio.tradeHistory.unshift(trade);
    this.notify();
    return { success: true, trade };
  }

  sell(
    marketId: string,
    marketQuestion: string,
    outcomeId: string,
    outcomeLabel: string,
    shares: number,
    price: number,
  ): { success: boolean; error?: string; trade?: SimTrade } {
    const inputCheck = validateTradeInput(shares, price);
    if (!inputCheck.ok) return { success: false, error: inputCheck.error };

    const position = this.portfolio.positions.find(
      p => p.marketId === marketId && p.outcomeId === outcomeId,
    );
    if (!position) {
      return { success: false, error: 'No open position for this outcome.' };
    }
    if (shares > position.shares + 1e-9) {
      return { success: false, error: `You only have ${position.shares} shares to sell.` };
    }

    const notional = this.notional(shares, price);
    const fee = this.feeFor(notional);
    const proceeds = notional - fee;

    this.portfolio.cashBalance += proceeds;
    position.shares -= shares;

    if (position.shares <= 1e-9) {
      this.portfolio.positions = this.portfolio.positions.filter(p => p.id !== position.id);
    }

    const trade: SimTrade = {
      id: genId(),
      marketId,
      marketQuestion,
      outcomeId,
      outcomeLabel,
      side: 'sell' as TradeSide,
      shares,
      price,
      cost: proceeds,
      timestamp: Date.now(),
    };
    this.portfolio.tradeHistory.unshift(trade);
    this.notify();
    return { success: true, trade };
  }

  reset() {
    this.portfolio = defaultPortfolio();
    this.notify();
  }
}

export const portfolioStore = new PortfolioStore();
