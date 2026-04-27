export const dynamic = 'force-dynamic'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { NewRecurringButton } from '@/components/features/recurring/new-recurring-button'
import { RecurringActions } from '@/components/features/recurring/recurring-actions'
import { RecurringToggle } from '@/components/features/recurring/recurring-toggle'
import { RecurringPauseToggle } from '@/components/features/recurring/recurring-pause-toggle'
import { GenerateRecurringButton } from '@/components/features/recurring/generate-recurring-button'
import { AutoGenerateRecurring } from '@/components/features/recurring/auto-generate-recurring'

export default async function RecurringPage() {
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
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

  const [recurringRes, accountsRes, categoriesRes] = await Promise.all([
    coupleId
      ? supabase.from('recurring_accounts').select('*, recurring_records(*), categories(name)').eq('couple_id', coupleId).eq('active', true).order('day_due')
      : Promise.resolve(null),
    coupleId
      ? supabase.from('accounts').select('id, name').eq('couple_id', coupleId).is('deleted_at', null)
      : Promise.resolve(null),
    supabase.from('categories').select('id, name').eq('type', 'expense').order('name'),
  ])

  const recurring: any[] = recurringRes?.data ?? []
  const accounts: { id: string; name: string }[] = (accountsRes?.data ?? []) as any[]
  const categories: { id: string; name: string }[] = (categoriesRes?.data ?? []) as any[]

  const active = recurring.filter(r => !r.paused)
  const paused = recurring.filter(r => r.paused)

  const getRecAmount = (rec: any) => {
    const records = (rec.recurring_records ?? []) as any[]
    const cur = records.find((r: any) => r.reference_month === currentMonth)
    return cur?.amount ?? rec.amount ?? 0
  }

  const totalMonth = active.reduce((sum, rec) => sum + getRecAmount(rec), 0)
  const paidMonth = active.reduce((sum, rec) => {
    const records = (rec.recurring_records ?? []) as any[]
    const cur = records.find((r: any) => r.reference_month === currentMonth)
    return sum + (cur?.paid ? getRecAmount(rec) : 0)
  }, 0)

  // Breakdown by type
  const totalExpenseMonth = active.filter(r => r.type === 'expense' || !r.type).reduce((sum, rec) => sum + getRecAmount(rec), 0)
  const totalIncomeMonth = active.filter(r => r.type === 'income').reduce((sum, rec) => sum + getRecAmount(rec), 0)

  // Custo anual estimado
  const annualCost = active.reduce((sum, rec) => sum + getRecAmount(rec) * 12, 0)

  // Agrupamento por categoria
  const categoryGroupMap = new Map<string, { name: string; total: number; count: number }>()
  active.forEach(rec => {
    const catName = (rec.categories as any)?.name ?? 'Sem categoria'
    const existing = categoryGroupMap.get(catName) ?? { name: catName, total: 0, count: 0 }
    categoryGroupMap.set(catName, { ...existing, total: existing.total + getRecAmount(rec), count: existing.count + 1 })
  })
  const categoryGroups = Array.from(categoryGroupMap.values()).sort((a, b) => b.total - a.total)

  return (
    <div className="flex flex-col flex-1">
      <Header title="Recorrentes" />

      {coupleId && <AutoGenerateRecurring coupleId={coupleId} userId={user!.id} currentMonth={currentMonth} />}
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex gap-2 justify-end">
          {coupleId && <GenerateRecurringButton coupleId={coupleId} userId={user!.id} currentMonth={currentMonth} />}
          {coupleId && <NewRecurringButton coupleId={coupleId} userId={user!.id} categories={categories} accounts={accounts} />}
        </div>

        {active.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">Total despesas</p>
              <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalExpenseMonth)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">Total receitas</p>
              <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(totalIncomeMonth)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">Total do mês</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalMonth)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">Já pago</p>
              <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(paidMonth)}</p>
            </div>
          </div>
        )}

        {/* Custo anual estimado */}
        {active.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">Custo anual estimado</p>
              <p className="text-xl font-bold text-blue-800 mt-0.5">{formatCurrency(annualCost)}</p>
            </div>
            <p className="text-xs text-blue-400">{active.length} recorrente{active.length !== 1 ? 's' : ''} ativa{active.length !== 1 ? 's' : ''}</p>
          </div>
        )}

        {/* Agrupamento por categoria */}
        {categoryGroups.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Por categoria</h3>
            <div className="space-y-2">
              {categoryGroups.map(g => (
                <div key={g.name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{g.name} <span className="text-gray-400 text-xs">({g.count})</span></span>
                  <span className="font-medium text-gray-800">{formatCurrency(g.total)}<span className="text-gray-400 text-xs font-normal">/mês</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {active.map((rec) => {
          const records = (rec.recurring_records ?? []) as any[]
          const currentRecord = records.find((r: any) => r.reference_month === currentMonth)

          // Last 3 months history
          const history = [-2, -1, 0].map(offset => {
            const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
            const key = d.toISOString().slice(0, 10)
            const label = d.toLocaleDateString('pt-BR', { month: 'short' })
            const rec2 = records.find((r: any) => r.reference_month === key)
            return { label, paid: rec2?.paid ?? false, amount: rec2?.amount ?? rec.amount ?? null }
          })

          return (
            <div key={rec.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RecurringToggle
                    recurringId={rec.id}
                    referenceMonth={currentMonth}
                    recordId={currentRecord?.id}
                    paid={currentRecord?.paid ?? false}
                    amount={currentRecord?.amount}
                    defaultAmount={rec.amount}
                    accounts={accounts}
                    userId={user!.id}
                    coupleId={coupleId!}
                    name={rec.name}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{rec.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-gray-400">
                        Vence dia {rec.day_due}
                        {rec.amount ? ` · ${formatCurrency(rec.amount)}` : ''}
                        {(rec.categories as any)?.name ? ` · ${(rec.categories as any).name}` : ''}
                        {rec.end_date ? ` · até ${new Date(rec.end_date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}` : ''}
                      </p>
                      <a
                        href={`/transactions?q=${encodeURIComponent(rec.name)}`}
                        className="text-xs text-primary-500 hover:underline"
                        title="Ver transações relacionadas"
                      >
                        transações →
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* 3-month mini history */}
                  <div className="hidden sm:flex items-center gap-1">
                    {history.map((h, i) => (
                      <div key={i} className="flex flex-col items-center" title={`${h.label}: ${h.paid ? 'pago' : 'pendente'}`}>
                        <div className={`w-2 h-2 rounded-full ${h.paid ? 'bg-green-400' : 'bg-gray-200'}`} />
                        <span className="text-xs text-gray-300">{h.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {currentRecord ? formatCurrency(currentRecord.amount) : rec.amount ? formatCurrency(rec.amount) : '—'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {currentRecord?.paid ? 'Pago' : 'Pendente'}
                    </p>
                  </div>
                  <RecurringPauseToggle id={rec.id} paused={false} name={rec.name} />
                  <RecurringActions recurring={{ id: rec.id, name: rec.name, day_due: rec.day_due, amount: rec.amount, account_id: rec.account_id, category_id: rec.category_id, type: rec.type }} accounts={accounts} categories={categories} />
                </div>
              </div>
            </div>
          )
        })}

        {/* Paused */}
        {paused.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2 px-1">Pausadas ({paused.length})</p>
            {paused.map((rec) => (
              <div key={rec.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4 shadow-sm opacity-60 flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-700">{rec.name}</p>
                  <p className="text-xs text-gray-400">
                    Vence dia {rec.day_due}
                    {rec.amount ? ` · ${formatCurrency(rec.amount)}` : ''}
                    {(rec.categories as any)?.name ? ` · ${(rec.categories as any).name}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <RecurringPauseToggle id={rec.id} paused={true} name={rec.name} />
                  <RecurringActions recurring={{ id: rec.id, name: rec.name, day_due: rec.day_due, amount: rec.amount, account_id: rec.account_id, category_id: rec.category_id, type: rec.type }} accounts={accounts} categories={categories} />
                </div>
              </div>
            ))}
          </div>
        )}

        {recurring.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            {coupleId ? 'Nenhuma conta recorrente cadastrada.' : 'Crie um casal em Configurações para começar.'}
          </div>
        )}
      </div>
    </div>
  )
}
