'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { Zap } from 'lucide-react'
import { confirmDialog } from '@/components/ui/confirm-dialog'

export function GenerateRecurringButton({
  coupleId,
  userId,
  currentMonth,
}: {
  coupleId: string
  userId: string
  currentMonth: string  // e.g. "2025-05-01"
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleGenerate() {
    if (!await confirmDialog('Gerar transações para todas as contas recorrentes ativas neste mês?', { destructive: false, confirmLabel: 'Gerar' })) return
    setLoading(true)
    try {
      const supabase = createClient()

      // Fetch active recurring accounts
      const { data: recurring } = await supabase
        .from('recurring_accounts')
        .select('id, name, amount, day_due, category_id, account_id, type')
        .eq('couple_id', coupleId)
        .eq('active', true)
        .not('paused', 'is', true)

      if (!recurring || recurring.length === 0) {
        showToast('Nenhuma conta recorrente ativa.', 'error')
        setLoading(false)
        return
      }

      const [year, month] = currentMonth.slice(0, 7).split('-').map(Number)
      let generated = 0

      for (const rec of recurring) {
        // Check if a transaction already exists for this recurring this month
        const dueDate = new Date(year, month - 1, rec.day_due).toISOString().slice(0, 10)
        const monthStart = currentMonth
        const monthEnd = new Date(year, month, 0).toISOString().slice(0, 10)

        const { data: existing } = await supabase.from('transactions')
          .select('id')
          .eq('couple_id', coupleId)
          .eq('description', rec.name)
          .gte('competence_date', monthStart)
          .lte('competence_date', monthEnd)
          .limit(1)

        if (existing && existing.length > 0) continue

        if (!rec.amount) continue

        await supabase.from('transactions').insert({
          couple_id: coupleId,
          user_id: userId,
          type: (rec.type ?? 'expense') as 'expense' | 'income',
          amount: rec.amount,
          description: rec.name,
          category_id: rec.category_id ?? null,
          account_id: rec.account_id ?? null,
          date: dueDate,
          competence_date: dueDate,
          is_private: false,
          tags: [],
        })
        generated++
      }

      if (generated === 0) {
        showToast('Todas as recorrentes já têm transação este mês.', 'error')
      } else {
        showToast(`${generated} transação(ões) gerada(s)!`)
        startTransition(() => { router.refresh() })
      }
    } catch {
      showToast('Erro ao gerar transações.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      title="Gerar transações para todas as recorrentes ativas neste mês"
    >
      <Zap className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
      {loading ? 'Gerando...' : 'Gerar este mês'}
    </button>
  )
}
