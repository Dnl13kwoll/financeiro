import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Dashboard' }
import { formatCurrency, formatDate } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'
import { PieChart } from '@/components/features/dashboard/pie-chart'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id, couples(currency, daily_limit)')
    .eq('user_id', user!.id)
    .single()

  const memberData = memberRes.data as any
  const coupleId: string | null = memberData?.couple_id ?? null
  const currency: string = memberData?.couples?.currency ?? 'BRL'
  const dailyLimit: number | null = memberData?.couples?.daily_limit ?? null

  const [balancesRes, alertAccountsRes] = await Promise.all([
    coupleId ? supabase.from('account_balances').select('*').eq('couple_id', coupleId) : Promise.resolve(null),
    coupleId ? supabase.from('accounts').select('id, name, min_balance_alert').eq('couple_id', coupleId).is('deleted_at', null).not('min_balance_alert', 'is', null) : Promise.resolve(null),
  ])
  const balances: any[] = balancesRes?.data ?? []
  const totalBalance = balances.reduce((acc, b) => acc + b.balance, 0)
  const balanceMap2 = new Map(balances.map((b) => [b.id, b.balance]))
  const lowBalanceAlerts: { name: string; balance: number; threshold: number }[] = (alertAccountsRes?.data ?? [])
    .filter((a: any) => (balanceMap2.get(a.id) ?? 0) < a.min_balance_alert)
    .map((a: any) => ({ name: a.name, balance: balanceMap2.get(a.id) ?? 0, threshold: a.min_balance_alert }))

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  // Gastos de hoje
  const todayExpensesRes = coupleId
    ? await supabase.from('transactions').select('amount').eq('couple_id', coupleId).eq('type', 'expense').eq('competence_date', todayStr).is('deleted_at', null)
    : null
  const todayExpenses = (todayExpensesRes?.data ?? []).reduce((s: number, t: any) => s + t.amount, 0)
  const dailyLimitExceeded = dailyLimit !== null && todayExpenses > dailyLimit

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

  // Average daily spend
  const daysElapsed = Math.max(1, now.getDate())
  const avgDailySpend = totalExpenses / daysElapsed
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const projectedExpense = avgDailySpend * daysInMonth

  const budgetSummaryRes = coupleId
    ? await supabase.from('budget_summary' as any).select('*').eq('couple_id', coupleId).eq('month', monthStart)
    : null
  const budgetSummary: any[] = budgetSummaryRes?.data ?? []
  const totalBudget = budgetSummary.reduce((acc: number, b: any) => acc + b.budgeted, 0)
  const budgetAlerts = budgetSummary.filter(b => b.budgeted > 0 && b.spent / b.budgeted >= 0.8)
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
    ? await supabase.from('recurring_accounts').select('id, name, day_due, amount').eq('couple_id', coupleId).eq('active', true).gte('day_due', now.getDate()).lte('day_due', now.getDate() + 7)
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

  // Últimas transações
  const recentTxRes = coupleId
    ? await supabase.from('transactions').select('id, description, amount, type, date, categories(name)').eq('couple_id', coupleId).is('deleted_at', null).order('date', { ascending: false }).limit(5)
    : null
  const recentTx: any[] = recentTxRes?.data ?? []

  // Metas ativas
  const goalsRes = coupleId
    ? await (supabase.from('goals') as any).select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
    : null
  const goals: any[] = (goalsRes?.data ?? []).filter((g: any) => g.current_amount < g.target_amount).slice(0, 3)

  // Evolução do saldo (back-calculated from current balance)
  const balanceHistory: number[] = []
  let runningBalance = totalBalance
  for (let i = history.length - 1; i >= 0; i--) {
    balanceHistory.unshift(runningBalance)
    runningBalance = runningBalance - history[i].income + history[i].expense
  }
  const maxBalanceAbs = Math.max(...balanceHistory.map(Math.abs), 1)

  const maxBar = Math.max(...history.map(h => Math.max(h.income, h.expense)), 1)

  // Taxa de economia (savings rate) dos últimos 3 meses
  const last3 = history.slice(-3)
  const avgIncome3 = last3.reduce((s, m) => s + m.income, 0) / 3
  const avgExpense3 = last3.reduce((s, m) => s + m.expense, 0) / 3
  const savingsRate = avgIncome3 > 0 ? Math.round(((avgIncome3 - avgExpense3) / avgIncome3) * 100) : null

  // Δ% comparação com mês anterior
  const prevMonth = history[history.length - 2]
  const deltaExpensePct = prevMonth && prevMonth.expense > 0
    ? Math.round(((totalExpenses - prevMonth.expense) / prevMonth.expense) * 100)
    : null
  const deltaIncomePct = prevMonth && prevMonth.income > 0
    ? Math.round(((totalIncome - prevMonth.income) / prevMonth.income) * 100)
    : null

  // Score financeiro 0-100
  const scoreSavings = savingsRate === null ? 0 : Math.min(40, Math.max(0, savingsRate) * 2) // 0-40 pts
  const budgetUsage = totalBudget > 0 ? totalExpenses / totalBudget : 0
  const scoreBudget = totalBudget > 0 ? Math.round(Math.max(0, (1 - Math.min(1, budgetUsage)) * 35)) : 0 // 0-35 pts
  const scoreGoals = goals.length > 0 ? 25 : 10 // 0-25 pts
  const financialScore = Math.min(100, Math.round(scoreSavings + scoreBudget + scoreGoals))
  const scoreLabel = financialScore >= 80 ? 'Excelente' : financialScore >= 60 ? 'Bom' : financialScore >= 40 ? 'Regular' : 'Atenção'
  const scoreColor = financialScore >= 80 ? '#22c55e' : financialScore >= 60 ? '#3b82f6' : financialScore >= 40 ? '#f59e0b' : '#ef4444'

  // Breakdown gastos por usuário
  const userExpensesRes = coupleId
    ? await supabase.from('transactions').select('user_id, amount, profiles(name, email)').eq('couple_id', coupleId).eq('type', 'expense').gte('competence_date', monthStart).lte('competence_date', monthEnd).is('deleted_at', null)
    : null
  const userExpMap = new Map<string, { name: string; total: number }>()
  ;(userExpensesRes?.data ?? []).forEach((t: any) => {
    const profile = t.profiles as any
    const name = profile?.name ?? profile?.email ?? 'Usuário'
    const existing = userExpMap.get(t.user_id) ?? { name, total: 0 }
    userExpMap.set(t.user_id, { name, total: existing.total + t.amount })
  })
  const userExpenses = Array.from(userExpMap.values()).sort((a, b) => b.total - a.total)

  return (
    <div className="flex flex-col flex-1">
      <Header title="Dashboard" />

      <div className="p-4 md:p-6 space-y-6 overflow-y-auto">
        {/* Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <SummaryCard title="Saldo Total" value={formatCurrency(totalBalance, currency)} description="Todas as contas" color="green" />
          <SummaryCard title="Gastos do Mês" value={formatCurrency(totalExpenses, currency)} description="vs. mês anterior" color="red" delta={deltaExpensePct} />
          <SummaryCard title="Receitas" value={formatCurrency(totalIncome, currency)} description="vs. mês anterior" color="blue" delta={deltaIncomePct} />
          <SummaryCard title="Disponível" value={formatCurrency(available, currency)} description="Orçamento − Gastos" color={available >= 0 ? 'green' : 'red'} />
          {todayExpenses > 0 && (
            <SummaryCard title="Gastos de Hoje" value={formatCurrency(todayExpenses, currency)} description={todayStr} color="red" />
          )}
          {totalExpenses > 0 && (
            <SummaryCard title="Média diária" value={formatCurrency(avgDailySpend, currency)} description={`Baseado em ${daysElapsed} dias`} color="red" />
          )}
          {totalExpenses > 0 && (
            <SummaryCard title="Projeção do mês" value={formatCurrency(projectedExpense, currency)} description={`Se manter o ritmo atual`} color={projectedExpense > totalIncome ? 'red' : 'green'} />
          )}
          {/* Score financeiro */}
          {coupleId && (
            <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor} strokeWidth="3"
                    strokeDasharray={`${financialScore} 100`} strokeLinecap="round" />
                </svg>
                <span className="absolute text-xs font-bold text-gray-700">{financialScore}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Score financeiro</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: scoreColor }}>{scoreLabel}</p>
                <p className="text-xs text-gray-400">poupança · orçamento · metas</p>
              </div>
            </div>
          )}
          {/* Breakdown por usuário */}
          {userExpenses.length > 1 && (
            <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-2">Gastos por pessoa — mês atual</p>
              {userExpenses.map(u => (
                <div key={u.name} className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{u.name}</span>
                    <span className="font-medium text-red-600 financial-value">{formatCurrency(u.total, currency)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, (u.total / totalExpenses) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {savingsRate !== null && (
            <div className="col-span-2 lg:col-span-4">
              <div className={`rounded-xl border p-4 flex items-center gap-4 ${savingsRate >= 20 ? 'bg-green-50 border-green-100' : savingsRate >= 0 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500">Taxa de poupança (média 3 meses)</p>
                  <p className={`text-2xl font-bold mt-0.5 ${savingsRate >= 20 ? 'text-green-700' : savingsRate >= 0 ? 'text-amber-700' : 'text-red-700'}`}>
                    {savingsRate}%
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {savingsRate >= 20 ? 'Excelente! Continue assim.' : savingsRate >= 10 ? 'Bom, mas há espaço para melhorar.' : savingsRate >= 0 ? 'Atenção: poupança baixa.' : 'Gastos maiores que receitas!'}
                  </p>
                </div>
                <div className="w-24 h-24 relative flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={savingsRate >= 20 ? '#22c55e' : savingsRate >= 0 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="3"
                      strokeDasharray={`${Math.min(100, Math.max(0, savingsRate))} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold text-gray-700">{savingsRate}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {!coupleId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-yellow-800 font-medium">Você ainda não está vinculado a um casal.</p>
            <p className="text-yellow-600 text-sm mt-1 mb-4">Configure tudo em poucos passos.</p>
            <a
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Começar configuração
            </a>
          </div>
        )}

        {/* Alertas de orçamento por categoria */}
        {budgetAlerts.length > 0 && (
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-amber-800 text-sm">Orçamento — atenção</h3>
            </div>
            <div className="space-y-2">
              {budgetAlerts.map((b: any) => {
                const pct = Math.round((b.spent / b.budgeted) * 100)
                const over = b.spent > b.budgeted
                return (
                  <div key={b.category_id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-amber-700">{b.category_name}</span>
                      <span className={`font-medium ${over ? 'text-red-600' : 'text-amber-700'}`}>
                        {pct}% {over ? '— excedido' : 'usado'}
                      </span>
                    </div>
                    <div className="w-full bg-amber-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${over ? 'bg-red-500' : 'bg-amber-400'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Alerta de limite diário */}
        {dailyLimitExceeded && (
          <section className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
              <p className="text-sm text-orange-800">
                <span className="font-semibold">Limite diário ultrapassado!</span>{' '}
                Você gastou {formatCurrency(todayExpenses, currency)} hoje (limite: {formatCurrency(dailyLimit!, currency)}).
              </p>
            </div>
          </section>
        )}

        {/* Alertas de saldo baixo */}
        {lowBalanceAlerts.length > 0 && (
          <section className="bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-red-800 text-sm">Saldo baixo</h3>
            </div>
            <div className="space-y-1.5">
              {lowBalanceAlerts.map((a) => (
                <div key={a.name} className="flex justify-between text-sm">
                  <span className="text-red-700">{a.name}</span>
                  <span className="font-medium text-red-800">
                    {formatCurrency(a.balance)} <span className="text-red-400 font-normal">(mín. {formatCurrency(a.threshold)})</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Saldo por conta */}
        {balances.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Saldo por conta</h3>
              <a href="/accounts" className="text-xs text-primary-600 hover:underline">Ver contas</a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {balances.map((b: any) => (
                <a key={b.id} href={`/accounts/${b.id}`} className="border border-gray-100 rounded-lg p-3 hover:border-primary-200 hover:bg-primary-50/30 transition-colors block">
                  <p className="text-xs text-gray-400 truncate">{b.name}</p>
                  <p className={`text-base font-bold mt-0.5 financial-value ${b.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {formatCurrency(b.balance, currency)}
                  </p>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">
                    {b.type === 'checking' ? 'Corrente' : b.type === 'savings' ? 'Poupança' : b.type === 'investment' ? 'Investimento' : b.type}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Metas ativas */}
        {goals.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Metas em andamento</h3>
              <a href="/goals" className="text-xs text-primary-600 hover:underline">Ver todas</a>
            </div>
            <div className="space-y-4">
              {goals.map((goal: any) => {
                const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
                const nearComplete = progress >= 90
                return (
                  <div key={goal.id} className={nearComplete ? 'p-3 rounded-lg border border-green-200 bg-green-50' : ''}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`font-medium ${nearComplete ? 'text-green-800' : 'text-gray-700'}`}>
                        {goal.name}
                        {nearComplete && <span className="ml-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">Quase lá!</span>}
                      </span>
                      <span className={`financial-value ${nearComplete ? 'text-green-700' : 'text-gray-400'}`}>
                        {formatCurrency(goal.current_amount, currency)} / {formatCurrency(goal.target_amount, currency)}
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-2 ${nearComplete ? 'bg-green-200' : 'bg-gray-100'}`}>
                      <div
                        className={`h-2 rounded-full transition-all ${nearComplete ? 'bg-green-500' : 'bg-primary-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className={`text-xs mt-0.5 ${nearComplete ? 'text-green-600 font-medium' : 'text-gray-400'}`}>{progress}% concluído</p>
                  </div>
                )
              })}
            </div>
          </section>
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
                  <span className="font-medium text-orange-800 financial-value">
                    {rec.amount ? formatCurrency(rec.amount) : <span className="text-orange-500 text-xs">recorrente</span>}
                  </span>
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

        {/* Evolução do saldo */}
        {coupleId && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-5">Evolução do saldo</h3>
            <div className="relative" style={{ height: '80px' }}>
              <svg viewBox={`0 0 ${(history.length - 1) * 60} 80`} preserveAspectRatio="none" className="w-full h-full">
                <polyline
                  points={balanceHistory.map((b, i) => {
                    const x = i * 60
                    const y = 80 - ((b + maxBalanceAbs) / (2 * maxBalanceAbs)) * 76 + 2
                    return `${x},${y}`
                  }).join(' ')}
                  fill="none"
                  stroke="var(--color-primary-600)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {balanceHistory.map((b, i) => {
                  const x = i * 60
                  const y = 80 - ((b + maxBalanceAbs) / (2 * maxBalanceAbs)) * 76 + 2
                  return <circle key={i} cx={x} cy={y} r="3" fill="var(--color-primary-600)" />
                })}
              </svg>
            </div>
            <div className="flex justify-between mt-2">
              {history.map((m, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-xs text-gray-400 capitalize">{m.label}</span>
                  <span className={`text-xs font-medium financial-value ${balanceHistory[i] >= 0 ? 'text-gray-600' : 'text-red-500'}`}>
                    {formatCurrency(balanceHistory[i], currency)}
                  </span>
                </div>
              ))}
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

        {/* Últimas transações */}
        {recentTx.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Últimas transações</h3>
              <a href="/transactions" className="text-xs text-primary-600 hover:underline">Ver todas</a>
            </div>
            <div className="space-y-2">
              {recentTx.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-800 font-medium">{t.description ?? '—'}</p>
                    <p className="text-xs text-gray-400">
                      {(t.categories as any)?.name ?? 'Sem categoria'} · {formatDate(t.date)}
                    </p>
                  </div>
                  <span className={`font-semibold financial-value ${t.type === 'income' ? 'text-green-600' : t.type === 'expense' ? 'text-red-600' : 'text-blue-600'}`}>
                    {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}{formatCurrency(t.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
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

function SummaryCard({ title, value, description, color, delta }: {
  title: string; value: string; description: string; color: 'green' | 'red' | 'blue'; delta?: number | null
}) {
  const colors = { green: 'text-green-700', red: 'text-red-700', blue: 'text-blue-700' }
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm">
      <p className="text-xs text-gray-500">{title}</p>
      <p className={`text-lg md:text-2xl font-bold mt-1 financial-value ${colors[color]}`}>{value}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <p className="text-xs text-gray-400 hidden sm:block">{description}</p>
        {delta !== null && delta !== undefined && (
          <span className={`text-xs font-medium ${delta > 0 ? (color === 'blue' || color === 'green' ? 'text-green-600' : 'text-red-500') : 'text-green-600'}`}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  )
}
