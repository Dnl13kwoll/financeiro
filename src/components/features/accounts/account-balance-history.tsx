'use client'

type BalancePoint = { label: string; balance: number }

export function AccountBalanceHistory({ points }: { points: BalancePoint[] }) {
  if (points.length < 2) return null

  const values = points.map(p => p.balance)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const W = 400
  const H = 80
  const padX = 4
  const padY = 8

  const coords = points.map((p, i) => ({
    x: padX + (i / (points.length - 1)) * (W - padX * 2),
    y: padY + (1 - (p.balance - min) / range) * (H - padY * 2),
    ...p,
  }))

  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')

  const lastIsPositive = values[values.length - 1] >= 0

  return (
    <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Histórico de saldo (6 meses)</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20">
        {/* Baseline zero */}
        {min < 0 && max > 0 && (
          <line
            x1={padX} y1={padY + (1 - (0 - min) / range) * (H - padY * 2)}
            x2={W - padX} y2={padY + (1 - (0 - min) / range) * (H - padY * 2)}
            stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 3"
          />
        )}
        {/* Area fill */}
        <path
          d={`${pathD} L ${coords[coords.length - 1].x.toFixed(1)} ${H - padY} L ${coords[0].x.toFixed(1)} ${H - padY} Z`}
          fill={lastIsPositive ? 'rgba(99,102,241,0.08)' : 'rgba(239,68,68,0.08)'}
        />
        {/* Line */}
        <path d={pathD} fill="none" stroke={lastIsPositive ? '#6366f1' : '#ef4444'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3" fill={lastIsPositive ? '#6366f1' : '#ef4444'} />
        ))}
      </svg>
      {/* Labels */}
      <div className="flex justify-between mt-1">
        {points.map((p, i) => (
          <span key={i} className="text-[10px] text-gray-400">{p.label}</span>
        ))}
      </div>
    </div>
  )
}
