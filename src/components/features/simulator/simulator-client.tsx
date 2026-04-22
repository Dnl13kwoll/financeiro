'use client'
import { useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Target, Calculator } from 'lucide-react'

type Props = { selicRate: number; cdiRate: number; ipcaRate: number }
type Mode = 'growth' | 'goal'
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

export function SimulatorClient({ selicRate, cdiRate, ipcaRate }: Props) {
  const [mode, setMode] = useState<Mode>('growth')

  // Growth mode inputs
  const [initial, setInitial] = useState('10000')
  const [monthly, setMonthly] = useState('500')
  const [customRate, setCustomRate] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('cdi100')
  const [years, setYears] = useState('10')

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
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
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

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center pb-4">
        Simulação com juros compostos mensais. Valores estimados — rentabilidade passada não garante resultados futuros.
        Taxas CDI/SELIC/IPCA via Banco Central do Brasil.
      </p>
    </div>
  )
}
