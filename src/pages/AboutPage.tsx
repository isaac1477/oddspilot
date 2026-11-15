import { TrendingUp, Shield, BarChart3, Wallet, GitCompare, Layers } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      <div className="card p-6 bg-gradient-to-br from-ink-800 to-ink-900 border-teal-600/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-xl bg-teal-600 flex items-center justify-center">
            <TrendingUp className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-50">
              Odds<span className="text-teal-400">Pilot</span>
            </h2>
            <p className="text-sm text-ink-300">Prediction Market Intelligence</p>
          </div>
        </div>
        <p className="text-sm text-ink-300 leading-relaxed">
          OddsPilot is a prediction-market intelligence dashboard built for the Solana Perps and
          Prediction Markets hackathon. Discover markets, track odds movements, compare probabilities,
          and practice trading with virtual money — all in one clean, mobile-friendly interface.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-100">Features</h3>

        {[
          { icon: BarChart3, title: 'Market Discovery', desc: 'Search and filter prediction markets across categories with real-time odds.' },
          { icon: TrendingUp, title: 'Odds Tracking', desc: 'View probability changes over time with interactive charts and recent activity feeds.' },
          { icon: Wallet, title: 'Paper Trading', desc: 'Simulate buy and sell trades with $10,000 in virtual money. Track profit and loss.' },
          { icon: GitCompare, title: 'Market Comparison', desc: 'Compare up to 4 markets side-by-side with overlaid odds charts and stats.' },
          { icon: Layers, title: 'Portfolio Dashboard', desc: 'View open positions, current valuations, and full trade history.' },
        ].map(f => (
          <div key={f.title} className="card p-4 flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-teal-600/15 border border-teal-600/20 flex items-center justify-center shrink-0">
              <f.icon className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-100">{f.title}</h4>
              <p className="text-xs text-ink-300 mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 border-teal-600/20">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-100">Safety & Disclaimer</h4>
            <ul className="text-xs text-ink-300 space-y-1 leading-relaxed">
              <li>No wallet connections, private keys, or signatures are ever requested.</li>
              <li>No real-money trading. All trades use virtual paper money.</li>
              <li>Market data is currently sample data. The architecture is designed for Solana prediction-market data integration.</li>
              <li>This is a hackathon prototype, not financial advice.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h4 className="text-sm font-medium text-gray-100 mb-2">Built With</h4>
        <div className="flex flex-wrap gap-2">
          {['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Solana-ready'].map(t => (
            <span key={t} className="badge bg-ink-800 text-ink-300 border border-ink-700/60">{t}</span>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-ink-500 pt-2">
        Built for the Solana Perps & Prediction Markets Hackathon
      </p>
    </div>
  );
}
