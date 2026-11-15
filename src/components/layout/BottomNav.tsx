import { Compass, Briefcase, GitCompare, Info } from 'lucide-react';
import type { Route } from '@/hooks/useRouter';

interface BottomNavProps {
  current: Route['name'];
  onNavigate: (route: Route) => void;
}

const items = [
  { name: 'discover' as const, label: 'Markets', icon: Compass },
  { name: 'portfolio' as const, label: 'Portfolio', icon: Briefcase },
  { name: 'compare' as const, label: 'Compare', icon: GitCompare },
  { name: 'about' as const, label: 'About', icon: Info },
];

export function BottomNav({ current, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-ink-700/40 md:hidden">
      <div className="flex items-center justify-around h-16 px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map(item => {
          const active = current === item.name;
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => onNavigate({ name: item.name } as Route)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all flex-1 ${
                active ? 'text-teal-400' : 'text-ink-400 hover:text-ink-300'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
