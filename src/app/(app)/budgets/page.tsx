import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { NewBudgetButton } from '@/components/features/budgets/new-budget-button'
import { BudgetDeleteButton } from '@/components/features/budgets/budget-actions'

export default async function BudgetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .single()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

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

  return (
    <div className="flex flex-col flex-1">
      <Header title="Orçamentos" />

      <div className="p-4 md:p-6 space-y-4">
        <div className="flex justify-end">
          {coupleId && <NewBudgetButton coupleId={coupleId} categories={categories} />}
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

          return (
            <div key={budget.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex justify-between mb-2">
                <p className="font-medium text-gray-900">{categoryName}</p>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${over ? 'text-red-600' : 'text-gray-700'}`}>
                    {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                  </p>
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
              <p className="text-xs text-gray-400 mt-1">
                {over
                  ? `Estourado em ${formatCurrency(spent - budget.amount)}`
                  : `${formatCurrency(budget.amount - spent)} disponível`}
              </p>
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
