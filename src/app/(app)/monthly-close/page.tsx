export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Fechamento Mensal' }
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { MonthlyCloseClient } from '@/components/features/monthly-close/monthly-close-client'
import { CheckCircle2, AlertTriangle, TrendingDown, TrendingUp, Coins, Target, PieChart } from 'lucide-react'

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default async function MonthlyClosePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members').select('couple_id')
    .eq('user_id', user!.id).limit(1).maybeSingle()
  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  // Previous month
  const now = new Date()
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const year = prevDate.getFullYear()
  const month = prevDate.getMonth() + 1
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEnd = new Date(year, month, 0).toISOString().slice(0, 10)

  if (!coupleId) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="Fechamento Mensal" />
        <div className="p-6 text-center text-gray-400 py-16">Crie um casal em Configurações para usar essa funcionalidade.</div>
      </div>
    )
  }

  // Transactions for prev month
  const { data: txsRaw } = await supabase
    .from('transactions')
    .select('type, amount, category_id, competence_date, description, categories(name)')
    .eq('couple_id', coupleId)
    .gte('competence_date', monthStart)
    .lte('competence_date', monthEnd)
    .is('deleted_at', null)
    .neq('type', 'transfer')

  const txList: { type: string; amount: number; category: string | null }[] =
    (txsRaw ?? []).map((t: any) => ({ ...t, category: (t.categories as any)?.name ?? null }))
  const income = txList.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = txList.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = income - expense
  const savingsRate = income > 0 ? (balance / income) * 100 : 0

  // Category breakdown
  const catMap: Record<string, number> = {}
  for (const t of txList.filter(t => t.type === 'expense')) {
    const cat = t.category || 'Outros'
    catMap[cat] = (catMap[cat] ?? 0) + Number(t.amount)
  }
  const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Budgets for prev month
  const { data: budgets, error: budgetsError } = await supabase.from('budgets')
    .select('id, category_id, amount, categories(name)')
    .eq('couple_id', coupleId)
    .eq('month', monthStart)

  const budgetList = (budgets ?? []).map((b: any) => ({
    ...b, category: (b.categories as any)?.name ?? b.category_id,
  }))

  // Compute budget spent
  const budgetsWithSpent = budgetList.map((b: any) => {
    const spent = txList
      .filter(t => t.type === 'expense' && t.category === b.category)
      .reduce((s, t) => s + Number(t.amount), 0)
    return { ...b, spent }
  })

  const budgetsExceeded = budgetsWithSpent.filter((b: any) => b.spent > b.amount)
  const budgetsOk = budgetsWithSpent.filter((b: any) => b.spent <= b.amount)

  // Goals
  const { data: goalsData, error: goalsError } = await supabase.from('goals')
    .select('id, name, current_amount, target_amount, deadline')
    .eq('couple_id', coupleId)

  const goals = (goalsData ?? []).filter((g: any) => g.current_amount < g.target_amount)

  // Installments due in month but unpaid
  const { data: unpaidInstallments } = await supabase.from('installment_items')
    .select('id, due_date, amount, installments(description, couple_id)')
    .eq('paid', false)
    .eq('canceled', false)
    .gte('due_date', monthStart)
    .lte('due_date', monthEnd)

  const unpaid = (unpaidInstallments ?? []).filter(
    (d: any) => (d.installments as any)?.couple_id === coupleId
  )

  return (
    <div className="flex flex-col flex-1">
      <Header title="Fechamento Mensal" />

      <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full">

        {(budgetsError || goalsError) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Alguns dados não puderam ser carregados. Tente recarregar a página.
          </div>
        )}

        {/* Month label */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 capitalize">{monthLabel(year, month)}</h2>
            <p className="text-sm text-gray-400">Resumo e checklist de fechamento</p>
          </div>
        </div>

        {/* ── Overview cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-medium">Receitas</p>
            <p className="text-lg font-bold text-green-700 mt-1 financial-value">{formatCurrency(income)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 font-medium">Despesas</p>
            <p className="text-lg font-bold text-red-600 mt-1 financial-value">{formatCurrency(expense)}</p>
          </div>
          <div className={`rounded-xl border shadow-sm p-4 ${balance >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <p className="text-xs text-gray-400 font-medium">Saldo</p>
            <p className={`text-lg font-bold mt-1 financial-value ${balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-400 font-medium">Taxa de poupança</p>
            <p className={`text-lg font-bold mt-1 ${savingsRate >= 20 ? 'text-green-700' : savingsRate >= 10 ? 'text-blue-700' : 'text-red-600'}`}>
              {savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* ── Checklist ──────────────────────────────────────────────────── */}
        <MonthlyCloseClient
          txCount={txList.length}
          balance={balance}
          savingsRate={savingsRate}
          budgetsExceeded={budgetsExceeded.length}
          budgetTotal={budgetList.length}
          unpaidCount={unpaid.length}
          goalsCount={goals.length}
          goals={goals}
          coupleId={coupleId}
          userId={user!.id}
          monthStart={monthStart}
        />

        {/* ── Top despesas ───────────────────────────────────────────────── */}
        {categories.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" /> Maiores despesas do mês
            </h3>
            <div className="space-y-2">
              {categories.map(([cat, amt]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{cat}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${expense > 0 ? (amt / expense) * 100 : 0}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 w-24 text-right financial-value">{formatCurrency(amt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Orçamentos ─────────────────────────────────────────────────── */}
        {budgetList.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary-400" /> Orçamentos do mês
            </h3>
            <div className="space-y-2">
              {budgetsExceeded.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Excedidos ({budgetsExceeded.length})
                  </p>
                  {budgetsExceeded.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between py-1.5 bg-red-50 rounded-lg px-3 mb-1">
                      <span className="text-sm text-gray-700">{b.category}</span>
                      <span className="text-sm font-semibold text-red-600 financial-value">
                        {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                        <span className="text-xs ml-1">(+{formatCurrency(b.spent - b.amount)})</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {budgetsOk.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between py-1 px-3">
                  <span className="text-sm text-gray-600">{b.category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full" style={{ width: `${b.amount > 0 ? Math.min(100, (b.spent / b.amount) * 100) : 0}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 financial-value">{formatCurrency(b.spent)}/{formatCurrency(b.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Parcelas não pagas ─────────────────────────────────────────── */}
        {unpaid.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Parcelas vencidas não pagas ({unpaid.length})
            </h3>
            <div className="space-y-1">
              {unpaid.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex justify-between text-sm bg-white rounded-lg px-3 py-2 border border-amber-100">
                  <span className="text-gray-700">{(p.installments as any)?.description ?? 'Parcela'}</span>
                  <span className="font-semibold text-gray-900 financial-value">{formatCurrency(p.amount)}</span>
                </div>
              ))}
              {unpaid.length > 5 && <p className="text-xs text-amber-600 px-3">+ {unpaid.length - 5} outras parcelas</p>}
            </div>
          </div>
        )}

        {/* ── Metas ──────────────────────────────────────────────────────── */}
        {goals.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-400" /> Metas em andamento
            </h3>
            <div className="space-y-2">
              {goals.slice(0, 5).map((g: any) => {
                const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{g.name}</span>
                      <span className="text-gray-400 financial-value">{formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
