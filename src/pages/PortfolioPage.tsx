import { useState, useMemo } from 'react';
import { Wallet, TrendingUp, History, RotateCcw, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { portfolioStore } from '@/services/portfolioStore';
import { marketDataService } from '@/services/marketDataService';
import type { Market, SimPosition } from '@/types';
import { useEffect } from 'react';
import {
  formatCurrency,
  formatShares,
  formatPrice,
  formatPnl,
  formatPnlPct,
  timeAgo,
} from '@/utils/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import type { Route } from '@/hooks/useRouter';

interface PortfolioPageProps {
  onNavigate: (route: Route) => void;
}

export function PortfolioPage({ onNavigate }: PortfolioPageProps) {
  const portfolio = usePortfolio();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const ids = [...new Set(portfolio.positions.map(p => p.marketId))];
    if (ids.length === 0) {
      setMarkets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    marketDataService.getMarketByIds(ids)
      .then(ms => { if (!cancelled) setMarkets(ms); })
      .catch(() => { if (!cancelled) setMarkets([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [portfolio.positions]);

  const positionsWithCurrent = useMemo(() => {
    return portfolio.positions.map(pos => {
      const market = markets.find(m => m.id === pos.marketId);
      const outcome = market?.outcomes.find(o => o.id === pos.outcomeId);
      const currentPrice = outcome?.price ?? pos.avgPrice;
      const currentValue = pos.shares * currentPrice;
      const costBasis = pos.shares * pos.avgPrice;
      const pnl = currentValue - costBasis;
      const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
      return { position: pos, currentPrice, currentValue, costBasis, pnl, pnlPct };
    });
  }, [portfolio.positions, markets]);

  const totalValue = portfolio.cashBalance + positionsWithCurrent.reduce((sum, p) => sum + p.currentValue, 0);
  const totalPnl = positionsWithCurrent.reduce((sum, p) => sum + p.pnl, 0);
  const startingBalance = 10_000;
  const totalReturnPct = ((totalValue - startingBalance) / startingBalance) * 100;

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      {/* Balance card */}
      <div className="card p-5 bg-gradient-to-br from-ink-800 to-ink-900 border-teal-600/20">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="h-4 w-4 text-teal-400" />
          <span className="text-xs text-ink-300 font-medium">Total Portfolio Value</span>
        </div>
        <div className="text-3xl font-bold text-gray-50 tabular-nums">
          {formatCurrency(totalValue)}
        </div>
        <div className="flex items-center gap-3 sm:gap-4 mt-3 text-sm flex-wrap">
          <div className="min-w-0">
            <span className="text-ink-400 text-xs">Cash</span>
            <div className="text-gray-100 font-medium tabular-nums truncate">{formatCurrency(portfolio.cashBalance)}</div>
          </div>
          <div className="h-8 w-px bg-ink-700 shrink-0" />
          <div className="min-w-0">
            <span className="text-ink-400 text-xs">Positions</span>
            <div className="text-gray-100 font-medium tabular-nums truncate">
              {formatCurrency(positionsWithCurrent.reduce((s, p) => s + p.currentValue, 0))}
            </div>
          </div>
          <div className="h-8 w-px bg-ink-700 shrink-0" />
          <div className="min-w-0">
            <span className="text-ink-400 text-xs">Return</span>
            <div className={`font-medium tabular-nums ${totalReturnPct >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
              {formatPnl(totalValue - startingBalance)} ({formatPnlPct(totalReturnPct)})
            </div>
          </div>
        </div>
      </div>

      {/* Open positions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal-400" />
            Open Positions ({portfolio.positions.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : portfolio.positions.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="h-6 w-6 text-ink-400" />}
            title="No open positions"
            message="Start simulating trades from any market detail page."
            action={
              <button onClick={() => onNavigate({ name: 'discover' })} className="btn-primary text-sm">
                Browse markets
              </button>
            }
          />
        ) : positionsWithCurrent.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="h-6 w-6 text-ink-400" />}
            title="Positions unavailable"
            message="Market data for your saved positions could not be loaded. They are still held — try refreshing."
          />
        ) : (
          <div className="space-y-2">
            {positionsWithCurrent.map(({ position, currentPrice, currentValue, costBasis, pnl, pnlPct }) => (
              <PositionRow
                key={position.id}
                position={position}
                currentPrice={currentPrice}
                currentValue={currentValue}
                costBasis={costBasis}
                pnl={pnl}
                pnlPct={pnlPct}
                onClick={() => onNavigate({ name: 'market-detail', id: position.marketId })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trade history */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <History className="h-4 w-4 text-teal-400" />
          Trade History ({portfolio.tradeHistory.length})
        </h2>

        {portfolio.tradeHistory.length === 0 ? (
          <EmptyState
            icon={<History className="h-6 w-6 text-ink-400" />}
            title="No trades yet"
            message="Your simulated trades will appear here."
          />
        ) : (
          <div className="card divide-y divide-ink-700/40">
            {portfolio.tradeHistory.slice(0, 20).map(trade => (
              <div key={trade.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    trade.side === 'buy' ? 'bg-success-500/10' : 'bg-danger-500/10'
                  }`}>
                    {trade.side === 'buy'
                      ? <ArrowUpRight className="h-4 w-4 text-success-400" />
                      : <ArrowDownRight className="h-4 w-4 text-danger-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-gray-100 truncate">
                      {trade.side === 'buy' ? 'Bought' : 'Sold'} {formatShares(trade.shares)} {trade.outcomeLabel}
                    </div>
                    <div className="text-xs text-ink-400 truncate">
                      {trade.marketQuestion}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-sm font-medium text-gray-100 tabular-nums">
                    {formatPrice(trade.price)} × {formatShares(trade.shares)}
                  </div>
                  <div className="text-xs text-ink-400 tabular-nums">{formatCurrency(trade.cost)} · {timeAgo(trade.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset */}
      {showResetConfirm ? (
        <div className="card p-4 space-y-3 border-danger-500/20">
          <p className="text-sm text-gray-100">Reset your portfolio? This clears all positions and history, and restores your balance to $10,000.</p>
          <div className="flex gap-2">
            <button
              onClick={() => { portfolioStore.reset(); setShowResetConfirm(false); }}
              className="btn-danger flex-1 text-sm"
            >
              Yes, reset
            </button>
            <button onClick={() => setShowResetConfirm(false)} className="btn-secondary flex-1 text-sm">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-ink-700/60 text-ink-400 hover:text-danger-400 hover:border-danger-500/20 transition-colors text-sm"
        >
          <RotateCcw className="h-4 w-4" />
          Reset portfolio
        </button>
      )}
    </div>
  );
}

interface PositionRowProps {
  position: SimPosition;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  pnl: number;
  pnlPct: number;
  onClick: () => void;
}

function PositionRow({ position, currentPrice, currentValue, costBasis, pnl, pnlPct, onClick }: PositionRowProps) {
  const isProfit = pnl >= 0;
  return (
    <button onClick={onClick} className="card-hover p-4 w-full text-left">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="badge bg-teal-600/10 text-teal-400">{position.outcomeLabel}</span>
            <span className="text-xs text-ink-400">{formatShares(position.shares)} shares</span>
          </div>
          <p className="text-sm text-gray-100 mt-1 break-words line-clamp-2">{position.marketQuestion}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-ink-400 shrink-0 mt-1" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 mt-3 gap-y-3 text-xs">
        <div className="min-w-0">
          <span className="text-ink-400">Avg cost</span>
          <div className="text-gray-200 font-mono truncate">{formatPrice(position.avgPrice)}</div>
        </div>
        <div className="min-w-0">
          <span className="text-ink-400">Current</span>
          <div className="text-gray-200 font-mono truncate">{formatPrice(currentPrice)}</div>
        </div>
        <div className="min-w-0">
          <span className="text-ink-400">Value</span>
          <div className="text-gray-200 font-mono truncate">{formatCurrency(currentValue)}</div>
        </div>
        <div className="text-right sm:ml-auto">
          <span className="text-ink-400">P&L</span>
          <div className={`font-mono font-medium ${isProfit ? 'text-success-400' : 'text-danger-400'}`}>
            {formatPnl(pnl)} ({formatPnlPct(pnlPct)})
          </div>
        </div>
      </div>
    </button>
  );
}
