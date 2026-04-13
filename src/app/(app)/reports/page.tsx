export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { ExportButtons } from '@/components/features/reports/export-buttons'
import { MonthFilter } from '@/components/features/reports/month-filter'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .single()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const now = new Date()
  const monthParam = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, month] = monthParam.split('-').map(Number)
  const monthStart = new Date(year, month - 1, 1).toISOString().slice(0, 10)
  const monthEnd = new Date(year, month, 0).toISOString().slice(0, 10)

  const transactionsRes = coupleId
    ? await supabase
        .from('transactions')
        .select('*, categories(name), accounts(name)')
        .eq('couple_id', coupleId)
        .gte('competence_date', monthStart)
        .lte('competence_date', monthEnd)
        .is('deleted_at', null)
        .order('date', { ascending: false })
    : null

  const transactions: any[] = transactionsRes?.data ?? []

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)

  const categoryMap = new Map<string, { name: string; total: number }>()
  transactions.filter(t => t.type === 'expense').forEach((t: any) => {
    const name = (t.categories as { name?: string } | null)?.name ?? 'Sem categoria'
    const existing = categoryMap.get(name) ?? { name, total: 0 }
    categoryMap.set(name, { ...existing, total: existing.total + t.amount })
  })
  const categorySummary = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total)

  const exportRows = transactions.map((t: any) => ({
    date: t.date,
    type: t.type === 'income' ? 'Entrada' : t.type === 'expense' ? 'Saída' : 'Transferência',
    description: t.description ?? '',
    category: (t.categories as { name?: string } | null)?.name ?? '',
    account: (t.accounts as { name?: string } | null)?.name ?? '',
    amount: t.amount,
  }))

  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const monthLabel = `${monthNames[month - 1]} ${year}`

  return (
    <div className="flex flex-col flex-1">
      <Header title="Relatórios" />

      <div className="p-6 space-y-6 max-w-3xl">
        {/* Filtro de mês */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Mês:</label>
            <MonthFilter value={monthParam} />
          </div>

          {coupleId && (
            <ExportButtons
              transactions={exportRows}
              categorySummary={categorySummary}
              month={monthLabel}
            />
          )}
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500">Receitas</p>
            <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500">Despesas</p>
            <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500">Saldo</p>
            <p className={`text-xl font-bold mt-1 ${totalIncome - totalExpense >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </p>
          </div>
        </div>

        {/* Por categoria */}
        {categorySummary.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Despesas por categoria</h3>
            <div className="space-y-3">
              {categorySummary.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{c.name}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(c.total)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (c.total / totalExpense) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!coupleId && (
          <div className="text-center py-16 text-gray-400">
            Crie um casal em Configurações para começar.
          </div>
        )}

        {coupleId && transactions.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            Nenhuma transação neste mês.
          </div>
        )}
      </div>
    </div>
  )
}
