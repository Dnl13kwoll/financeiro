import { formatCurrency } from '@/lib/utils'

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
]

export function SvgPieChart({
  data,
  total,
}: {
  data: { name: string; total: number }[]
  total: number
}) {
  if (data.length === 0 || total === 0) return null

  const cx = 80
  const cy = 80
  const r = 70

  let startAngle = -Math.PI / 2
  const slices = data.slice(0, 8).map((d, i) => {
    const pct = d.total / total
    const angle = pct * 2 * Math.PI
    const endAngle = startAngle + angle
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const largeArc = angle > Math.PI ? 1 : 0
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
    const midAngle = startAngle + angle / 2
    startAngle = endAngle
    return { path, color: COLORS[i % COLORS.length], name: d.name, total: d.total, pct: Math.round(pct * 100), midAngle }
  })

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="1.5">
            <title>{s.name}: {formatCurrency(s.total)} ({s.pct}%)</title>
          </path>
        ))}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-sm">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-gray-700">{s.name}</span>
            <span className="text-gray-400 text-xs">({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}
