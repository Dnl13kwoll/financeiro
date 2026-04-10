import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export default async function BudgetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .single() as { data: { couple_id: string } | null }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10)

  const { data: budgets } = member
    ? await supabase
        .from('budgets')
        .select('*, categories(name)')
        .eq('couple_id', member.couple_id)
        .eq('month', monthStart)
        .order('amount', { ascending: false })
    : { data: [] as any[] }

  // Gastos por categoria no mês
  const { data: expenses } = member
    ? await supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('couple_id', member.couple_id)
        .eq('type', 'expense')
        .gte('competence_date', monthStart)
        .lte('competence_date', monthEnd)
        .is('deleted_at', null)
    : { data: [] as any[] }

  const expenseMap = new Map<string, number>()
  for (const e of expenses ?? []) {
    if (e.category_id) {
      expenseMap.set(e.category_id, (expenseMap.get(e.category_id) ?? 0) + e.amount)
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Orçamentos" />

      <div className="p-6 space-y-4">
        {(budgets ?? []).map((budget) => {
          const spent = expenseMap.get(budget.category_id) ?? 0
          const percent = Math.min(Math.round((spent / budget.amount) * 100), 100)
          const over = spent > budget.amount
          const categoryName =
            (budget.categories as { name?: string } | null)?.name ?? 'Sem categoria'

          return (
            <div
              key={budget.id}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"
            >
              <div className="flex justify-between mb-2">
                <p className="font-medium text-gray-900">{categoryName}</p>
                <p className={`text-sm font-semibold ${over ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                </p>
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

        {(!budgets || budgets.length === 0) && (
          <div className="text-center py-16 text-gray-400">
            Nenhum orçamento para este mês.
          </div>
        )}
      </div>
    </div>
  )
}
