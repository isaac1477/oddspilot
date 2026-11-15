import type { OddsPoint } from '@/types';

interface OddsChartProps {
  data: OddsPoint[];
  height?: number;
  color?: string;
  showAxis?: boolean;
}

export function OddsChart({
  data,
  height = 160,
  color = '#34d399',
  showAxis = true,
}: OddsChartProps) {
  if (data.length < 2) {
    return <div style={{ height }} className="flex items-center justify-center text-ink-400 text-sm">No chart data</div>;
  }

  const width = 100;
  const probs = data.map(d => d.prob);
  const minP = Math.max(0, Math.min(...probs) - 0.05);
  const maxP = Math.min(1, Math.max(...probs) + 0.05);
  const range = maxP - minP || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.prob - minP) / range) * height;
    return { x, y, prob: d.prob };
  });

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  const gridLines = [0.25, 0.5, 0.75].map(pct => ({
    y: height - ((pct - minP) / range) * height,
    label: `${Math.round(pct * 100)}%`,
  }));

  const lastProb = data[data.length - 1].prob;
  const firstProb = data[0].prob;
  const isUp = lastProb >= firstProb;
  const lineColor = color === 'auto' ? (isUp ? '#34d399' : '#f87171') : color;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id={`grad-${lineColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {showAxis && gridLines.map((g, i) => (
          <line
            key={i}
            x1="0"
            y1={g.y}
            x2={width}
            y2={g.y}
            stroke="#1a2740"
            strokeWidth="0.3"
            strokeDasharray="1 2"
          />
        ))}

        <path d={areaD} fill={`url(#grad-${lineColor.replace('#', '')})`} />
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {showAxis && (
        <div className="absolute right-0 top-0 flex flex-col justify-between pointer-events-none" style={{ height }}>
          {gridLines.map((g, i) => (
            <span key={i} className="text-[10px] text-ink-400 pr-1 -mt-2">{g.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
