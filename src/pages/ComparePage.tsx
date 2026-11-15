import { useState, useEffect } from 'react';
import { GitCompare, X, Plus, Clock, Droplets, BarChart3 } from 'lucide-react';
import { marketDataService } from '@/services/marketDataService';
import type { Market } from '@/types';
import { sampleMarkets } from '@/data/sampleMarkets';
import { OddsChart } from '@/components/ui/OddsChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import {
  formatCurrency,
  formatProb,
  formatPrice,
  timeUntil,
  probChangeColor,
  probChangeArrow,
} from '@/utils/format';
import type { Route } from '@/hooks/useRouter';

interface ComparePageProps {
  selectedIds?: string[];
  onNavigate: (route: Route) => void;
}

const MAX_COMPARE = 4;

export function ComparePage({ selectedIds, onNavigate }: ComparePageProps) {
  const [ids, setIds] = useState<string[]>(selectedIds ?? []);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (ids.length === 0) {
      setMarkets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    marketDataService.getMarketByIds(ids).then(ms => {
      setMarkets(ms);
      setLoading(false);
    });
  }, [ids]);

  const availableMarkets = sampleMarkets.filter(m => !ids.includes(m.id));

  const addMarket = (id: string) => {
    if (ids.length >= MAX_COMPARE) return;
    setIds([...ids, id]);
    setShowPicker(false);
  };

  const removeMarket = (id: string) => {
    setIds(ids.filter(x => x !== id));
  };

  const chartColors = ['#34d399', '#22d3ee', '#fbbf24', '#f87171'];

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-50 flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-teal-400" />
          Compare Markets
        </h2>
        {ids.length > 0 && (
          <button onClick={() => setShowPicker(true)} className="btn-secondary text-sm flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Add
          </button>
        )}
      </div>

      {/* Multi-chart overlay */}
      {markets.length >= 2 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-100 mb-3">Odds Over Time (Top Outcome)</h3>
          <div className="relative h-48">
            <svg viewBox="0 0 100 160" preserveAspectRatio="none" className="w-full h-full">
              {[0.25, 0.5, 0.75].map(pct => (
                <line key={pct} x1="0" y1={160 - pct * 160} x2="100" y2={160 - pct * 160}
                  stroke="#1a2740" strokeWidth="0.3" strokeDasharray="1 2" />
              ))}
              {markets.map((mkt, idx) => {
                const color = chartColors[idx % chartColors.length];
                const history = mkt.oddsHistory;
                if (history.length < 2) return null;
                const path = history.map((p, i) => {
                  const x = (i / (history.length - 1)) * 100;
                  const y = 160 - p.prob * 160;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ');
                return (
                  <path key={mkt.id} d={path} fill="none" stroke={color}
                    strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke" />
                );
              })}
            </svg>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {markets.map((mkt, idx) => (
              <div key={mkt.id} className="flex items-center gap-1.5 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: chartColors[idx % chartColors.length] }} />
                <span className="text-ink-300 truncate max-w-[120px]">{mkt.question}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowPicker(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative card w-full max-w-md max-h-[70vh] flex flex-col rounded-b-none sm:rounded-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-ink-700/40">
              <h3 className="text-sm font-semibold text-gray-100">Select markets to compare</h3>
              <button onClick={() => setShowPicker(false)} className="text-ink-400 hover:text-gray-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-2 space-y-1 flex-1">
              {availableMarkets.map(m => (
                <button
                  key={m.id}
                  onClick={() => addMarket(m.id)}
                  disabled={ids.length >= MAX_COMPARE}
                  className="w-full text-left p-3 rounded-xl hover:bg-ink-800 transition-colors disabled:opacity-30"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge bg-ink-700/60 text-ink-300">{m.category}</span>
                  </div>
                  <span className="text-sm text-gray-200">{m.question}</span>
                </button>
              ))}
              {availableMarkets.length === 0 && (
                <p className="text-sm text-ink-400 text-center py-4">All markets already selected.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : ids.length === 0 ? (
        <EmptyState
          icon={<GitCompare className="h-6 w-6 text-ink-400" />}
          title="No markets selected"
          message={`Select up to ${MAX_COMPARE} markets to compare odds, volume, and movement side by side.`}
          action={
            <button onClick={() => setShowPicker(true)} className="btn-primary text-sm flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Add markets
            </button>
          }
        />
      ) : (
        <>
          {/* Comparison cards */}
          <div className="space-y-3">
            {markets.map((mkt, idx) => {
              const change = mkt.oddsHistory.length >= 2
                ? mkt.oddsHistory[mkt.oddsHistory.length - 1].prob - mkt.oddsHistory[0].prob
                : 0;
              const topOutcome = [...mkt.outcomes].sort((a, b) => b.probability - a.probability)[0];
              return (
                <div key={mkt.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <button
                      onClick={() => onNavigate({ name: 'market-detail', id: mkt.id })}
                      className="text-left min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: chartColors[idx % chartColors.length] }} />
                        <span className="badge bg-ink-700/60 text-ink-300">{mkt.category}</span>
                      </div>
                      <span className="text-sm text-gray-100 hover:text-white">{mkt.question}</span>
                    </button>
                    <button onClick={() => removeMarket(mkt.id)} className="text-ink-400 hover:text-danger-400 shrink-0">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-gray-50 tabular-nums">
                      {formatProb(topOutcome.probability)}
                    </span>
                    <span className="text-xs text-ink-300">{topOutcome.label}</span>
                    <span className={`text-xs font-medium ml-auto ${probChangeColor(change)}`}>
                      {probChangeArrow(change)} {Math.abs(change * 100).toFixed(1)}%
                    </span>
                  </div>

                  <OddsChart data={mkt.oddsHistory} height={100} color={chartColors[idx % chartColors.length]} showAxis={false} />

                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs min-w-0">
                    <div className="min-w-0">
                      <span className="text-ink-400 flex items-center gap-1"><Droplets className="h-3 w-3" /> Liquidity</span>
                      <div className="text-gray-100 font-mono truncate">{formatCurrency(mkt.liquidity, true)}</div>
                    </div>
                    <div className="min-w-0">
                      <span className="text-ink-400 flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Volume</span>
                      <div className="text-gray-100 font-mono truncate">{formatCurrency(mkt.totalVolume, true)}</div>
                    </div>
                    <div className="min-w-0">
                      <span className="text-ink-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Ends</span>
                      <div className="text-gray-100 font-mono truncate">{timeUntil(mkt.endsAt)}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-ink-700/40 space-y-1">
                    {mkt.outcomes.map(o => (
                      <div key={o.id} className="flex items-center justify-between text-xs">
                        <span className="text-ink-300">{o.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-ink-400">{formatPrice(o.price)}</span>
                          <span className="text-gray-100 font-medium tabular-nums">{formatProb(o.probability)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {ids.length < MAX_COMPARE && (
            <button
              onClick={() => setShowPicker(true)}
              className="w-full py-3 rounded-xl border border-dashed border-ink-600 text-ink-300 hover:text-gray-200 hover:border-ink-500 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add another market ({ids.length}/{MAX_COMPARE})
            </button>
          )}
        </>
      )}
    </div>
  );
}
