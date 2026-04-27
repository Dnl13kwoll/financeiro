'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { Scissors } from 'lucide-react'

export function TransactionSplitToggle({
  transactionId,
  amount,
  hasSplit,
}: {
  transactionId: string
  amount: number
  hasSplit: boolean
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function toggle() {
    setLoading(true)
    const supabase = createClient()

    if (hasSplit) {
      // Remove split
      await supabase.from('transaction_splits').delete().eq('transaction_id', transactionId)
      await supabase.from('transactions').update({ split_id: null }).eq('id', transactionId)
      showToast('Divisão removida.')
    } else {
      // Create 50/50 split
      const { data: split } = await supabase.from('transaction_splits')
        .insert({ transaction_id: transactionId, ratio: 0.5, note: '50/50' })
        .select()
        .single()
      if (split) {
        await supabase.from('transactions').update({ split_id: split.id }).eq('id', transactionId)
      }
      showToast(`Despesa dividida: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount / 2)} cada.`)
    }

    setLoading(false)
    startTransition(() => { router.refresh() })
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={hasSplit ? 'Remover divisão' : 'Dividir 50/50'}
      className={`p-1.5 rounded transition-colors ${
        hasSplit
          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
          : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      <Scissors className="w-3.5 h-3.5" />
    </button>
  )
}
