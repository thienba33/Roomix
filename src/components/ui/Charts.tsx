'use client';
export interface ChartDatum { label: string; value: number; color?: string }

function fmt(v: number) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');
}

export function BarChart({ data, height = 180, color = '#4F46E5' }: { data: ChartDatum[]; height?: number; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 320, H = height, padB = 24, padT = 22;
  const bw = W / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {data.map((d, i) => {
        const h = ((H - padB - padT) * d.value) / max;
        const x = i * bw + bw * 0.22;
        const w = bw * 0.56;
        const y = H - padB - h;
        return (
          <g key={d.label}>
            <text x={x + w / 2} y={y - 6} textAnchor="middle" fontSize="11" fill="#6A6A6A">{fmt(d.value)}</text>
            <rect x={x} y={y} width={w} height={h} rx="6" fill={d.color ?? color} />
            <text x={x + w / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#6A6A6A">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({ data, height = 180, color = '#4F46E5', area = true }: { data: ChartDatum[]; height?: number; color?: string; area?: boolean }) {
  const W = 320, H = height, padB = 24, padT = 22, padX = 14;
  const max = Math.max(...data.map((d) => d.value), 1) * 1.15;
  const min = 0;
  const pts = data.map((d, i) => {
    const x = padX + (i * (W - padX * 2)) / Math.max(data.length - 1, 1);
    const y = H - padB - ((d.value - min) / (max - min)) * (H - padB - padT);
    return { x, y, d };
  });
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = `M ${pts[0]?.x ?? 0},${H - padB} L ${pts.map((p) => `${p.x},${p.y}`).join(' L ')} L ${pts[pts.length - 1]?.x ?? 0},${H - padB} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {area && pts.length > 1 && <path d={areaPath} fill={color} opacity="0.10" />}
      {pts.length > 1 && <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {pts.map((p, i) => (
        <g key={p.d.label}>
          <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2.5" />
          {(i === 0 || i === pts.length - 1) && (
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill={color}>{fmt(p.d.value)}</text>
          )}
          <text x={p.x} y={H - 6} textAnchor="middle" fontSize="11" fill="#6A6A6A">{p.d.label}</text>
        </g>
      ))}
    </svg>
  );
}

export function DonutChart({ data, size = 170, centerLabel, centerSub }: { data: ChartDatum[]; size?: number; centerLabel?: string; centerSub?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 70, c = 2 * Math.PI * r;
  let offset = 0;
  const arcs = data.map((d) => {
    const frac = d.value / total;
    const arc = { d, dash: frac * c, offset: -offset * c, color: d.color ?? '#4F46E5' };
    offset += frac;
    return arc;
  });
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <circle cx="90" cy="90" r={r} fill="none" stroke="#EEF2FF" strokeWidth="22" />
          {arcs.map((a, i) => (
            <circle key={i} cx="90" cy="90" r={r} fill="none" stroke={a.color} strokeWidth="22"
              strokeDasharray={`${Math.max(a.dash - 2, 0)} ${c}`} strokeDashoffset={a.offset} />
          ))}
        </svg>
        {(centerLabel || centerSub) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerLabel && <span className="text-[26px] font-extrabold text-ink">{centerLabel}</span>}
            {centerSub && <span className="text-xs text-muted">{centerSub}</span>}
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((d) => (
          <span key={d.label} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: d.color ?? '#4F46E5' }} />
            {d.label} · {Math.round((d.value / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}
