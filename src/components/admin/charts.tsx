/**
 * Small dependency-free SVG charts. They render on the server (no hooks, no
 * browser APIs), so pages can hand them formatting functions directly. They keep the admin bundle light and are
 * easy to restyle; swap in a charting library if the dashboard grows.
 */

export function LineChart({
  points,
  height = 200,
  valueFormat = (n: number) => String(n),
  label = "Chart",
}: {
  points: { label: string; value: number }[];
  height?: number;
  valueFormat?: (value: number) => string;
  label?: string;
}) {
  if (points.length === 0) return <ChartEmpty />;

  const width = 640;
  const padding = { top: 16, right: 8, bottom: 24, left: 8 };
  const max = Math.max(...points.map((p) => p.value), 1);
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;

  const coords = points.map((point, index) => ({
    x: padding.left + index * step,
    y: padding.top + innerH - (point.value / max) * innerH,
    ...point,
  }));

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L ${coords[coords.length - 1]!.x.toFixed(1)} ${padding.top + innerH} L ${coords[0]!.x.toFixed(1)} ${
    padding.top + innerH
  } Z`;

  const peak = coords.reduce((best, c) => (c.value > best.value ? c : best), coords[0]!);

  return (
    <figure className="w-full">
      <figcaption className="sr-only">
        {label}: {points.map((p) => `${p.label} ${valueFormat(p.value)}`).join(", ")}
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={label}>
        <defs>
          <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-saffron-400)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-saffron-400)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((fraction) => (
          <line
            key={fraction}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerH * (1 - fraction)}
            y2={padding.top + innerH * (1 - fraction)}
            stroke="var(--color-ink-100)"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill="url(#line-fill)" />
        <path d={line} fill="none" stroke="var(--color-saffron-500)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={peak.x} cy={peak.y} r="4" fill="var(--color-saffron-600)" />
        <text
          // Keep the label inside the viewBox when the peak sits at either edge.
          x={Math.min(Math.max(peak.x, 34), width - 34)}
          y={Math.max(peak.y - 10, 12)}
          textAnchor="middle"
          className="fill-ink-500"
          fontSize="11"
        >
          {valueFormat(peak.value)}
        </text>
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ink-400">
        <span>{points[0]!.label}</span>
        <span>{points[points.length - 1]!.label}</span>
      </div>
    </figure>
  );
}

export function BarChart({
  points,
  valueFormat = (n: number) => String(n),
  label = "Chart",
}: {
  points: { label: string; value: number }[];
  valueFormat?: (value: number) => string;
  label?: string;
}) {
  if (points.length === 0) return <ChartEmpty />;
  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <div role="img" aria-label={`${label}: ${points.map((p) => `${p.label} ${valueFormat(p.value)}`).join(", ")}`}>
      <ul className="space-y-2.5">
        {points.map((point) => (
          <li key={point.label} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-xs text-ink-600" title={point.label}>
              {point.label}
            </span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-saffron-300 to-saffron-500"
                style={{ width: `${Math.max((point.value / max) * 100, 2)}%` }}
              />
            </span>
            <span className="w-16 shrink-0 text-right text-xs font-semibold text-ink-700">{valueFormat(point.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DonutChart({
  slices,
  label = "Breakdown",
}: {
  slices: { label: string; value: number; color: string }[];
  label?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (total === 0) return <ChartEmpty />;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 160 160" className="h-40 w-40" role="img" aria-label={`${label}: ${slices.map((s) => `${s.label} ${s.value}`).join(", ")}`}>
        <g transform="translate(80,80) rotate(-90)">
          {slices.map((slice) => {
            const length = (slice.value / total) * circumference;
            const dash = `${length} ${circumference - length}`;
            const element = (
              <circle
                key={slice.label}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth="26"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return element;
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" className="fill-ink-900" fontSize="22" fontWeight="700">
          {total}
        </text>
        <text x="80" y="94" textAnchor="middle" className="fill-ink-400" fontSize="10">
          total
        </text>
      </svg>

      <ul className="space-y-1.5 text-sm">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} aria-hidden />
            <span className="text-ink-600">{slice.label}</span>
            <span className="font-semibold text-ink-900">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartEmpty() {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl bg-ink-100/60 text-sm text-ink-400">
      Not enough data yet
    </div>
  );
}
