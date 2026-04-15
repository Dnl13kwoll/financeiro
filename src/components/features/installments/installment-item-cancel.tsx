'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { XCircle, RotateCcw } from 'lucide-react'

export function InstallmentItemCancel({
  itemId,
  canceled,
  partNumber,
}: {
  itemId: string
  canceled: boolean
  partNumber: number
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    await (supabase.from('installment_items') as any)
      .update({ canceled: !canceled })
      .eq('id', itemId)
    showToast(canceled ? `Parcela ${partNumber} reativada.` : `Parcela ${partNumber} cancelada.`)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={canceled ? 'Reativar parcela' : 'Cancelar parcela'}
      className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 ${canceled ? 'opacity-100' : ''}`}
    >
      {canceled
        ? <RotateCcw className="w-3.5 h-3.5 text-green-500" />
        : <XCircle className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
      }
    </button>
  )
}
