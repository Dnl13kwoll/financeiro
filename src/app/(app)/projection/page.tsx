export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

function monthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default async function ProjectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const now = new Date()

  // Last 3 months date range for historical averages
  const histStart = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().slice(0, 10)
  const histEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)

  const [transactionsRes, recurringRes] = await Promise.all([
    coupleId
      ? supabase
          .from('transactions')
          .select('type, amount, competence_date')
          .eq('couple_id', coupleId)
          .gte('competence_date', histStart)
          .lte('competence_date', histEnd)
          .is('deleted_at', null)
          .neq('type', 'transfer')
      : Promise.resolve(null),
    coupleId
      ? supabase
          .from('recurring_accounts')
          .select('*')
          .eq('couple_id', coupleId)
          .eq('active', true)
      : Promise.resolve(null),
  ])

  const transactions: any[] = transactionsRes?.data ?? []
  const recurring: any[] = recurringRes?.data ?? []

  // Compute monthly income and expense for last 3 months
  type MonthData = { income: number; expense: number }
  const monthlyData = new Map<string, MonthData>()

  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyData.set(key, { income: 0, expense: 0 })
  }

  for (const t of transactions) {
    const key = (t.competence_date as string).slice(0, 7)
    if (!monthlyData.has(key)) continue
    const m = monthlyData.get(key)!
    if (t.type === 'income') m.income += Number(t.amount)
    else if (t.type === 'expense') m.expense += Number(t.amount)
  }

  const months = Array.from(monthlyData.values())
  const avgIncome = months.length > 0 ? months.reduce((s, m) => s + m.income, 0) / months.length : 0
  const avgExpense = months.length > 0 ? months.reduce((s, m) => s + m.expense, 0) / months.length : 0

  // Fixed recurring monthly cost
  const recurringFixed = recurring
    .filter((r) => r.amount != null)
    .reduce((s: number, r: any) => s + Number(r.amount), 0)

  const recurringVariableCount = recurring.filter((r) => r.amount == null).length

  // Project next 3 months
  type ProjectedMonth = {
    year: number
    month: number
    label: string
    projectedIncome: number
    projectedExpense: number
    projectedBalance: number
  }

  const projections: ProjectedMonth[] = []

  for (let i = 1; i <= 3; i++) {
    const pYear = now.getMonth() + i > 11
      ? now.getFullYear() + Math.floor((now.getMonth() + i) / 12)
      : now.getFullYear()
    const pMonth = ((now.getMonth() + i) % 12) + 1

    const projectedExpense = recurringFixed + (avgExpense > recurringFixed ? avgExpense - recurringFixed : 0)
    const projectedIncome = avgIncome

    projections.push({
      year: pYear,
      month: pMonth,
      label: monthLabel(pYear, pMonth),
      projectedIncome,
      projectedExpense,
      projectedBalance: projectedIncome - projectedExpense,
    })
  }

  const maxBar = Math.max(...projections.flatMap(p => [p.projectedIncome, p.projectedExpense]), 1)

  return (
    <div className="flex flex-col flex-1">
      <Header title="Projeção Financeira" />

      <div className="p-4 md:p-6 space-y-6">
        {!coupleId ? (
          <div className="text-center py-16 text-gray-400">
            Crie um casal em Configurações para começar.
          </div>
        ) : (
          <>
            {/* Historical base */}
            <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-1">Base histórica (últimos 3 meses)</h3>
              <p className="text-xs text-gray-400 mb-4">Média usada como referência para a projeção</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Receita média</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(avgIncome)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Despesa média</p>
                  <p className="text-lg font-bold text-red-500">{formatCurrency(avgExpense)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Recorrentes fixas</p>
                  <p className="text-lg font-bold text-gray-700">{formatCurrency(recurringFixed)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Recorrentes variáveis</p>
                  <p className="text-lg font-bold text-gray-700">{recurringVariableCount} conta{recurringVariableCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </section>

            {/* Projected months */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projections.map((p) => {
                const positive = p.projectedBalance >= 0
                return (
                  <div key={`${p.year}-${p.month}`} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-sm font-semibold text-gray-900 capitalize mb-3">{p.label}</p>

                    {/* Bar chart */}
                    <div className="flex items-end gap-3 h-20 mb-4">
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div
                          className="w-full bg-green-400 rounded-t"
                          style={{ height: `${(p.projectedIncome / maxBar) * 72}px` }}
                        />
                        <span className="text-xs text-gray-400">Receita</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div
                          className="w-full bg-red-400 rounded-t"
                          style={{ height: `${(p.projectedExpense / maxBar) * 72}px` }}
                        />
                        <span className="text-xs text-gray-400">Despesa</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm border-t border-gray-50 pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Receita</span>
                        <span className="font-medium text-green-600">{formatCurrency(p.projectedIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Despesa</span>
                        <span className="font-medium text-red-500">{formatCurrency(p.projectedExpense)}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-50 pt-2">
                        <span className="text-gray-700 font-medium">Saldo</span>
                        <div className="flex items-center gap-1">
                          {positive
                            ? <TrendingUp className="w-4 h-4 text-green-500" />
                            : p.projectedBalance === 0
                            ? <Minus className="w-4 h-4 text-gray-400" />
                            : <TrendingDown className="w-4 h-4 text-red-500" />
                          }
                          <span className={`font-bold ${positive ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(p.projectedBalance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-gray-400 text-center">
              Projeção baseada na média dos últimos 3 meses + contas recorrentes fixas cadastradas. Valores estimados.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
