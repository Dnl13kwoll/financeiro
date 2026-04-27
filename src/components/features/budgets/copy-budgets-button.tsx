'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Copy } from 'lucide-react'
import { confirmDialog } from '@/components/ui/confirm-dialog'
import { showToast } from '@/components/ui/toast'

export function CopyBudgetsButton({ coupleId, currentMonth }: { coupleId: string; currentMonth: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleCopy() {
    if (!await confirmDialog('Copiar os orçamentos do mês anterior para este mês?', { destructive: false, confirmLabel: 'Copiar' })) return
    setLoading(true)

    const [year, month] = currentMonth.split('-').map(Number)
    const prevDate = new Date(year, month - 2, 1)
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`

    const supabase = createClient()
    const { data: prev } = await supabase.from('budgets')
      .select('category_id, amount')
      .eq('couple_id', coupleId)
      .eq('month', prevMonth)

    if (!prev || prev.length === 0) {
      showToast('Nenhum orçamento encontrado no mês anterior.', 'error')
      setLoading(false)
      return
    }

    const payload = prev.map((b: any) => ({
      couple_id: coupleId,
      category_id: b.category_id,
      amount: b.amount,
      month: currentMonth,
    }))

    const { error } = await supabase.from('budgets').upsert(payload, { onConflict: 'couple_id,category_id,month' })
    setLoading(false)
    if (error) { showToast('Erro: ' + error.message, 'error'); return }
    showToast(`${payload.length} orçamento(s) copiado(s)!`)
    startTransition(() => { router.refresh() })
  }

  return (
    <button
      onClick={handleCopy}
      disabled={loading}
      className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      <Copy className="w-4 h-4" />
      {loading ? 'Copiando...' : 'Copiar mês anterior'}
    </button>
  )
}
