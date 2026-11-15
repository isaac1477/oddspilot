import { Compass, Briefcase, GitCompare, Info } from 'lucide-react';
import type { Route } from '@/hooks/useRouter';

interface SidebarProps {
  current: Route['name'];
  onNavigate: (route: Route) => void;
}

const items = [
  { name: 'discover' as const, label: 'Markets', icon: Compass },
  { name: 'portfolio' as const, label: 'Portfolio', icon: Briefcase },
  { name: 'compare' as const, label: 'Compare', icon: GitCompare },
  { name: 'about' as const, label: 'About', icon: Info },
];

export function Sidebar({ current, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden md:block fixed left-0 top-14 bottom-0 w-56 border-r border-ink-700/40 p-3">
      <nav className="flex flex-col gap-1">
        {items.map(item => {
          const active = current === item.name;
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => onNavigate({ name: item.name } as Route)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-teal-600/15 text-teal-400 border border-teal-600/20'
                  : 'text-ink-300 hover:bg-ink-800 hover:text-gray-200 border border-transparent'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 px-4 py-3 rounded-xl bg-ink-800/50 border border-ink-700/40">
        <p className="text-[11px] text-ink-400 leading-relaxed">
          Paper trading simulator. No real funds, no wallet connections. Built for the Solana Perps & Prediction Markets hackathon.
        </p>
      </div>
    </aside>
  );
}
