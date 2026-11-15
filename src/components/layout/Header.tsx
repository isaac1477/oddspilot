import { TrendingUp } from 'lucide-react';

interface HeaderProps {
  balance: number;
  onLogoClick: () => void;
}

import { formatCurrency } from '@/utils/format';

export function Header({ balance, onLogoClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-ink-700/40">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        <button onClick={onLogoClick} className="flex items-center gap-2 group shrink-0">
          <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center group-hover:bg-teal-500 transition-colors">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-gray-100 text-base tracking-tight">
            Odds<span className="text-teal-400">Pilot</span>
          </span>
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-ink-800 border border-ink-700/60 min-w-0">
          <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse-glow shrink-0" />
          <span className="text-xs text-ink-300 font-medium hidden xs:inline sm:inline">Virtual</span>
          <span className="text-sm text-gray-100 font-mono font-semibold tabular-nums truncate">
            {formatCurrency(balance)}
          </span>
        </div>
      </div>
    </header>
  );
}
