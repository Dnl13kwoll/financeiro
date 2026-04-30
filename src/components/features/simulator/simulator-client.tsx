'use client'
import { useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Target, Calculator, Star } from 'lucide-react'

type Goal = { id: string; name: string; target_amount: number; current_amount: number }
type Props = { selicRate: number; cdiRate: number; ipcaRate: number; goals?: Goal[] }
type Mode = 'growth' | 'goal' | 'goals'
type RateOption = { label: string; value: number }

function calcFV(pv: number, pmt: number, annualRate: number, years: number): number {
  if (annualRate === 0) return pv + pmt * years * 12
  const r = annualRate / 100 / 12
  const n = years * 12
  return pv * Math.pow(1 + r, n) + pmt * (Math.pow(1 + r, n) - 1) / r
}

function calcPMT(fv: number, pv: number, annualRate: number, years: number): number {
  if (annualRate === 0) return Math.max(0, (fv - pv) / (years * 12))
  const r = annualRate / 100 / 12
  const n = years * 12
  const pvFactor = pv * Math.pow(1 + r, n)
  return Math.max(0, (fv - pvFactor) * r / (Math.pow(1 + r, n) - 1))
}

function yearlyProjection(pv: number, pmt: number, annualRate: number, years: number) {
  const rows: { year: number; value: number; invested: number; yield: number }[] = []
  for (let y = 1; y <= years; y++) {
    const value = calcFV(pv, pmt, annualRate, y)
    const invested = pv + pmt * y * 12
    rows.push({ year: y, value, invested, yield: value - invested })
  }
  return rows
}

function calcMonthsToGoal(pv: number, pmt: number, annualRate: number, target: number): number {
  if (pv >= target) return 0
  if (pmt <= 0 && annualRate === 0) return Infinity
  const r = annualRate / 100 / 12
  if (r === 0) return Math.ceil((target - pv) / pmt)
  // Solve: pv*(1+r)^n + pmt*((1+r)^n-1)/r = target
  // Binary search
  let lo = 1, hi = 1200
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    const fv = pv * Math.pow(1 + r, mid) + pmt * (Math.pow(1 + r, mid) - 1) / r
    if (fv >= target) hi = mid
    else lo = mid + 1
  }
  return lo
}

