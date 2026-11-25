OddsPilot

Prediction-market discovery, comparison, and paper trading for the Solana hackathon.

OddsPilot brings prediction-market listings, market details, comparison tools, and a virtual portfolio into one interface. It is designed to help users explore markets and practice trade decisions without risking real funds.

Features

- Market discovery: Browse markets, search, filter by category, and inspect market details.
- Market information: View outcomes, probabilities, available order-book information, liquidity, and volume where provided by the data source.
- Market comparison: Compare selected markets and view their odds information side by side.
- Paper-trading simulator: Simulate buys and sells using virtual funds.
- Virtual portfolio: Track simulated cash, positions, and trade history.
- Demo fallback: Sample markets are available when the external market-data service cannot be reached.

Data and trading status

OddsPilot is a read-only market-data interface with paper trading.

- Market listings are intended to come from Polymarket’s public market-data APIs, with clearly labelled demo data available as a fallback.
- API availability and data freshness may vary. A source label does not guarantee that a particular response was successfully fetched live.
- Trades are simulated using virtual funds. The simulator does not place real orders.
- No wallet connection, wallet signing, private-key access, or real-money transactions are implemented.
- Solana-native prediction-market integration, including PREDICT, is not currently implemented.

This project is a hackathon prototype, not a production trading or financial service.

Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS

Run locally

You’ll need Node.js and npm installed.

npm install
npm run dev

Vite will print the local development URL in the terminal.

Checks

npm run typecheck
npm run build

Project structure

src/
  components/
  data/
  hooks/
  pages/
  services/
  types/
public/

- "src/pages/" contains the main application screens.
- "src/components/" contains reusable interface components.
- "src/services/" contains market-data and portfolio logic.
- "src/data/" contains sample/demo market data.
- "src/hooks/" contains shared application hooks, including routing and portfolio state.
- "src/types/" contains TypeScript models.

Current limitations

- Market-data availability depends on the external API and network.
- Demo data is not live market information.
- Paper-trading results are simulated and should not be treated as real trading performance.
- Portfolio persistence is local to the browser/device; it is not an authenticated, cross-device account.
- No on-chain market execution or settlement is implemented.

Hackathon context

Built for the Perps and Prediction Markets Solana hackathon. The project explores prediction-market research and simulation while keeping trading read-only and paper-only.

License

No license has been specified yet. Add a license before redistributing or reusing the project.