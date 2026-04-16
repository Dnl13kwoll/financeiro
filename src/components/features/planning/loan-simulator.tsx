'use client'
import { useState, useMemo } from 'react'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function calcPMT(pv: number, rate: number, n: number): number {
  if (rate === 0) return pv / n
  return (pv * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1)
}

export function LoanSimulator() {
  const [principal, setPrincipal] = useState(10000)
  const [rate, setRate] = useState(1.5) // monthly %
  const [term, setTerm] = useState(24) // months

  const pmt = useMemo(() => {
    if (principal <= 0 || term <= 0) return 0
    return calcPMT(principal, rate / 100, term)
  }, [principal, rate, term])

  const totalPaid = pmt * term
  const totalInterest = totalPaid - principal
  const effectiveAnnualRate = (Math.pow(1 + rate / 100, 12) - 1) * 100

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
      <h3 className="font-semibold text-gray-900">Simulador de Financiamento</h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Valor financiado</label>
          <input type="number" value={principal} min={0} step={1000}
            onChange={e => setPrincipal(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Taxa mensal (%)</label>
          <input type="number" value={rate} min={0} step={0.1}
            onChange={e => setRate(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Prazo (meses)</label>
          <input type="number" value={term} min={1} max={360}
            onChange={e => setTerm(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      {pmt > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-primary-50 rounded-lg p-3">
            <p className="text-xs text-primary-600">Parcela mensal</p>
            <p className="text-lg font-bold text-primary-700 mt-0.5">{fmt(pmt)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Total pago</p>
            <p className="text-lg font-bold text-gray-800 mt-0.5">{fmt(totalPaid)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-xs text-red-500">Total de juros</p>
            <p className="text-lg font-bold text-red-600 mt-0.5">{fmt(totalInterest)}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-xs text-amber-600">Taxa anual efetiva</p>
            <p className="text-lg font-bold text-amber-700 mt-0.5">{effectiveAnnualRate.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {pmt > 0 && (
        <p className="text-xs text-gray-400">
          Os juros representam {Math.round((totalInterest / principal) * 100)}% do valor financiado.
          {totalInterest > principal && ' Você pagará mais do que o dobro do valor original!'}
        </p>
      )}
    </div>
  )
}
