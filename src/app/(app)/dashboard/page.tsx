import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'
import { PieChart } from '@/components/features/dashboard/pie-chart'

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

  // Histórico 6 meses
  const history: { label: string; income: number; expense: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = d.toISOString().slice(0, 10)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

    if (coupleId) {
      const [expRes, incRes] = await Promise.all([
        supabase.from('transactions').select('amount').eq('couple_id', coupleId).eq('type', 'expense').gte('competence_date', start).lte('competence_date', end).is('deleted_at', null),
        supabase.from('transactions').select('amount').eq('couple_id', coupleId).eq('type', 'income').gte('competence_date', start).lte('competence_date', end).is('deleted_at', null),
      ])
      history.push({
        label,
        expense: (expRes.data ?? []).reduce((s: number, t: any) => s + t.amount, 0),
        income: (incRes.data ?? []).reduce((s: number, t: any) => s + t.amount, 0),
      })
    } else {
      history.push({ label, income: 0, expense: 0 })
    }
  }

  const currentMonth = history[history.length - 1]
  const totalExpenses = currentMonth?.expense ?? 0
  const totalIncome = currentMonth?.income ?? 0

  const budgetsRes = coupleId
    ? await supabase.from('budgets').select('amount').eq('couple_id', coupleId).eq('month', monthStart)
    : null
  const totalBudget = (budgetsRes?.data ?? []).reduce((acc: number, b: any) => acc + b.amount, 0)
  const available = totalBudget - totalExpenses

  // Gastos por categoria
  const expByCatRes = coupleId
    ? await supabase.from('transactions').select('amount, categories(name)').eq('couple_id', coupleId).eq('type', 'expense').gte('competence_date', monthStart).lte('competence_date', monthEnd).is('deleted_at', null)
    : null
  const catMap = new Map<string, number>()
  ;(expByCatRes?.data ?? []).forEach((t: any) => {
    const name = (t.categories as any)?.name ?? 'Outros'
    catMap.set(name, (catMap.get(name) ?? 0) + t.amount)
  })
  const catData = Array.from(catMap.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 5)

  // Alertas vencimento
  const today = now.toISOString().slice(0, 10)
  const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const dueSoonRes = coupleId
    ? await (supabase.from('installment_items') as any).select('id, due_date, amount, installments(description)').eq('paid', false).eq('canceled', false).gte('due_date', today).lte('due_date', next7)
    : null
  const recurringDueRes = coupleId
    ? await supabase.from('recurring_accounts').select('id, name, day_due').eq('couple_id', coupleId).eq('active', true).gte('day_due', now.getDate()).lte('day_due', now.getDate() + 7)
    : null

  const dueSoon: any[] = dueSoonRes?.data ?? []
  const recurringDue: any[] = recurringDueRes?.data ?? []
  const hasAlerts = dueSoon.length > 0 || recurringDue.length > 0

  // Previsão de saldo (30 dias)
  const pendingInstallmentsRes = coupleId
    ? await (supabase.from('installment_items') as any).select('amount').eq('paid', false).eq('canceled', false).gte('due_date', today).lte('due_date', next30)
    : null
  const pendingInstallmentsTotal: number = (pendingInstallmentsRes?.data ?? []).reduce((s: number, i: any) => s + i.amount, 0)

  const pendingRecurringRes = coupleId
    ? await supabase.from('recurring_accounts').select('id, day_due').eq('couple_id', coupleId).eq('active', true)
    : null
  const pendingRecurringTotal: number = (pendingRecurringRes?.data ?? []).reduce((s: number, r: any) => {
    const dueDay = r.day_due
    const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay)
    if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1)
    return dueDate <= new Date(next30) ? s + 0 : s // will be filled when records have amounts
  }, 0)

  const forecastBalance = totalBalance - pendingInstallmentsTotal - pendingRecurringTotal

  const maxBar = Math.max(...history.map(h => Math.max(h.income, h.expense)), 1)

  return (
    <div className="flex flex-col flex-1">
      <Header title="Dashboard" />

      <div className="p-4 md:p-6 space-y-6 overflow-y-auto">
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

        {/* Alertas */}
        {hasAlerts && (
          <section className="bg-orange-50 border border-orange-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-orange-800 text-sm">Vencimentos nos próximos 7 dias</h3>
            </div>
            <div className="space-y-1.5">
              {dueSoon.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-orange-700">{(item.installments as any)?.description ?? 'Parcela'} · {formatDate(item.due_date)}</span>
                  <span className="font-medium text-orange-800 financial-value">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              {recurringDue.map((rec: any) => (
                <div key={rec.id} className="flex justify-between text-sm">
                  <span className="text-orange-700">{rec.name} · dia {rec.day_due}</span>
                  <span className="text-orange-600 text-xs">recorrente</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Histórico 6 meses */}
        {coupleId && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-5">Histórico — últimos 6 meses</h3>
            <div className="flex items-end gap-3 h-36">
              {history.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 items-end" style={{ height: '100px' }}>
                    <div
                      className="flex-1 bg-green-400 rounded-t-sm transition-all"
                      style={{ height: `${(m.income / maxBar) * 100}%`, minHeight: m.income > 0 ? '3px' : '0' }}
                      title={`Receita: ${formatCurrency(m.income)}`}
                    />
                    <div
                      className="flex-1 bg-red-400 rounded-t-sm transition-all"
                      style={{ height: `${(m.expense / maxBar) * 100}%`, minHeight: m.expense > 0 ? '3px' : '0' }}
                      title={`Despesa: ${formatCurrency(m.expense)}`}
                    />
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{m.label}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" />Receitas</span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />Despesas</span>
            </div>
          </section>
        )}

        {/* Previsão de saldo 30 dias */}
        {coupleId && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Previsão de saldo — 30 dias</h3>
            <div className="flex items-end gap-6">
              <div>
                <p className="text-xs text-gray-500">Saldo atual</p>
                <p className="text-xl font-bold text-gray-900 financial-value">{formatCurrency(totalBalance, currency)}</p>
              </div>
              <div className="text-gray-400 text-lg pb-1">→</div>
              <div>
                <p className="text-xs text-gray-500">Estimado (descontando parcelas)</p>
                <p className={`text-xl font-bold financial-value ${forecastBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(forecastBalance, currency)}
                </p>
              </div>
            </div>
            {pendingInstallmentsTotal > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Parcelas pendentes nos próximos 30 dias: <span className="text-red-500 font-medium financial-value">{formatCurrency(pendingInstallmentsTotal, currency)}</span>
              </p>
            )}
          </section>
        )}

        {/* Gastos por categoria — pizza */}
        {catData.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Gastos por categoria</h3>
            <PieChart data={catData} />
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
      <p className={`text-lg md:text-2xl font-bold mt-1 financial-value ${colors[color]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1 hidden sm:block">{description}</p>
    </div>
  )
}
