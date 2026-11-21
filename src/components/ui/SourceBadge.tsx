import type { MarketSource } from '@/types';
import { Radio, FlaskConical, Layers, CircleDot } from 'lucide-react';

interface SourceBadgeProps {
  source: MarketSource;
  lastUpdated?: number;
}

interface BadgeStyle {
  label: string;
  Icon: typeof Radio;
  className: string;
  showFreshness: boolean;
}

function badgeFor(source: MarketSource): BadgeStyle {
  switch (source) {
    case 'polymarket':
      return {
        label: 'POLYMARKET',
        Icon: Radio,
        className: 'bg-teal-600/15 text-teal-400 border border-teal-600/20',
        showFreshness: true,
      };
    case 'mixed':
      return {
        label: 'MIXED DATA',
        Icon: Layers,
        className: 'bg-gold-500/15 text-gold-400 border border-gold-500/20',
        showFreshness: true,
      };
    case 'predict':
      return {
        label: 'PREDICT',
        Icon: CircleDot,
        className: 'bg-accent-500/15 text-accent-300 border border-accent-500/20',
        showFreshness: true,
      };
    case 'demo':
    default:
      return {
        label: 'DEMO DATA',
        Icon: FlaskConical,
        className: 'bg-gold-500/15 text-gold-400 border border-gold-500/20',
        showFreshness: false,
      };
  }
}

export function SourceBadge({ source, lastUpdated }: SourceBadgeProps) {
  const { label, Icon, className, showFreshness } = badgeFor(source);

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
      {lastUpdated && showFreshness && (
        <span className="opacity-70 ml-0.5">
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
