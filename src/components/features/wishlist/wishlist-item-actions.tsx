'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { Check, Trash2, RotateCcw } from 'lucide-react'
import { confirmDialog } from '@/components/ui/confirm-dialog'

export function WishlistItemActions({ id, purchased }: { id: string; purchased: boolean }) {
  const [optimisticPurchased, setOptimisticPurchased] = useState(purchased)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function togglePurchased() {
    const next = !optimisticPurchased
    setOptimisticPurchased(next)
    const { error } = await createClient().from('wishlist_items').update({
      purchased: next,
      purchased_at: next ? new Date().toISOString() : null,
    }).eq('id', id)
    if (error) {
      setOptimisticPurchased(!next)
      showToast('Erro: ' + error.message, 'error')
      return
    }
    showToast(next ? 'Marcado como comprado!' : 'Marcado como desejado.')
    startTransition(() => { router.refresh() })
  }

  async function handleDelete() {
    if (!await confirmDialog('Remover este item da lista?')) return
    const { error } = await createClient().from('wishlist_items').delete().eq('id', id)
    if (error) { showToast('Erro: ' + error.message, 'error'); return }
    showToast('Item removido.')
    startTransition(() => { router.refresh() })
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={togglePurchased}
        className={`p-1.5 rounded transition-colors ${optimisticPurchased ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
        title={optimisticPurchased ? 'Desmarcar' : 'Marcar como comprado'}
      >
        {optimisticPurchased ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={handleDelete}
        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Remover"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
