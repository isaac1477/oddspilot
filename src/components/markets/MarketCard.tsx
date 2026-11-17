import { Clock, Droplets, BarChart3 } from 'lucide-react';
import type { Market } from '@/types';
import { formatCurrency, formatProb, timeUntil, probChangeColor, probChangeArrow } from '@/utils/format';
import { SourceBadge } from '@/components/ui/SourceBadge';

interface MarketCardProps {
  market: Market;
  onClick: () => void;
}

export function MarketCard({ market, onClick }: MarketCardProps) {
  const history = market.oddsHistory;
  const change = history.length >= 2 ? history[history.length - 1].prob - history[0].prob : 0;

  const statusStyles =
    market.status === 'closing-soon'
      ? 'bg-gold-500/15 text-gold-400 border border-gold-500/20'
      : 'bg-teal-600/10 text-teal-400 border border-teal-600/20';

  const statusLabel = market.status === 'closing-soon' ? 'Closing soon' : 'Active';

  const topOutcome = [...market.outcomes].sort((a, b) => b.probability - a.probability)[0];

  return (
    <button
      onClick={onClick}
      className="card-hover p-4 text-left w-full flex flex-col gap-3 group cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge bg-ink-700/60 text-ink-300">{market.category}</span>
          <span className={`badge ${statusStyles}`}>{statusLabel}</span>
        </div>
        <span className="text-xs text-ink-400 flex items-center gap-1 shrink-0">
          <Clock className="h-3 w-3" />
          {timeUntil(market.endsAt)}
        </span>
      </div>

      <h3 className="text-sm font-medium text-gray-100 leading-snug group-hover:text-white transition-colors break-words">
        {market.question}
      </h3>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-50 tabular-nums">
              {formatProb(topOutcome.probability)}
            </span>
            <span className="text-xs text-ink-300">{topOutcome.label}</span>
          </div>
          <div className={`text-xs font-medium mt-0.5 ${probChangeColor(change)}`}>
            {probChangeArrow(change)} {Math.abs(change * 100).toFixed(1)}% (24h)
          </div>
        </div>

        {/* Mini sparkline */}
        <svg viewBox="0 0 60 28" className="w-16 h-8 shrink-0" preserveAspectRatio="none">
          <polyline
            points={history.map((p, i) => {
              const x = (i / (history.length - 1)) * 60;
              const y = 28 - p.prob * 28;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke={change >= 0 ? '#34d399' : '#f87171'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="flex items-center gap-4 text-xs text-ink-400 pt-2 border-t border-ink-700/40 flex-wrap">
        <span className="flex items-center gap-1">
          <Droplets className="h-3 w-3" />
          {formatCurrency(market.liquidity, true)}
        </span>
        <span className="flex items-center gap-1">
          <BarChart3 className="h-3 w-3" />
          {formatCurrency(market.totalVolume, true)} vol
        </span>
        <span className="ml-auto">
          <SourceBadge source={market.source} />
        </span>
      </div>
    </button>
  );
}
