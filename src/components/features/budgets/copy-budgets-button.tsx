'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Copy } from 'lucide-react'

export function CopyBudgetsButton({ coupleId, currentMonth }: { coupleId: string; currentMonth: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleCopy() {
    if (!confirm('Copiar os orçamentos do mês anterior para este mês?')) return
    setLoading(true)

    const [year, month] = currentMonth.split('-').map(Number)
    const prevDate = new Date(year, month - 2, 1)
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`

    const supabase = createClient()
    const { data: prev } = await (supabase.from('budgets') as any)
      .select('category_id, amount')
      .eq('couple_id', coupleId)
      .eq('month', prevMonth)

    if (!prev || prev.length === 0) {
      alert('Nenhum orçamento encontrado no mês anterior.')
      setLoading(false)
      return
    }

    const payload = prev.map((b: any) => ({
      couple_id: coupleId,
      category_id: b.category_id,
      amount: b.amount,
      month: currentMonth,
    }))

    await (supabase.from('budgets') as any).upsert(payload, { onConflict: 'couple_id,category_id,month' })
    setLoading(false)
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