export function SimulatorClient({ selicRate, cdiRate, ipcaRate, goals = [] }: Props) {
  const [mode, setMode] = useState<Mode>(goals.length > 0 ? 'goals' : 'growth')

  // Growth mode inputs
  const [initial, setInitial] = useState('10000')
  const [monthly, setMonthly] = useState('500')
  const [customRate, setCustomRate] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('cdi100')
  const [years, setYears] = useState('10')

  // Goals mode inputs
  const [goalsMonthly, setGoalsMonthly] = useState('500')
  const [goalsPreset, setGoalsPreset] = useState('cdi100')
  const [goalsCustomRate, setGoalsCustomRate] = useState('')

  // Goal mode inputs
  const [goalTarget, setGoalTarget] = useState('100000')
  const [goalInitial, setGoalInitial] = useState('5000')
  const [goalCustomRate, setGoalCustomRate] = useState('')
  const [goalPreset, setGoalPreset] = useState('cdi100')
  const [goalYears, setGoalYears] = useState('5')

  const presets: RateOption[] = [
    { label: `Poupança (~6,17%)`, value: 6.17 },
    { label: `CDI 100% (${cdiRate.toFixed(2)}%)`, value: cdiRate },
    { label: `CDI 110% (${(cdiRate * 1.1).toFixed(2)}%)`, value: cdiRate * 1.1 },
    { label: `SELIC (${selicRate.toFixed(2)}%)`, value: selicRate },
    { label: `IPCA + 5% (${(ipcaRate + 5).toFixed(2)}%)`, value: ipcaRate + 5 },
    { label: `IPCA + 6% (${(ipcaRate + 6).toFixed(2)}%)`, value: ipcaRate + 6 },
    { label: 'Personalizada', value: -1 },
  ]

  function getRate(preset: string, custom: string): number {
    if (preset === 'custom') return parseFloat(custom) || 0
    const found = presets.find(p => p.label.startsWith(preset.split('_')[0]))
    const p = presets.find((_, i) => `preset_${i}` === preset)
    if (p && p.value !== -1) return p.value
    return parseFloat(custom) || 0
  }

  // Simplified rate resolution
  const rateMap: Record<string, number> = {
    poupanca: 6.17,
    cdi100: cdiRate,
    cdi110: cdiRate * 1.1,
    selic: selicRate,
    ipca5: ipcaRate + 5,
    ipca6: ipcaRate + 6,
  }

  const growthRate = selectedPreset === 'custom' ? (parseFloat(customRate) || 0) : (rateMap[selectedPreset] ?? cdiRate)
  const goalRate = goalPreset === 'custom' ? (parseFloat(goalCustomRate) || 0) : (rateMap[goalPreset] ?? cdiRate)
  const goalsRate = goalsPreset === 'custom' ? (parseFloat(goalsCustomRate) || 0) : (rateMap[goalsPreset] ?? cdiRate)

  const growthResult = useMemo(() => {
    const pv = parseFloat(initial) || 0
    const pmt = parseFloat(monthly) || 0
    const y = parseInt(years) || 1
    return calcFV(pv, pmt, growthRate, y)
  }, [initial, monthly, growthRate, years])

  const goalMonthly = useMemo(() => {
    const fv = parseFloat(goalTarget) || 0
    const pv = parseFloat(goalInitial) || 0
    const y = parseInt(goalYears) || 1
    return calcPMT(fv, pv, goalRate, y)
  }, [goalTarget, goalInitial, goalRate, goalYears])

  const growthYearly = useMemo(() => {
    const pv = parseFloat(initial) || 0
    const pmt = parseFloat(monthly) || 0
    const y = Math.min(parseInt(years) || 1, 30)
    return yearlyProjection(pv, pmt, growthRate, y)
  }, [initial, monthly, growthRate, years])

  const totalInvested = (parseFloat(initial) || 0) + (parseFloat(monthly) || 0) * (parseInt(years) || 0) * 12
  const totalYield = growthResult - totalInvested

  const goalsResults = useMemo(() => {
    const pmt = parseFloat(goalsMonthly) || 0
    return goals.map(g => {
      const remaining = g.target_amount - g.current_amount
      const months = calcMonthsToGoal(g.current_amount, pmt, goalsRate, g.target_amount)
      const reachDate = months === Infinity ? null : new Date(Date.now() + months * 30.44 * 24 * 60 * 60 * 1000)
      return { ...g, remaining, months, reachDate, progress: Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) }
    }).sort((a, b) => a.months - b.months)
  }, [goals, goalsMonthly, goalsRate])

  const presetOptions = [
    { key: 'poupanca', label: `Poupança (~6,17%)` },
    { key: 'cdi100', label: `CDI 100% (${cdiRate.toFixed(2)}% a.a.)` },
    { key: 'cdi110', label: `CDI 110% (${(cdiRate * 1.1).toFixed(2)}% a.a.)` },
    { key: 'selic', label: `SELIC (${selicRate.toFixed(2)}% a.a.)` },
    { key: 'ipca5', label: `IPCA + 5% (${(ipcaRate + 5).toFixed(2)}% a.a.)` },
    { key: 'ipca6', label: `IPCA + 6% (${(ipcaRate + 6).toFixed(2)}% a.a.)` },
    { key: 'custom', label: 'Personalizada' },
  ]

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
  const labelClass = "block text-xs font-medium text-gray-500 mb-1"

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        <button
          onClick={() => setMode('growth')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'growth' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <TrendingUp className="w-4 h-4" /> Quanto terei?
        </button>
        <button
          onClick={() => setMode('goal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'goal' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Target className="w-4 h-4" /> Quanto investir?
        </button>
        {goals.length > 0 && (
          <button
            onClick={() => setMode('goals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'goals' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Star className="w-4 h-4" /> Minhas Metas
          </button>
        )}
      </div>

      {/* ── GROWTH MODE ─────────────────────────────────────────────────────── */}
      {mode === 'growth' && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary-500" /> Parâmetros
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Valor inicial (R$)</label>
                <input type="number" min="0" step="100" value={initial} onChange={e => setInitial(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Aporte mensal (R$)</label>
                <input type="number" min="0" step="50" value={monthly} onChange={e => setMonthly(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Taxa de juros</label>
                <select value={selectedPreset} onChange={e => setSelectedPreset(e.target.value)} className={inputClass}>
                  {presetOptions.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
              {selectedPreset === 'custom' && (
                <div>
                  <label className={labelClass}>Taxa personalizada (% a.a.)</label>
                  <input type="number" min="0" step="0.1" value={customRate} onChange={e => setCustomRate(e.target.value)} placeholder="ex: 12,5" className={inputClass} />
                </div>
              )}
              <div>
                <label className={labelClass}>Período (anos)</label>
                <input type="number" min="1" max="50" value={years} onChange={e => setYears(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Result card */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400 font-medium">Total investido</p>
              <p className="text-xl font-bold text-gray-900 mt-1 financial-value">{formatCurrency(totalInvested)}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-400 font-medium">Rendimento</p>
              <p className="text-xl font-bold text-green-700 mt-1 financial-value">+{formatCurrency(totalYield)}</p>
              <p className="text-xs text-green-600">{totalInvested > 0 ? `+${((totalYield / totalInvested) * 100).toFixed(1)}%` : '—'}</p>
            </div>
            <div className="bg-primary-50 border border-primary-100 rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-400 font-medium">Valor final</p>
              <p className="text-xl font-bold text-primary-700 mt-1 financial-value">{formatCurrency(growthResult)}</p>
              <p className="text-xs text-primary-400">{growthRate.toFixed(2)}% a.a.</p>
            </div>
          </div>

          {/* Growth chart */}
          {growthYearly.length > 1 && (() => {
            const maxVal = growthYearly[growthYearly.length - 1].value
            const W = 480, H = 120, PAD = 8
            const pts = growthYearly.map((r, i) => {
              const x = PAD + (i / (growthYearly.length - 1)) * (W - PAD * 2)
              const y = H - PAD - ((r.value / maxVal) * (H - PAD * 2))
              return { x, y, ...r }
            })
            const investedPts = growthYearly.map((r, i) => {
              const x = PAD + (i / (growthYearly.length - 1)) * (W - PAD * 2)
              const y = H - PAD - ((r.invested / maxVal) * (H - PAD * 2))
              return `${x},${y}`
            }).join(' ')
            return (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Crescimento ao longo do tempo</h3>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={`${pts[0].x},${H - PAD} ${pts.map(p => `${p.x},${p.y}`).join(' ')} ${pts[pts.length - 1].x},${H - PAD}`}
                    fill="url(#grad)"
                  />
                  <polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
                  <polyline points={investedPts} fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 3" strokeLinejoin="round" />
                  {[pts[0], pts[Math.floor(pts.length / 2)], pts[pts.length - 1]].map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="3" fill="#6366f1" />
                      <text x={p.x} y={H} fontSize="9" fill="#9ca3af" textAnchor="middle">{p.year}a</text>
                    </g>
                  ))}
                </svg>
                <div className="flex gap-4 mt-1">
                  <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-3 h-0.5 bg-primary-500 inline-block rounded" />Total</span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-3 h-0.5 bg-gray-300 inline-block rounded border-dashed" />Aportado</span>
                </div>
              </div>
            )
          })()}

          {/* Yearly table */}
          {growthYearly.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h3 className="text-sm font-semibold text-gray-700">Evolução anual</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-50">
                      <th className="text-left px-4 py-2 font-medium">Ano</th>
                      <th className="text-right px-4 py-2 font-medium">Investido</th>
                      <th className="text-right px-4 py-2 font-medium">Rendimento</th>
                      <th className="text-right px-4 py-2 font-medium">Total</th>
                      <th className="px-4 py-2 w-32"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {growthYearly.map(row => {
                      const maxVal = growthYearly[growthYearly.length - 1].value
                      const barPct = maxVal > 0 ? (row.value / maxVal) * 100 : 0
                      const yieldPct = row.invested > 0 ? (row.yield / row.invested) * 100 : 0
                      return (
                        <tr key={row.year} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2 text-gray-600 font-medium">{row.year}º ano</td>
                          <td className="px-4 py-2 text-right text-gray-500 financial-value">{formatCurrency(row.invested)}</td>
                          <td className="px-4 py-2 text-right text-green-600 font-medium financial-value">+{formatCurrency(row.yield)} <span className="text-xs text-green-400">({yieldPct.toFixed(0)}%)</span></td>
                          <td className="px-4 py-2 text-right text-gray-900 font-bold financial-value">{formatCurrency(row.value)}</td>
                          <td className="px-4 py-2">
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary-400 rounded-full" style={{ width: `${barPct}%` }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── GOAL MODE ───────────────────────────────────────────────────────── */}
      {mode === 'goal' && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary-500" /> Parâmetros
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Objetivo (R$)</label>
                <input type="number" min="0" step="1000" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Já tenho (R$)</label>
                <input type="number" min="0" step="100" value={goalInitial} onChange={e => setGoalInitial(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Taxa de juros</label>
                <select value={goalPreset} onChange={e => setGoalPreset(e.target.value)} className={inputClass}>
                  {presetOptions.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
              {goalPreset === 'custom' && (
                <div>
                  <label className={labelClass}>Taxa personalizada (% a.a.)</label>
                  <input type="number" min="0" step="0.1" value={goalCustomRate} onChange={e => setGoalCustomRate(e.target.value)} placeholder="ex: 12,5" className={inputClass} />
                </div>
              )}
              <div>
                <label className={labelClass}>Em quantos anos</label>
                <input type="number" min="1" max="50" value={goalYears} onChange={e => setGoalYears(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-primary-50 border border-primary-100 rounded-xl shadow-sm p-4 col-span-1">
              <p className="text-xs text-gray-400 font-medium">Aporte mensal necessário</p>
              <p className="text-xl font-bold text-primary-700 mt-1 financial-value">{formatCurrency(goalMonthly)}</p>
              <p className="text-xs text-primary-400">{goalRate.toFixed(2)}% a.a.</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-400 font-medium">Total a investir</p>
              <p className="text-xl font-bold text-gray-900 mt-1 financial-value">{formatCurrency((parseFloat(goalInitial) || 0) + goalMonthly * (parseInt(goalYears) || 0) * 12)}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-400 font-medium">Rendimento estimado</p>
              <p className="text-xl font-bold text-green-700 mt-1 financial-value">
                {formatCurrency(Math.max(0, (parseFloat(goalTarget) || 0) - ((parseFloat(goalInitial) || 0) + goalMonthly * (parseInt(goalYears) || 0) * 12)))}
              </p>
            </div>
          </div>

          {/* Comparison table — different rates */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Comparativo por taxa</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-50">
                  <th className="text-left px-4 py-2 font-medium">Investimento</th>
                  <th className="text-right px-4 py-2 font-medium">Aporte/mês</th>
                  <th className="text-right px-4 py-2 font-medium">Total aportado</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Poupança', rate: 6.17 },
                  { name: `CDI 100%`, rate: cdiRate },
                  { name: `CDI 110%`, rate: cdiRate * 1.1 },
                  { name: `SELIC`, rate: selicRate },
                  { name: `IPCA + 5%`, rate: ipcaRate + 5 },
                  { name: `IPCA + 6%`, rate: ipcaRate + 6 },
                ].map(opt => {
                  const pmt = calcPMT(parseFloat(goalTarget) || 0, parseFloat(goalInitial) || 0, opt.rate, parseInt(goalYears) || 1)
                  const total = (parseFloat(goalInitial) || 0) + pmt * (parseInt(goalYears) || 0) * 12
                  const isSelected = Math.abs(opt.rate - goalRate) < 0.01
                  return (
                    <tr key={opt.name} className={`border-b border-gray-50 ${isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-4 py-2.5 text-gray-700">
                        {opt.name} <span className="text-xs text-gray-400">({opt.rate.toFixed(2)}%)</span>
                        {isSelected && <span className="ml-2 text-xs text-primary-600 font-medium">● selecionado</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-900 financial-value">{formatCurrency(pmt)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500 financial-value">{formatCurrency(total)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── GOALS MODE ──────────────────────────────────────────────────────── */}
      {mode === 'goals' && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary-500" /> Parâmetros
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Aporte mensal (R$)</label>
                <input type="number" min="0" step="50" value={goalsMonthly} onChange={e => setGoalsMonthly(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Taxa de juros</label>
                <select value={goalsPreset} onChange={e => setGoalsPreset(e.target.value)} className={inputClass}>
                  {presetOptions.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
              {goalsPreset === 'custom' && (
                <div>
                  <label className={labelClass}>Taxa personalizada (% a.a.)</label>
                  <input type="number" min="0" step="0.1" value={goalsCustomRate} onChange={e => setGoalsCustomRate(e.target.value)} placeholder="ex: 12,5" className={inputClass} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {goalsResults.map((g, i) => {
              const label = g.months === 0 ? 'Já atingida!' :
                g.months === Infinity ? 'Impossível sem aportes' :
                g.reachDate ? g.reachDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '—'
              const months = g.months === Infinity ? null : g.months
              const yearsN = months ? Math.floor(months / 12) : null
              const monthsR = months ? months % 12 : null
              const timeLabel = months === 0 ? '' :
                months === null ? '' :
                yearsN && yearsN > 0 ? `${yearsN}a ${monthsR}m` : `${months}m`
              const color = i === 0 ? 'border-green-200 bg-green-50' : i === 1 ? 'border-blue-100 bg-blue-50/50' : 'border-gray-100 bg-white'
              return (
                <div key={g.id} className={`rounded-xl border p-4 shadow-sm ${color}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{i + 1}</span>
                        <p className="font-semibold text-gray-900 truncate">{g.name}</p>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${g.progress}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatCurrency(g.current_amount)} de {formatCurrency(g.target_amount)} · {g.progress}% concluído
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {g.months === 0 ? (
                        <p className="text-sm font-bold text-green-600">✓ Concluída</p>
                      ) : g.months === Infinity ? (
                        <p className="text-sm text-gray-400">Sem aportes</p>
                      ) : (
                        <>
                          <p className="text-lg font-bold text-primary-700">{timeLabel}</p>
                          <p className="text-xs text-gray-400">{label}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {goalsResults.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
              Nenhuma meta ativa. Crie metas em <a href="/goals" className="text-primary-600 hover:underline">Metas</a>.
            </div>
          )}

          {goalsResults.filter(g => g.months !== Infinity && g.months > 0).length > 1 && (() => {
            const sorted = goalsResults.filter(g => g.months !== Infinity && g.months > 0)
            const maxMonths = sorted[sorted.length - 1].months
            return (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Linha do tempo</h3>
                <div className="space-y-3">
                  {sorted.map((g, i) => (
                    <div key={g.id} className="flex items-center gap-3">
                      <div className="w-28 text-xs text-gray-500 truncate shrink-0">{g.name}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 relative">
                        <div
                          className="h-4 rounded-full bg-primary-400 flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(8, (g.months / maxMonths) * 100)}%` }}
                        >
                          <span className="text-white text-xs font-medium whitespace-nowrap">{g.months < 12 ? `${g.months}m` : `${Math.floor(g.months/12)}a`}</span>
                        </div>
                      </div>
                      <div className="w-20 text-xs text-gray-400 text-right shrink-0">
                        {g.reachDate?.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center pb-4">
        Simulação com juros compostos mensais. Valores estimados — rentabilidade passada não garante resultados futuros.
        Taxas CDI/SELIC/IPCA via Banco Central do Brasil.
      </p>
    </div>
  )
}
