'use client'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

type MonthData = {
  month: string
  label: string
  planned: number
  spent: number
  income: number
}

export function AnnualPlanView({ year, months }: { year: number; months: MonthData[] }) {
  const totalPlanned = months.reduce((s, m) => s + m.planned, 0)
  const totalSpent = months.reduce((s, m) => s + m.spent, 0)
  const totalIncome = months.reduce((s, m) => s + m.income, 0)

  return (
    <div className="space-y-4">
      {/* Year summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Receita anual</p>
          <p className="text-lg font-bold text-green-600 mt-1">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Planejado</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(totalPlanned)}</p>
        </div>
        <div className={`rounded-xl border p-4 shadow-sm ${totalSpent > totalPlanned ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
          <p className="text-xs text-gray-500">Gasto real</p>
          <p className={`text-lg font-bold mt-1 ${totalSpent > totalPlanned ? 'text-red-600' : 'text-gray-900'}`}>{formatCurrency(totalSpent)}</p>
        </div>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {months.map(m => {
          const pct = m.planned > 0 ? Math.min(100, Math.round((m.spent / m.planned) * 100)) : 0
          const over = m.spent > m.planned && m.planned > 0
          return (
            <Link
              key={m.month}
              href={`/planning?month=${m.month.slice(0, 7)}`}
              className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-primary-200 hover:bg-primary-50 transition-colors block"
            >
              <p className="text-xs font-semibold text-gray-500 capitalize">{m.label}</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Planejado</span>
                  <span className="font-medium text-gray-700">{formatCurrency(m.planned)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Gasto</span>
                  <span className={`font-medium ${over ? 'text-red-600' : 'text-gray-700'}`}>{formatCurrency(m.spent)}</span>
                </div>
              </div>
              {m.planned > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${over ? 'bg-red-400' : 'bg-primary-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className={`text-[10px] mt-0.5 ${over ? 'text-red-500' : 'text-gray-400'}`}>{pct}%</p>
                </div>
              )}
              {m.planned === 0 && m.spent === 0 && (
                <p className="text-[10px] text-gray-300 mt-2">Sem plano</p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
