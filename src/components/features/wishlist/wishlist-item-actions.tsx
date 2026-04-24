'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { Check, Trash2, RotateCcw } from 'lucide-react'

export function WishlistItemActions({ id, purchased }: { id: string; purchased: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function togglePurchased() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await (supabase.from('wishlist_items') as any).update({
      purchased: !purchased,
      purchased_at: !purchased ? new Date().toISOString() : null,
    }).eq('id', id)
    setLoading(false)
    if (error) { showToast('Erro: ' + error.message, 'error'); return }
    showToast(purchased ? 'Marcado como desejado.' : 'Marcado como comprado!')
    startTransition(() => { router.refresh() })
  }

  async function handleDelete() {
    if (!confirm('Remover este item da lista?')) return
    const supabase = createClient()
    const { error } = await (supabase.from('wishlist_items') as any).delete().eq('id', id)
    if (error) { showToast('Erro: ' + error.message, 'error'); return }
    showToast('Item removido.', 'error')
    startTransition(() => { router.refresh() })
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={togglePurchased}
        disabled={loading}
        className={`p-1.5 rounded transition-colors ${purchased ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
        title={purchased ? 'Desmarcar' : 'Marcar como comprado'}
      >
        {purchased ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
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
