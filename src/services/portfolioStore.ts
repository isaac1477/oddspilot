import type { Portfolio, SimTrade, SimPosition, TradeSide } from '@/types';

const STORAGE_KEY = 'oddspilot_portfolio_v1';
const DEFAULT_BALANCE = 10_000;

function defaultPortfolio(): Portfolio {
  return {
    cashBalance: DEFAULT_BALANCE,
    positions: [],
    tradeHistory: [],
  };
}

function load(): Portfolio {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPortfolio();
    const parsed = JSON.parse(raw) as Portfolio;
    if (typeof parsed.cashBalance !== 'number') return defaultPortfolio();
    return {
      cashBalance: parsed.cashBalance,
      positions: parsed.positions ?? [],
      tradeHistory: parsed.tradeHistory ?? [],
    };
  } catch {
    return defaultPortfolio();
  }
}

function save(portfolio: Portfolio) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type Listener = (portfolio: Portfolio) => void;

class PortfolioStore {
  private portfolio: Portfolio;
  private listeners = new Set<Listener>();

  constructor() {
    this.portfolio = load();
  }

  get(): Portfolio {
    return this.portfolio;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    save(this.portfolio);
    this.listeners.forEach(l => l(this.portfolio));
  }

  buy(
    marketId: string,
    marketQuestion: string,
    outcomeId: string,
    outcomeLabel: string,
    shares: number,
    price: number,
  ): { success: boolean; error?: string; trade?: SimTrade } {
    const cost = shares * price;
    if (cost > this.portfolio.cashBalance) {
      return { success: false, error: 'Insufficient virtual cash for this trade.' };
    }
    if (shares <= 0) {
      return { success: false, error: 'Shares must be greater than zero.' };
    }

    this.portfolio.cashBalance -= cost;

    const existing = this.portfolio.positions.find(
      p => p.marketId === marketId && p.outcomeId === outcomeId,
    );

    if (existing) {
      const totalCost = existing.shares * existing.avgPrice + cost;
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
    const position = this.portfolio.positions.find(
      p => p.marketId === marketId && p.outcomeId === outcomeId,
    );
    if (!position) {
      return { success: false, error: 'No open position for this outcome.' };
    }
    if (shares <= 0) {
      return { success: false, error: 'Shares must be greater than zero.' };
    }
    if (shares > position.shares) {
      return { success: false, error: `You only have ${position.shares} shares to sell.` };
    }

    const proceeds = shares * price;
    this.portfolio.cashBalance += proceeds;
    position.shares -= shares;

    if (position.shares <= 0) {
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
