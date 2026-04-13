'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Circle } from 'lucide-react'

export function InstallmentItemToggle({ itemId, paid }: { itemId: string; paid: boolean }) {
  const router = useRouter()

  async function toggle() {
    const supabase = createClient()
    await (supabase.from('installment_items') as any)
      .update({ paid: !paid })
      .eq('id', itemId)
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
