'use client'
import { useState } from 'react'

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function EmergencyFundCalculator({
  avgMonthlyExpense,
  currentBalance,
}: {
  avgMonthlyExpense: number
  currentBalance: number
}) {
  const [months, setMonths] = useState(6)
  const [balance, setBalance] = useState(Math.max(0, currentBalance))
  const [expense, setExpense] = useState(Math.round(avgMonthlyExpense))
  const [savingsPerMonth, setSavingsPerMonth] = useState(500)

  const target = expense * months
  const remaining = Math.max(0, target - balance)
  const progress = target > 0 ? Math.min(100, Math.round((balance / target) * 100)) : 0
  const monthsToGoal = savingsPerMonth > 0 ? Math.ceil(remaining / savingsPerMonth) : null

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
      <h3 className="font-semibold text-gray-900">Calculadora de Fundo de Emergência</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Despesas mensais</label>
          <input type="number" value={expense} min={0} step={100}
            onChange={e => setExpense(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Saldo atual</label>
          <input type="number" value={balance} min={0} step={100}
            onChange={e => setBalance(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Meses de reserva</label>
          <select value={months} onChange={e => setMonths(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value={3}>3 meses (mínimo)</option>
            <option value={6}>6 meses (recomendado)</option>
            <option value={12}>12 meses (seguro)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Poupança mensal</label>
          <input type="number" value={savingsPerMonth} min={0} step={50}
            onChange={e => setSavingsPerMonth(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Meta ({months} meses)</span>
          <span className="font-semibold text-gray-900">{fmt(target)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Já tenho</span>
          <span className="font-semibold text-primary-600">{fmt(balance)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Falta</span>
          <span className={`font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>{remaining > 0 ? fmt(remaining) : 'Meta atingida!'}</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{progress}% da meta</span>
          {monthsToGoal !== null && remaining > 0 && <span>~{monthsToGoal} meses para completar</span>}
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : progress >= 60 ? 'bg-primary-500' : 'bg-amber-400'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
