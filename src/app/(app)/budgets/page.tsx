export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { NewBudgetButton } from '@/components/features/budgets/new-budget-button'
import { BudgetDeleteButton, BudgetEditButton } from '@/components/features/budgets/budget-actions'
import { CopyBudgetsButton } from '@/components/features/budgets/copy-budgets-button'
import { RolloverBudgetButton } from '@/components/features/budgets/rollover-budget-button'
import { SuggestBudgetsButton } from '@/components/features/budgets/suggest-budgets-button'
import { BudgetAlertNotifier } from '@/components/features/budgets/budget-alert-notifier'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTH_LABELS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const params = await searchParams
  const now = new Date()
  const monthParam = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [y, m] = monthParam.split('-').map(Number)
  const monthStart = new Date(y, m - 1, 1).toISOString().slice(0, 10)
  const monthEnd = new Date(y, m, 0).toISOString().slice(0, 10)
  const prevMonthDate = new Date(y, m - 2, 1)
  const prevMonthStart = prevMonthDate.toISOString().slice(0, 10)
  const nextMonthDate = new Date(y, m, 1)
  const prevNav = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`
  const nextNav = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`
  const monthLabel = `${MONTH_LABELS[m - 1]} ${y}`

  const budgetsRes = coupleId
    ? await supabase
        .from('budgets')
        .select('*, categories(name)')
        .eq('couple_id', coupleId)
        .eq('month', monthStart)
        .order('amount', { ascending: false })
    : null

  const expensesRes = coupleId
    ? await supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('couple_id', coupleId)
        .eq('type', 'expense')
        .gte('competence_date', monthStart)
        .lte('competence_date', monthEnd)
        .is('deleted_at', null)
    : null

  const categoriesRes = await supabase
    .from('categories')
    .select('id, name')
    .eq('type', 'expense')
    .order('name')

  const pageErrors = [budgetsRes?.error, expensesRes?.error, categoriesRes?.error].filter(Boolean)

  const budgets: any[] = budgetsRes?.data ?? []
  const expenses: any[] = expensesRes?.data ?? []
  const categories: { id: string; name: string }[] = (categoriesRes?.data ?? []) as any[]

  const expenseMap = new Map<string, number>()
  for (const e of expenses) {
    if (e.category_id) {
      expenseMap.set(e.category_id, (expenseMap.get(e.category_id) ?? 0) + e.amount)
    }
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + (expenseMap.get(b.category_id) ?? 0), 0)

  // Time-pacing: how far into the month are we?
  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth() + 1
  const daysInMonth = new Date(y, m, 0).getDate()
  const dayPct = isCurrentMonth ? Math.round((now.getDate() / daysInMonth) * 100) : null

  // Build alerts for categories at/above threshold
  const budgetAlerts = coupleId ? budgets
    .map(b => {
      const spent = expenseMap.get(b.category_id) ?? 0
      const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0
      const threshold = b.alert_threshold ?? 80
      return { category_id: b.category_id, category_name: (b.categories as any)?.name ?? '', percent, coupleId, threshold }
    })
    .filter(a => a.percent >= a.threshold) : []

  return (
    <div className="flex flex-col flex-1">
      <Header title="Orçamentos" />

      {budgetAlerts.length > 0 && coupleId && (
        <BudgetAlertNotifier alerts={budgetAlerts} />
      )}
      <div className="p-4 md:p-6 space-y-4">
        {pageErrors.length > 0 && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <strong>Erro ao carregar dados:</strong> {pageErrors.map((e: any) => e.message).join(' | ')}
          </div>
        )}
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/budgets?month=${prevNav}`} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="text-sm font-semibold text-gray-700 w-36 text-center">{monthLabel}</span>
            <Link href={`/budgets?month=${nextNav}`} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-2 flex-wrap">
            {coupleId && <SuggestBudgetsButton coupleId={coupleId} currentMonth={monthStart} />}
            {coupleId && <RolloverBudgetButton coupleId={coupleId} currentMonth={monthStart} prevMonth={prevMonthStart} />}
            {coupleId && <CopyBudgetsButton coupleId={coupleId} currentMonth={monthStart} />}
            {coupleId && <NewBudgetButton coupleId={coupleId} categories={categories} />}
          </div>
        </div>

        {budgets.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">Total orçado</p>
              <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totalBudget)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">Total gasto</p>
              <p className={`text-xl font-bold mt-1 ${totalSpent > totalBudget ? 'text-red-600' : 'text-gray-900'}`}>
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </div>
        )}

        {budgets.map((budget) => {
          const spent = expenseMap.get(budget.category_id) ?? 0
          const percent = Math.min(Math.round((spent / budget.amount) * 100), 100)
          const over = spent > budget.amount
          const categoryName = (budget.categories as { name?: string } | null)?.name ?? 'Sem categoria'

          // Previsão de estouro
          const daysElapsed = now.getDate()
          const dailyRate = isCurrentMonth && daysElapsed > 0 ? spent / daysElapsed : 0
          const remainingBudget = budget.amount - spent
          const daysUntilBust = dailyRate > 0 ? Math.floor(remainingBudget / dailyRate) : null
          const daysRemaining = daysInMonth - daysElapsed
          const willBust = isCurrentMonth && !over && daysUntilBust !== null && daysUntilBust < daysRemaining

          return (
            <div key={budget.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex justify-between mb-2">
                <a
                  href={`/transactions?category_id=${budget.category_id}&month=${monthParam}`}
                  className="font-medium text-gray-900 hover:text-primary-600 transition-colors"
                  title="Ver transações desta categoria"
                >
                  {categoryName}
                </a>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${over ? 'text-red-600' : 'text-gray-700'}`}>
                    {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                  </p>
                  <BudgetEditButton id={budget.id} currentAmount={budget.amount} currentThreshold={budget.alert_threshold ?? 80} />
                  <BudgetDeleteButton id={budget.id} />
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    over ? 'bg-red-500' : percent >= 80 ? 'bg-yellow-400' : 'bg-primary-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-400">
                  {over
                    ? `Estourado em ${formatCurrency(spent - budget.amount)}`
                    : `${formatCurrency(budget.amount - spent)} disponível`}
                </p>
                <div className="flex flex-col items-end gap-0.5">
                  {dayPct !== null && !over && percent > dayPct + 10 && (
                    <p className="text-xs text-amber-600 font-medium">
                      ⚡ Dia {now.getDate()} = {dayPct}% do mês, você usou {percent}%
                    </p>
                  )}
                  {willBust && (
                    <p className="text-xs text-orange-500 font-medium">
                      🔥 Vai estourar em ~{daysUntilBust} dia{daysUntilBust !== 1 ? 's' : ''} no ritmo atual
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {budgets.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            {coupleId ? 'Nenhum orçamento para este mês.' : 'Crie um casal em Configurações para começar.'}
          </div>
        )}
      </div>
    </div>
  )
}
