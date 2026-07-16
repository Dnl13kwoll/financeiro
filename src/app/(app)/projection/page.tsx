export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { PageTabs } from '@/components/ui/page-tabs'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { ProjectionClient } from '@/components/features/projection/projection-client'

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
  const histStart = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().slice(0, 10)
  const histEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)

  const [transactionsRes, recurringRes, goalsRes] = await Promise.all([
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
          .select('id, amount')
          .eq('couple_id', coupleId)
          .eq('active', true)
      : Promise.resolve(null),
    coupleId
      ? supabase.from('goals')
          .select('id, name, target_amount, current_amount, deadline')
          .eq('couple_id', coupleId)
          .order('deadline', { ascending: true })
      : Promise.resolve(null),
  ])

  const transactions: any[] = transactionsRes?.data ?? []
  const recurring: any[] = recurringRes?.data ?? []
  const goals: any[] = goalsRes?.data ?? []

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
  const monthlySavingsFromHistory = avgIncome - avgExpense

  const recurringFixed = recurring
    .filter((r) => r.amount != null)
    .reduce((s: number, r: any) => s + Number(r.amount), 0)
  const recurringVariableCount = recurring.filter((r) => r.amount == null).length

  return (
    <div className="flex flex-col flex-1">
      <Header title="Análise" />
      <PageTabs tabs={[
        { href: '/reports', label: 'Relatórios' },
        { href: '/insights', label: 'Insights' },
        { href: '/projection', label: 'Projeção' },
        { href: '/planning', label: 'Planejamento' },
        { href: '/networth', label: 'Patrimônio' },
        { href: '/timeline', label: 'Linha do Tempo' },
      ]} />

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
                  <p className="text-xs text-gray-500">Economia mensal</p>
                  <p className={`text-lg font-bold ${monthlySavingsFromHistory >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                    {formatCurrency(monthlySavingsFromHistory)}
                  </p>
                </div>
              </div>
            </section>

            <ProjectionClient
              avgIncome={avgIncome}
              avgExpense={avgExpense}
              recurringFixed={recurringFixed}
              recurringVariableCount={recurringVariableCount}
              goals={goals}
              monthlySavingsFromHistory={monthlySavingsFromHistory}
            />
          </>
        )}
      </div>
    </div>
  )
}
