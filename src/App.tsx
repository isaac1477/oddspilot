import { useRouter } from '@/hooks/useRouter';
import { usePortfolio } from '@/hooks/usePortfolio';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { DiscoverPage } from '@/pages/DiscoverPage';
import { MarketDetailPage } from '@/pages/MarketDetailPage';
import { PortfolioPage } from '@/pages/PortfolioPage';
import { ComparePage } from '@/pages/ComparePage';
import { AboutPage } from '@/pages/AboutPage';

function App() {
  const { route, navigate } = useRouter();
  const portfolio = usePortfolio();

  const isDetailPage = route.name === 'market-detail';

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col w-full">
      <Header
        balance={portfolio.cashBalance}
        onLogoClick={() => navigate({ name: 'discover' })}
      />

      <div className="flex flex-1">
        <Sidebar current={route.name} onNavigate={navigate} />

        <main className="flex-1 min-w-0 w-full">
          <div className="max-w-5xl mx-auto pb-24 md:pb-8 animate-fade-in" key={JSON.stringify(route)}>
            {route.name === 'discover' && <DiscoverPage onNavigate={navigate} />}
            {route.name === 'market-detail' && (
              <MarketDetailPage
                marketId={route.id}
                onBack={() => navigate({ name: 'discover' })}
                onNavigateCompare={() => navigate({ name: 'compare', ids: [route.id] })}
              />
            )}
            {route.name === 'portfolio' && <PortfolioPage onNavigate={navigate} />}
            {route.name === 'compare' && <ComparePage selectedIds={route.ids} onNavigate={navigate} />}
            {route.name === 'about' && <AboutPage />}
          </div>
        </main>
      </div>

      <BottomNav current={route.name} onNavigate={navigate} />
    </div>
  );
}

export default App;
