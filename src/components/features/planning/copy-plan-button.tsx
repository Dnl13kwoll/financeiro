'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { Copy } from 'lucide-react'

export function CopyPlanButton({
  coupleId,
  currentMonth,
  prevMonth,
}: {
  coupleId: string
  currentMonth: string // YYYY-MM-DD (first day)
  prevMonth: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleCopy() {
    setLoading(true)
    const supabase = createClient()

    // Get prev month's plans
    const { data: prevPlans } = await (supabase.from('monthly_plans') as any)
      .select('label, category_id, planned_amount')
      .eq('couple_id', coupleId)
      .eq('month', prevMonth)

    if (!prevPlans || prevPlans.length === 0) {
      showToast('Mês anterior sem plano para copiar.', 'error')
      setLoading(false)
      return
    }

    // Upsert into current month
    const rows = prevPlans.map((p: any) => ({
      couple_id: coupleId,
      month: currentMonth,
      label: p.label,
      category_id: p.category_id,
      planned_amount: p.planned_amount,
    }))

    await (supabase.from('monthly_plans') as any).upsert(rows, { onConflict: 'couple_id,month,label' })

    setLoading(false)
    showToast(`${rows.length} linha(s) copiadas do mês anterior!`)
    startTransition(() => { router.refresh() })
  }

  return (
    <button
      onClick={handleCopy}
      disabled={loading}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-primary-300 transition-colors disabled:opacity-50"
    >
      <Copy className="w-4 h-4" />
      {loading ? 'Copiando...' : 'Copiar mês anterior'}
    </button>
  )
}
