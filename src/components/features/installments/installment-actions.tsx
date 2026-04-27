'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { XCircle, Trash2 } from 'lucide-react'
import { confirmDialog } from '@/components/ui/confirm-dialog'
import { showToast } from '@/components/ui/toast'

export function InstallmentActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleCancel() {
    if (!await confirmDialog('Cancelar este parcelamento?', { confirmLabel: 'Cancelar' })) return
    const supabase = createClient()
    const { error } = await supabase.from('installments').update({ status: 'canceled' }).eq('id', id)
    if (error) { showToast('Erro: ' + error.message, 'error'); return }
    showToast('Parcelamento cancelado.')
    startTransition(() => { router.refresh() })
  }

  async function handleDelete() {
    if (!await confirmDialog('Excluir este parcelamento permanentemente?')) return
    const supabase = createClient()
    const { error } = await supabase.from('installments').delete().eq('id', id)
    if (error) { showToast('Erro: ' + error.message, 'error'); return }
    showToast('Parcelamento excluído.')
    startTransition(() => { router.refresh() })
  }

  return (
    <div className="flex items-center gap-1">
      {status === 'active' && (
        <button
          onClick={handleCancel}
          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
          title="Cancelar"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
      <button
        onClick={handleDelete}
        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Excluir"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
