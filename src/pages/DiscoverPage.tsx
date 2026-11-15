import { useEffect, useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, TrendingUp } from 'lucide-react';
import { marketDataService } from '@/services/marketDataService';
import type { Market, MarketCategory } from '@/types';
import { categories } from '@/data/sampleMarkets';
import { MarketCard } from '@/components/markets/MarketCard';
import { SkeletonCardGrid } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Route } from '@/hooks/useRouter';

interface DiscoverPageProps {
  onNavigate: (route: Route) => void;
}

type SortOption = 'volume' | 'liquidity' | 'ending' | 'prob-change';

const sortLabels: Record<SortOption, string> = {
  volume: 'Volume',
  liquidity: 'Liquidity',
  ending: 'Ending soon',
  'prob-change': 'Odds movement',
};

export function DiscoverPage({ onNavigate }: DiscoverPageProps) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'All' | MarketCategory>('All');
  const [sortBy, setSortBy] = useState<SortOption>('volume');
  const [showFilters, setShowFilters] = useState(false);

  const fetchMarkets = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await marketDataService.getMarkets({
        search: search || undefined,
        category,
        sortBy,
      });
      setMarkets(result.markets);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchMarkets, search ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, sortBy]);

  const hasActiveFilters = search || category !== 'All' || sortBy !== 'volume';

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setSortBy('volume');
  };

  const trendingMarkets = useMemo(() => {
    return [...markets].slice(0, 3);
  }, [markets]);

  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      {/* Hero section */}
      <div className="card p-5 bg-gradient-to-br from-ink-800 to-ink-900 border-teal-600/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-50">Prediction Market Intelligence</h2>
            <p className="text-sm text-ink-300 mt-1">
              Track odds, spot movement, and simulate trades with virtual money.
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-teal-600/20 border border-teal-600/30 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-teal-400" />
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search markets, outcomes…"
          className="input-field w-full pl-10 pr-10"
          aria-label="Search markets"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category chips — intentionally horizontally scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-teal-600 text-white'
                  : 'bg-ink-800 text-ink-300 hover:bg-ink-700 border border-ink-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
      </div>

      {/* Sort + results header */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-sm text-ink-300">
          {loading ? 'Loading…' : `${markets.length} market${markets.length !== 1 ? 's' : ''}`}
        </span>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-ink-400 hover:text-gray-200 flex items-center gap-1">
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
          <button
            onClick={() => setShowFilters(s => !s)}
            className="flex items-center gap-1.5 text-xs text-ink-300 hover:text-gray-200 bg-ink-800 border border-ink-700/60 rounded-lg px-3 py-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {sortLabels[sortBy]}
          </button>
        </div>
      </div>

      {/* Sort dropdown */}
      {showFilters && (
        <div className="card p-2 space-y-1 animate-slide-up">
          {(Object.keys(sortLabels) as SortOption[]).map(opt => (
            <button
              key={opt}
              onClick={() => {
                setSortBy(opt);
                setShowFilters(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                sortBy === opt ? 'bg-teal-600/15 text-teal-400' : 'text-ink-300 hover:bg-ink-800'
              }`}
            >
              {sortLabels[opt]}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <SkeletonCardGrid count={4} />
      ) : error ? (
        <ErrorState onRetry={fetchMarkets} />
      ) : markets.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6 text-ink-400" />}
          title="No markets found"
          message="Try a different search or category filter."
          action={
            <button onClick={clearFilters} className="btn-secondary text-sm">
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {markets.map(market => (
            <MarketCard
              key={market.id}
              market={market}
              onClick={() => onNavigate({ name: 'market-detail', id: market.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
