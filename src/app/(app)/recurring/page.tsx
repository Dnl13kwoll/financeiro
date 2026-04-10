import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle2, Circle } from 'lucide-react'
import { NewRecurringButton } from '@/components/features/recurring/new-recurring-button'

export default async function RecurringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .single()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)

  const recurringRes = coupleId
    ? await supabase
        .from('recurring_accounts')
        .select(`*, recurring_records(*)`)
        .eq('couple_id', coupleId)
        .eq('active', true)
        .order('day_due')
    : null

  const recurring: any[] = recurringRes?.data ?? []

  return (
    <div className="flex flex-col flex-1">
      <Header title="Recorrentes" />

      <div className="p-6 space-y-3">
        <div className="flex justify-end">
          {coupleId && <NewRecurringButton coupleId={coupleId} userId={user!.id} />}
        </div>

        {recurring.map((rec) => {
          const records = (rec.recurring_records ?? []) as {
            reference_month: string
            amount: number
            paid: boolean
          }[]
          const currentRecord = records.find((r) => r.reference_month === currentMonth)

          return (
            <div
              key={rec.id}
              className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {currentRecord?.paid ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{rec.name}</p>
                  <p className="text-xs text-gray-400">Vence dia {rec.day_due}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {currentRecord ? formatCurrency(currentRecord.amount) : '—'}
                </p>
                <p className="text-xs text-gray-400">
                  {currentRecord?.paid ? 'Pago' : 'Pendente'}
                </p>
              </div>
            </div>
          )
        })}

        {recurring.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            {coupleId ? 'Nenhuma conta recorrente cadastrada.' : 'Crie um casal em Configurações para começar.'}
          </div>
        )}
      </div>
    </div>
  )
}
