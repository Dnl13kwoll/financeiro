import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { NewInstallmentButton } from '@/components/features/installments/new-installment-button'
import { InstallmentActions } from '@/components/features/installments/installment-actions'
import { InstallmentItemToggle } from '@/components/features/installments/installment-item-toggle'

export default async function InstallmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .single()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const installmentsRes = coupleId
    ? await supabase
        .from('installments')
        .select('*, installment_items(*)')
        .eq('couple_id', coupleId)
        .order('start_date', { ascending: false })
    : null

  const installments: any[] = installmentsRes?.data ?? []

  return (
    <div className="flex flex-col flex-1">
      <Header title="Parcelamentos" />

      <div className="p-4 md:p-6 space-y-4">
        <div className="flex justify-end">
          {coupleId && <NewInstallmentButton coupleId={coupleId} userId={user!.id} />}
        </div>

        {installments.map((inst) => {
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

          return (
            <div key={inst.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{inst.description}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {paidCount}/{inst.total_parts} parcelas ·{' '}
                    {formatCurrency(inst.total_amount)} total ·{' '}
                    início {formatDate(inst.start_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <InstallmentActions id={inst.id} status={inst.status} />
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    inst.status === 'paid' ? 'bg-green-100 text-green-700'
                    : inst.status === 'canceled' ? 'bg-gray-100 text-gray-500'
                    : 'bg-blue-100 text-blue-700'
                  }`}>
                    {inst.status === 'paid' ? 'Pago' : inst.status === 'canceled' ? 'Cancelado' : 'Ativo'}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{progress}% pago</span>
                  <span>{formatCurrency(items.filter(i => !i.paid && !i.canceled).reduce((a, i) => a + i.amount, 0))} restantes</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Lista de parcelas */}
              <div className="mt-4 border-t border-gray-50 pt-3 space-y-1.5">
                {items.sort((a, b) => a.part_number - b.part_number).map(item => (
                  <div key={item.id} className={`flex items-center justify-between text-sm ${item.canceled ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-2">
                      <InstallmentItemToggle itemId={item.id} paid={item.paid} />
                      <span className="text-gray-500">
                        Parcela {item.part_number} · {formatDate(item.due_date)}
                      </span>
                    </div>
                    <span className={`font-medium ${item.paid ? 'text-green-600 line-through' : 'text-gray-700'}`}>
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {installments.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            {coupleId ? 'Nenhum parcelamento cadastrado.' : 'Crie um casal em Configurações para começar.'}
          </div>
        )}
      </div>
    </div>
  )
}
