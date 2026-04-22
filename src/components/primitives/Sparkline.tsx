import type { WeekBucket } from "@/lib/listing-stats";

type Props = {
  data: WeekBucket[];
  width?: number;
  height?: number;
  className?: string;
};

/** Tiny SVG sparkline. Renders zeros as a flat baseline so empty series
 *  still look intentional. */
export function Sparkline({
  data,
  width = 240,
  height = 56,
  className,
}: Props) {
  if (data.length === 0) {
    return (
      <div className="text-xs text-ink/50">No views yet</div>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.views));
  const padX = 2;
  const padY = 4;
  const step = (width - padX * 2) / Math.max(1, data.length - 1);

  const points = data.map((d, i) => {
    const x = padX + i * step;
    const y =
      height - padY - (d.views / max) * (height - padY * 2);
    return [x, y] as const;
  });

  const line = points
    .map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
    .join(" ");

  const fill = `${line} L${points[points.length - 1][0]},${height - padY} L${points[0][0]},${height - padY} Z`;

  const last = data[data.length - 1];
  const first = data[0];
  const delta = last.views - first.views;
  const deltaPct =
    first.views > 0 ? Math.round((delta / first.views) * 100) : null;

  return (
    <div className={className}>
      <svg
        role="img"
        aria-label={`View trend, last 8 weeks (latest: ${last.views})`}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block"
      >
        <path d={fill} fill="rgb(230,78,33)" opacity="0.12" />
        <path
          d={line}
          fill="none"
          stroke="rgb(230,78,33)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === points.length - 1 ? 3 : 1.5}
            fill="rgb(230,78,33)"
          />
        ))}
      </svg>
      {deltaPct !== null && (
        <div className="mt-1 text-xs text-ink/60">
          {delta >= 0 ? "▲" : "▼"} {Math.abs(deltaPct)}% vs 8 weeks ago
        </div>
      )}
    </div>
  );
}
