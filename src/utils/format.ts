export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatProb(prob: number): string {
  return `${(prob * 100).toFixed(0)}%`;
}

export function formatPrice(price: number): string {
  return `${(price * 100).toFixed(0)}¢`;
}

export function formatShares(shares: number): string {
  return shares.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

export function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? '+' : '-';
  return `${sign}${formatCurrency(Math.abs(pnl))}`;
}

export function formatPnlPct(pct: number): string {
  const sign = pct >= 0 ? '+' : '-';
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}

export function timeUntil(ts: number): string {
  const diff = ts - Date.now();
  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);

  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return `${hours}h ${mins}m`;
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function probChangeColor(change: number): string {
  if (change > 0.001) return 'text-success-400';
  if (change < -0.001) return 'text-danger-400';
  return 'text-ink-300';
}

export function probChangeArrow(change: number): string {
  if (change > 0.001) return '▲';
  if (change < -0.001) return '▼';
  return '—';
}
