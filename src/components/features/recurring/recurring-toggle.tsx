'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Circle } from 'lucide-react'

export function RecurringToggle({
  recurringId,
  referenceMonth,
  recordId,
  paid,
  amount,
}: {
  recurringId: string
  referenceMonth: string
  recordId?: string
  paid: boolean
  amount?: number
}) {
  const router = useRouter()

  async function toggle() {
    const supabase = createClient()
    if (recordId) {
      await (supabase.from('recurring_records') as any)
        .update({ paid: !paid })
        .eq('id', recordId)
    } else {
      const payload: any = {
        recurring_account_id: recurringId,
        reference_month: referenceMonth,
        amount: amount ?? 0,
        paid: true,
      }
      await (supabase.from('recurring_records') as any).insert(payload)
    }
    router.refresh()
  }

  return (
    <button onClick={toggle} className="transition-colors" title={paid ? 'Marcar como não pago' : 'Marcar como pago'}>
      {paid
        ? <CheckCircle2 className="w-5 h-5 text-green-500 hover:text-green-600" />
        : <Circle className="w-5 h-5 text-gray-300 hover:text-green-400" />
      }
    </button>
  )
}
