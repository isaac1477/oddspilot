import type { MarketSource } from '@/types';
import { Radio, FlaskConical } from 'lucide-react';

interface SourceBadgeProps {
  source: MarketSource;
  lastUpdated?: number;
}

export function SourceBadge({ source, lastUpdated }: SourceBadgeProps) {
  const isLive = source === 'polymarket';

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium ${
      isLive
        ? 'bg-teal-600/15 text-teal-400 border border-teal-600/20'
        : 'bg-gold-500/15 text-gold-400 border border-gold-500/20'
    }`}>
      {isLive ? (
        <Radio className="h-3 w-3" />
      ) : (
        <FlaskConical className="h-3 w-3" />
      )}
      {isLive ? 'POLYMARKET' : 'DEMO DATA'}
      {lastUpdated && isLive && (
        <span className="text-teal-600/70 ml-0.5">
          · {formatFreshness(lastUpdated)}
        </span>
      )}
    </div>
  );
}

function formatFreshness(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}
