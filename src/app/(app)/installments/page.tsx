import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Parcelamentos' }
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { NewInstallmentButton } from '@/components/features/installments/new-installment-button'
import { InstallmentActions } from '@/components/features/installments/installment-actions'
import { InstallmentItemToggle } from '@/components/features/installments/installment-item-toggle'
import { InstallmentItemEdit } from '@/components/features/installments/installment-item-edit'
import { InstallmentItemCancel } from '@/components/features/installments/installment-item-cancel'
import { InstallmentItemReschedule } from '@/components/features/installments/installment-item-reschedule'
import { InstallmentCollapsible } from '@/components/features/installments/installment-collapsible'

export const dynamic = 'force-dynamic'

export default async function InstallmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const statusFilter = (await searchParams).status ?? 'active'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const [installmentsRes, accountsRes, categoriesRes] = await Promise.all([
    coupleId
      ? supabase.from('installments').select('*, installment_items(*)').eq('couple_id', coupleId).order('start_date', { ascending: false }).limit(200)
      : Promise.resolve(null),
    coupleId
      ? supabase.from('accounts').select('id, name').eq('couple_id', coupleId).is('deleted_at', null)
      : Promise.resolve(null),
    supabase.from('categories').select('id, name').eq('type', 'expense').order('name'),
  ])

  const pageErrors = [installmentsRes?.error, accountsRes?.error, categoriesRes?.error].filter(Boolean)

  const installments: any[] = installmentsRes?.data ?? []
  const accounts: { id: string; name: string }[] = (accountsRes?.data ?? []) as any[]
  const categories: { id: string; name: string }[] = (categoriesRes?.data ?? []) as any[]

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  // Summary across all active installments
  const activeInstallments = installments.filter(i => i.status === 'active')
  const totalDebt = activeInstallments.reduce((sum, inst) => {
    const items = (inst.installment_items ?? []) as any[]
    return sum + items.filter((i: any) => !i.paid && !i.canceled).reduce((s: number, i: any) => s + i.amount, 0)
  }, 0)
  const thisMonthDue = activeInstallments.reduce((sum, inst) => {
    const items = (inst.installment_items ?? []) as any[]
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)
    return sum + items.filter((i: any) => !i.paid && !i.canceled && i.due_date >= monthStart && i.due_date <= monthEnd)
      .reduce((s: number, i: any) => s + i.amount, 0)
  }, 0)
  const overdueTotal = activeInstallments.reduce((sum, inst) => {
    const items = (inst.installment_items ?? []) as any[]
    return sum + items.filter((i: any) => !i.paid && !i.canceled && i.due_date < todayStr)
      .reduce((s: number, i: any) => s + i.amount, 0)
  }, 0)

  const displayedInstallments = statusFilter === 'all'
    ? installments
    : installments.filter(i => i.status === statusFilter)

  // Gráfico fluxo futuro de parcelas — próximos 6 meses
  const futureFlow = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const mStart = d.toISOString().slice(0, 10)
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
    const label = d.toLocaleDateString('pt-BR', { month: 'short' })
    const total = activeInstallments.reduce((sum, inst) => {
      return sum + (inst.installment_items ?? []).filter((item: any) => !item.paid && !item.canceled && item.due_date >= mStart && item.due_date <= mEnd).reduce((s: number, item: any) => s + item.amount, 0)
    }, 0)
    return { label, total }
  })
  const maxFlow = Math.max(...futureFlow.map(f => f.total), 1)

  // Parcelas vencidas não pagas (lista detalhada)
  const overdueList = activeInstallments.flatMap(inst =>
    (inst.installment_items ?? [])
      .filter((i: any) => !i.paid && !i.canceled && i.due_date < todayStr)
      .map((i: any) => ({ description: inst.description, dueDate: i.due_date, amount: i.amount, partNum: i.part_number, totalParts: inst.total_parts }))
  ).sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  return (
    <div className="flex flex-col flex-1">
      <Header title="Parcelamentos" />

      <div className="p-4 md:p-6 space-y-4">
        {pageErrors.length > 0 && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <strong>Erro ao carregar dados:</strong> {pageErrors.map((e: any) => e.message).join(' | ')}
          </div>
        )}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Status filter tabs */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {([
              { value: 'active', label: 'Ativos' },
              { value: 'paid', label: 'Pagos' },
              { value: 'canceled', label: 'Cancelados' },
              { value: 'all', label: 'Todos' },
            ] as const).map(opt => (
              <a
                key={opt.value}
                href={`/installments?status=${opt.value}`}
                className={`px-3 py-1.5 transition-colors ${statusFilter === opt.value ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {opt.label}
              </a>
            ))}
          </div>
          {coupleId && <NewInstallmentButton coupleId={coupleId} userId={user!.id} accounts={accounts} categories={categories} />}
        </div>

        {/* Summary */}
        {activeInstallments.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">Dívida total</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(totalDebt)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">Vence este mês</p>
              <p className="text-lg font-bold text-blue-600 mt-1">{formatCurrency(thisMonthDue)}</p>
            </div>
            <div className={`rounded-xl border p-4 shadow-sm ${overdueTotal > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
              <p className="text-xs text-gray-500">Em atraso</p>
              <p className={`text-lg font-bold mt-1 ${overdueTotal > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatCurrency(overdueTotal)}</p>
            </div>
          </div>
        )}

        {/* Parcelas vencidas não pagas */}
        {overdueList.length > 0 && (
          <section className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-red-800 mb-2">⚠ Parcelas em atraso ({overdueList.length})</h3>
            <div className="space-y-1.5">
              {overdueList.map((o, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-red-700 font-medium">{o.description}</span>
                    <span className="text-red-400 text-xs ml-2">parcela {o.partNum}/{o.totalParts} · {formatDate(o.dueDate)}</span>
                  </div>
                  <span className="font-semibold text-red-700 financial-value">{formatCurrency(o.amount)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gráfico fluxo futuro */}
        {activeInstallments.length > 0 && futureFlow.some(f => f.total > 0) && (
          <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Parcelas nos próximos 6 meses</h3>
            <div className="flex items-end gap-2" style={{ height: '80px' }}>
              {futureFlow.map((f, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end" style={{ height: '60px' }}>
                    <div
                      className={`w-full rounded-t-sm ${i === 0 ? 'bg-blue-500' : 'bg-blue-300'}`}
                      style={{ height: `${(f.total / maxFlow) * 100}%`, minHeight: f.total > 0 ? '4px' : '0' }}
                      title={formatCurrency(f.total)}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{f.label}</span>
                  {f.total > 0 && <span className="text-xs font-medium text-blue-600 financial-value">{formatCurrency(f.total)}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {displayedInstallments.map((inst) => {
          const items = (inst.installment_items ?? []) as {
            id: string
            part_number: number
            amount: number
            due_date: string
            paid: boolean
            canceled: boolean
          }[]
          const paidCount = items.filter((i) => i.paid).length
          const progress = Math.round((paidCount / inst.total_parts) * 100)
          const overdueItems = items.filter(i => !i.paid && !i.canceled && i.due_date < todayStr)
          const nextDue = items.filter(i => !i.paid && !i.canceled && i.due_date >= todayStr).sort((a, b) => a.due_date.localeCompare(b.due_date))[0]

          return (
            <div key={inst.id} className={`bg-white rounded-xl border p-5 shadow-sm ${overdueItems.length > 0 && inst.status === 'active' ? 'border-red-200' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{inst.description}</p>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    <p className="text-sm text-gray-500">
                      {paidCount}/{inst.total_parts} parcelas · {formatCurrency(inst.total_amount)} total
                    </p>
                    {nextDue && inst.status === 'active' && (
                      <span className="text-xs text-blue-500">próxima: {formatDate(nextDue.due_date)}</span>
                    )}
                    {overdueItems.length > 0 && inst.status === 'active' && (
                      <span className="text-xs text-red-500 font-medium">{overdueItems.length} parcela(s) em atraso</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <InstallmentActions id={inst.id} status={inst.status} />
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    inst.status === 'paid' ? 'bg-green-100 text-green-700'
                    : inst.status === 'canceled' ? 'bg-gray-100 text-gray-500'
                    : overdueItems.length > 0 ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                  }`}>
                    {inst.status === 'paid' ? 'Pago' : inst.status === 'canceled' ? 'Cancelado' : overdueItems.length > 0 ? 'Em atraso' : 'Ativo'}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{progress}% pago</span>
                  <span>{formatCurrency(items.filter(i => !i.paid && !i.canceled).reduce((a, i) => a + i.amount, 0))} restantes</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${overdueItems.length > 0 && inst.status === 'active' ? 'bg-red-400' : 'bg-primary-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Lista de parcelas — collapsible */}
              <InstallmentCollapsible>
                {items.sort((a, b) => a.part_number - b.part_number).map(item => {
                  const isOverdue = !item.paid && !item.canceled && item.due_date < todayStr
                  return (
                    <div key={item.id} className={`group flex items-center justify-between text-sm ${item.canceled ? 'opacity-40' : ''} ${isOverdue ? 'bg-red-50 -mx-1 px-1 rounded' : ''}`}>
                      <div className="flex items-center gap-2">
                        <InstallmentItemToggle
                          itemId={item.id}
                          paid={item.paid}
                          amount={item.amount}
                          description={inst.description}
                          accounts={accounts}
                          defaultAccountId={inst.account_id}
                          userId={user!.id}
                          coupleId={coupleId!}
                        />
                        <span className={`${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          Parcela {item.part_number} · {formatDate(item.due_date)}
                          {isOverdue && ' ⚠️'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`font-medium ${item.paid ? 'text-green-600 line-through' : item.canceled ? 'text-gray-400 line-through' : isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                          {formatCurrency(item.amount)}
                        </span>
                        {!item.paid && !item.canceled && (
                          <InstallmentItemEdit
                            itemId={item.id}
                            amount={item.amount}
                            partNumber={item.part_number}
                          />
                        )}
                        {!item.paid && !item.canceled && (
                          <InstallmentItemReschedule
                            itemId={item.id}
                            dueDate={item.due_date}
                            partNumber={item.part_number}
                          />
                        )}
                        {!item.paid && (
                          <InstallmentItemCancel
                            itemId={item.id}
                            canceled={item.canceled}
                            partNumber={item.part_number}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </InstallmentCollapsible>
            </div>
          )
        })}

        {displayedInstallments.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            {coupleId ? `Nenhum parcelamento ${statusFilter === 'all' ? 'cadastrado' : statusFilter === 'paid' ? 'pago' : statusFilter === 'canceled' ? 'cancelado' : 'ativo'}.` : 'Crie um casal em Configurações para começar.'}
          </div>
        )}
      </div>
    </div>
  )
}
