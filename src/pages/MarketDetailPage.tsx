import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Clock, Droplets, BarChart3, Info, GitCompare, Activity } from 'lucide-react';
import type { Market, MarketOutcome } from '@/types';
import { portfolioStore } from '@/services/portfolioStore';
import { usePortfolio } from '@/hooks/usePortfolio';
import { OddsChart } from '@/components/ui/OddsChart';
import { ErrorState } from '@/components/ui/ErrorState';
import { marketDataService } from '@/services/marketDataService';
import {
  formatCurrency,
  formatProb,
  formatPrice,
  formatShares,
  timeUntil,
  timeAgo,
  probChangeColor,
  probChangeArrow,
} from '@/utils/format';

interface TradePanelProps {
  market: Market;
  onNavigateCompare: () => void;
}

export function TradePanel({ market, onNavigateCompare }: TradePanelProps) {
  const portfolio = usePortfolio();
  const [selectedOutcome, setSelectedOutcome] = useState<MarketOutcome>(
    market.outcomes[0],
  );
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [shareInput, setShareInput] = useState('100');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const shares = parseFloat(shareInput) || 0;
  const price = selectedOutcome.price;
  const total = shares * price;

  const existingPosition = portfolio.positions.find(
    p => p.marketId === market.id && p.outcomeId === selectedOutcome.id,
  );

  const maxAffordable = Math.floor(portfolio.cashBalance / price);
  const maxSellable = existingPosition?.shares ?? 0;

  const handleTrade = () => {
    setFeedback(null);
    const result =
      side === 'buy'
        ? portfolioStore.buy(
            market.id,
            market.question,
            selectedOutcome.id,
            selectedOutcome.label,
            shares,
            price,
          )
        : portfolioStore.sell(
            market.id,
            market.question,
            selectedOutcome.id,
            selectedOutcome.label,
            shares,
            price,
          );

    if (result.success) {
      setFeedback({
        type: 'success',
        msg: `${side === 'buy' ? 'Bought' : 'Sold'} ${formatShares(shares)} shares of "${selectedOutcome.label}" at ${formatPrice(price)}`,
      });
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedback({ type: 'error', msg: result.error ?? 'Trade failed.' });
    }
  };

  const quickAmounts = side === 'buy' ? [50, 100, 500] : [];

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-100">Paper Trade Simulator</h3>
        <button
          onClick={onNavigateCompare}
          className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
        >
          <GitCompare className="h-3.5 w-3.5" />
          Compare
        </button>
      </div>

      {/* Outcome selector */}
      <div>
        <label className="text-xs text-ink-300 mb-1.5 block">Choose outcome</label>
        <div className="grid grid-cols-2 gap-2">
          {market.outcomes.map(o => (
            <button
              key={o.id}
              onClick={() => setSelectedOutcome(o)}
              className={`p-3 rounded-xl border transition-all text-left ${
                selectedOutcome.id === o.id
                  ? 'border-teal-500/50 bg-teal-600/10'
                  : 'border-ink-700/60 bg-ink-800 hover:border-ink-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-100">{o.label}</span>
                <span className="text-sm font-bold text-gray-50 tabular-nums">
                  {formatProb(o.probability)}
                </span>
              </div>
              <span className="text-xs text-ink-400">{formatPrice(o.price)} / share</span>
            </button>
          ))}
        </div>
      </div>

      {/* Buy/Sell toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            side === 'buy'
              ? 'bg-teal-600 text-white'
              : 'bg-ink-800 text-ink-300 hover:bg-ink-700 border border-ink-700/60'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          disabled={!existingPosition}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
            side === 'sell'
              ? 'bg-danger-600 text-white'
              : 'bg-ink-800 text-ink-300 hover:bg-ink-700 border border-ink-700/60'
          }`}
        >
          Sell {existingPosition ? `(${formatShares(existingPosition.shares)})` : ''}
        </button>
      </div>

      {/* Share input */}
      <div>
        <label className="text-xs text-ink-300 mb-1.5 block">Shares</label>
        <input
          type="number"
          value={shareInput}
          onChange={e => setShareInput(e.target.value)}
          min="0"
          className="input-field w-full"
          placeholder="Enter number of shares"
        />
        <div className="flex gap-2 mt-2 flex-wrap">
          {side === 'buy' && quickAmounts.map(amt => (
            <button
              key={amt}
              onClick={() => setShareInput(String(amt))}
              className="text-xs px-2.5 py-1 rounded-md bg-ink-800 text-ink-300 hover:bg-ink-700 border border-ink-700/60"
            >
              {amt}
            </button>
          ))}
          <button
            onClick={() => setShareInput(String(side === 'buy' ? maxAffordable : maxSellable))}
            className="text-xs px-2.5 py-1 rounded-md bg-ink-800 text-teal-400 hover:bg-ink-700 border border-ink-700/60 ml-auto"
          >
            Max ({side === 'buy' ? formatShares(maxAffordable) : formatShares(maxSellable)})
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-1.5 px-3 py-3 rounded-xl bg-ink-950/50 border border-ink-700/40">
        <div className="flex justify-between text-sm">
          <span className="text-ink-300">Price per share</span>
          <span className="text-gray-100 font-mono">{formatPrice(price)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-300">Shares</span>
          <span className="text-gray-100 font-mono">{formatShares(shares)}</span>
        </div>
        <div className="flex justify-between text-sm font-medium pt-1.5 border-t border-ink-700/40">
          <span className="text-ink-300">{side === 'buy' ? 'Total cost' : 'Proceeds'}</span>
          <span className="text-gray-50 font-mono">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`text-sm px-3 py-2.5 rounded-lg animate-fade-in break-words ${
            feedback.type === 'success'
              ? 'bg-success-500/10 text-success-400 border border-success-500/20'
              : 'bg-danger-500/10 text-danger-400 border border-danger-500/20'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Action */}
      <button
        onClick={handleTrade}
        disabled={shares <= 0 || (side === 'buy' && total > portfolio.cashBalance) || (side === 'sell' && shares > maxSellable)}
        className={side === 'buy' ? 'btn-primary w-full' : 'btn-danger w-full'}
      >
        {side === 'buy'
          ? `Buy ${formatShares(shares)} "${selectedOutcome.label}"`
          : `Sell ${formatShares(shares)} "${selectedOutcome.label}"`}
      </button>
      <p className="text-[11px] text-ink-400 text-center break-words">
        Virtual money only. No real funds or transactions involved.
      </p>
    </div>
  );
}

interface MarketDetailPageProps {
  marketId: string;
  onBack: () => void;
  onNavigateCompare: () => void;
}

export function MarketDetailPage({ marketId, onBack, onNavigateCompare }: MarketDetailPageProps) {
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchMarket = async () => {
    setLoading(true);
    setError(false);
    try {
      const m = await marketDataService.getMarketById(marketId);
      if (m) {
        setMarket(m);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMarket(); }, [marketId]);

  const change = useMemo(() => {
    if (!market || market.oddsHistory.length < 2) return 0;
    return market.oddsHistory[market.oddsHistory.length - 1].prob - market.oddsHistory[0].prob;
  }, [market]);

  if (loading) {
    return (
      <div className="px-4 pt-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-ink-300 hover:text-gray-200 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="space-y-3">
          <div className="h-6 w-3/4 rounded-lg shimmer-bg" />
          <div className="h-40 rounded-xl shimmer-bg" />
          <div className="h-48 rounded-xl shimmer-bg" />
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="px-4 pt-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-ink-300 hover:text-gray-200 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <ErrorState onRetry={fetchMarket} />
      </div>
    );
  }

  const topOutcome = [...market.outcomes].sort((a, b) => b.probability - a.probability)[0];

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-ink-300 hover:text-gray-200">
        <ArrowLeft className="h-4 w-4" /> Back to markets
      </button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge bg-ink-700/60 text-ink-300">{market.category}</span>
          <span className={`badge ${
            market.status === 'closing-soon'
              ? 'bg-gold-500/15 text-gold-400 border border-gold-500/20'
              : 'bg-teal-600/10 text-teal-400 border border-teal-600/20'
          }`}>
            {market.status === 'closing-soon' ? 'Closing soon' : 'Active'}
          </span>
          <span className="text-xs text-ink-400 flex items-center gap-1 ml-auto">
            <Clock className="h-3 w-3" />
            {timeUntil(market.endsAt)}
          </span>
        </div>
        <h1 className="text-xl font-semibold text-gray-50 leading-tight break-words">{market.question}</h1>
      </div>

      {/* Odds summary */}
      <div className="card p-4">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-3xl font-bold text-gray-50 tabular-nums">
              {formatProb(topOutcome.probability)}
            </span>
            <span className="text-sm text-ink-300 ml-2">{topOutcome.label}</span>
          </div>
          <div className={`text-sm font-medium ${probChangeColor(change)}`}>
            {probChangeArrow(change)} {Math.abs(change * 100).toFixed(1)}%
          </div>
        </div>
        <OddsChart data={market.oddsHistory} height={160} color="auto" />
      </div>

      {/* Outcome probabilities */}
      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-100">Outcomes</h3>
        {market.outcomes.map(o => {
          return (
            <div key={o.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-200">{o.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-ink-400 text-xs">{formatPrice(o.price)}</span>
                  <span className="text-gray-50 font-bold tabular-nums">{formatProb(o.probability)}</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-ink-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    o.id === topOutcome.id ? 'bg-teal-500' : 'bg-ink-500'
                  }`}
                  style={{ width: `${o.probability * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Trade panel */}
      <TradePanel market={market} onNavigateCompare={onNavigateCompare} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="card p-2 sm:p-3 text-center min-w-0">
          <Droplets className="h-4 w-4 text-teal-400 mx-auto mb-1" />
          <div className="text-sm font-semibold text-gray-100 truncate">{formatCurrency(market.liquidity, true)}</div>
          <div className="text-[10px] text-ink-400">Liquidity</div>
        </div>
        <div className="card p-2 sm:p-3 text-center min-w-0">
          <BarChart3 className="h-4 w-4 text-teal-400 mx-auto mb-1" />
          <div className="text-sm font-semibold text-gray-100 truncate">{formatCurrency(market.totalVolume, true)}</div>
          <div className="text-[10px] text-ink-400">Total volume</div>
        </div>
        <div className="card p-2 sm:p-3 text-center min-w-0">
          <Activity className="h-4 w-4 text-teal-400 mx-auto mb-1" />
          <div className="text-sm font-semibold text-gray-100">{market.outcomes.length}</div>
          <div className="text-[10px] text-ink-400">Outcomes</div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <Activity className="h-4 w-4 text-teal-400" />
          Recent Activity
        </h3>
        <div className="space-y-2">
          {market.recentActivity.slice(0, 8).map(act => (
            <div key={act.id} className="flex items-center justify-between text-xs py-2 border-b border-ink-700/30 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`badge ${act.action === 'buy' ? 'bg-success-500/10 text-success-400' : 'bg-danger-500/10 text-danger-400'}`}>
                  {act.action}
                </span>
                <span className="text-gray-200 truncate">{formatShares(act.shares)} @ {formatPrice(act.price)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-ink-400">{act.outcome}</span>
                <span className="text-ink-500">{timeAgo(act.time)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="card p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <Info className="h-4 w-4 text-teal-400" />
          Resolution Criteria
        </h3>
        <p className="text-sm text-ink-300 leading-relaxed">{market.description}</p>
        <p className="text-xs text-ink-400">{market.resolutionSource}</p>
      </div>
    </div>
  );
}
