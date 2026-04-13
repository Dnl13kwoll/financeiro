import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id, couples(currency)')
    .eq('user_id', user!.id)
    .single()

  const memberData = memberRes.data as any
  const coupleId: string | null = memberData?.couple_id ?? null
  const currency: string = memberData?.couples?.currency ?? 'BRL'

  const balancesRes = coupleId ? await supabase.from('account_balances').select('*') : null
  const balances: any[] = balancesRes?.data ?? []
  const totalBalance = balances.reduce((acc, b) => acc + b.balance, 0)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const expensesRes = coupleId
    ? await supabase
        .from('transactions')
        .select('amount, category_id, categories(name)')
        .eq('couple_id', coupleId)
        .eq('type', 'expense')
        .gte('competence_date', monthStart)
        .is('deleted_at', null)
    : null

  const incomeRes = coupleId
    ? await supabase
        .from('transactions')
        .select('amount')
        .eq('couple_id', coupleId)
        .eq('type', 'income')
        .gte('competence_date', monthStart)
        .is('deleted_at', null)
    : null

  const budgetsRes = coupleId
    ? await supabase.from('budgets').select('amount').eq('couple_id', coupleId).eq('month', monthStart)
    : null

  const monthlyExpenses: any[] = expensesRes?.data ?? []
  const monthlyIncome: any[] = incomeRes?.data ?? []
  const totalExpenses = monthlyExpenses.reduce((acc, t) => acc + t.amount, 0)
  const totalIncome = monthlyIncome.reduce((acc, t) => acc + t.amount, 0)
  const totalBudget = (budgetsRes?.data ?? []).reduce((acc: number, b: any) => acc + b.amount, 0)
  const available = totalBudget - totalExpenses

  // Gastos por categoria para mini-gráfico
  const catMap = new Map<string, number>()
  monthlyExpenses.forEach(t => {
    const name = (t.categories as any)?.name ?? 'Outros'
    catMap.set(name, (catMap.get(name) ?? 0) + t.amount)
  })
  const catData = Array.from(catMap.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Alertas: parcelas vencendo nos próximos 7 dias
  const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const today = now.toISOString().slice(0, 10)

  const dueSoonRes = coupleId
    ? await (supabase.from('installment_items') as any)
        .select('id, due_date, amount, installments(description)')
        .eq('paid', false)
        .eq('canceled', false)
        .gte('due_date', today)
        .lte('due_date', next7)
    : null

  const recurringDueRes = coupleId
    ? await supabase
        .from('recurring_accounts')
        .select('id, name, day_due')
        .eq('couple_id', coupleId)
        .eq('active', true)
        .gte('day_due', now.getDate())
        .lte('day_due', now.getDate() + 7)
    : null

  const dueSoon: any[] = dueSoonRes?.data ?? []
  const recurringDue: any[] = recurringDueRes?.data ?? []
  const hasAlerts = dueSoon.length > 0 || recurringDue.length > 0

  return (
    <div className="flex flex-col flex-1">
      <Header title="Dashboard" />

      <div className="p-4 md:p-6 space-y-6">
        {/* Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <SummaryCard title="Saldo Total" value={formatCurrency(totalBalance, currency)} description="Todas as contas" color="green" />
          <SummaryCard title="Gastos do Mês" value={formatCurrency(totalExpenses, currency)} description="Mês atual" color="red" />
          <SummaryCard title="Receitas" value={formatCurrency(totalIncome, currency)} description="Mês atual" color="blue" />
          <SummaryCard title="Disponível" value={formatCurrency(available, currency)} description="Orçamento − Gastos" color={available >= 0 ? 'green' : 'red'} />
        </div>

        {!coupleId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-yellow-800 font-medium">Você ainda não está vinculado a um casal.</p>
            <p className="text-yellow-600 text-sm mt-1">Acesse Configurações para criar ou aceitar um convite.</p>
          </div>
        )}

        {/* Alertas de vencimento */}
        {hasAlerts && (
          <section className="bg-orange-50 border border-orange-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-orange-800 text-sm">Vencimentos próximos (7 dias)</h3>
            </div>
            <div className="space-y-1.5">
              {dueSoon.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-orange-700">{(item.installments as any)?.description ?? 'Parcela'} · {formatDate(item.due_date)}</span>
                  <span className="font-medium text-orange-800">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              {recurringDue.map((rec: any) => (
                <div key={rec.id} className="flex justify-between text-sm">
                  <span className="text-orange-700">{rec.name} · dia {rec.day_due}</span>
                  <span className="font-medium text-orange-800">recorrente</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gastos por categoria */}
        {catData.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Gastos por categoria</h3>
            <div className="space-y-3">
              {catData.map(c => (
                <div key={c.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{c.name}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(c.total)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (c.total / totalExpenses) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Resumo receitas x despesas */}
        {coupleId && (totalIncome > 0 || totalExpenses > 0) && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Receitas vs Despesas</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-700">Receitas</span>
                  <span className="font-medium">{formatCurrency(totalIncome)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-green-400 h-3 rounded-full" style={{ width: `${totalIncome > 0 ? 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-600">Despesas</span>
                  <span className="font-medium">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-red-400 h-3 rounded-full"
                    style={{ width: `${totalIncome > 0 ? Math.min(100, (totalExpenses / totalIncome) * 100) : 100}%` }}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ title, value, description, color }: {
  title: string; value: string; description: string; color: 'green' | 'red' | 'blue'
}) {
  const colors = { green: 'text-green-700', red: 'text-red-700', blue: 'text-blue-700' }
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm">
      <p className="text-xs text-gray-500">{title}</p>
      <p className={`text-lg md:text-2xl font-bold mt-1 ${colors[color]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1 hidden sm:block">{description}</p>
    </div>
  )
}
