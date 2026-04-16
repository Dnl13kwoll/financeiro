'use client'

type Slice = { name: string; total: number; color: string }

const COLORS = [
  '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#3b82f6',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#84cc16',
]

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function slicePath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToCartesian(cx, cy, r, start)
  const e = polarToCartesian(cx, cy, r, end)
  const large = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`
}

export function PieChart({ data }: { data: { name: string; total: number }[] }) {
  const total = data.reduce((s, d) => s + d.total, 0)
  if (total === 0 || data.length === 0) return null

  const slices: Slice[] = data.map((d, i) => ({
    ...d,
    color: COLORS[i % COLORS.length],
  }))

  const cx = 100, cy = 100, r = 80
  let current = 0
  const paths = slices.map(s => {
    const start = current
    const sweep = (s.total / total) * 360
    current += sweep
    return { ...s, start, end: current }
  })

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <svg viewBox="0 0 200 200" className="w-48 h-48 shrink-0">
        {paths.map((p, i) => (
          <path
            key={i}
            d={slicePath(cx, cy, r, p.start, p.end)}
            fill={p.color}
            stroke="white"
            strokeWidth="2"
          >
            <title>{p.name}: {((p.total / total) * 100).toFixed(1)}%</title>
          </path>
        ))}
        <circle cx={cx} cy={cy} r={40} fill="white" />
      </svg>

      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {slices.map((s, i) => (
          <a
            key={i}
            href={`/reports?category=${encodeURIComponent(s.name)}`}
            className="flex items-center gap-2 text-sm min-w-0 hover:bg-gray-50 rounded px-1 py-0.5 transition-colors group"
          >
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-gray-700 truncate flex-1 group-hover:text-primary-600 transition-colors">{s.name}</span>
            <span className="font-medium text-gray-900 shrink-0">
              {((s.total / total) * 100).toFixed(1)}%
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
