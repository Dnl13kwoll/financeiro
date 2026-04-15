'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { RefreshCw } from 'lucide-react'

export function RolloverBudgetButton({
  coupleId,
  currentMonth,   // e.g. "2025-05-01"
  prevMonth,      // e.g. "2025-04-01"
}: {
  coupleId: string
  currentMonth: string
  prevMonth: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRollover() {
    if (!confirm('Transferir saldo não utilizado do mês anterior para este mês?')) return
    setLoading(true)

    try {
      const supabase = createClient()
      const prevMonthEnd = new Date(
        parseInt(prevMonth.slice(0, 4)),
        parseInt(prevMonth.slice(5, 7)),
        0
      ).toISOString().slice(0, 10)

      // Fetch previous month's budgets
      const { data: prevBudgets } = await (supabase.from('budgets') as any)
        .select('id, category_id, amount')
        .eq('couple_id', coupleId)
        .eq('month', prevMonth)

      if (!prevBudgets || prevBudgets.length === 0) {
        showToast('Nenhum orçamento no mês anterior.', 'error')
        setLoading(false)
        return
      }

      // Fetch expenses from previous month per category
      const { data: prevExpenses } = await (supabase
        .from('transactions') as any)
        .select('category_id, amount')
        .eq('couple_id', coupleId)
        .eq('type', 'expense')
        .gte('competence_date', prevMonth)
        .lte('competence_date', prevMonthEnd)
        .is('deleted_at', null)

      const spentMap = new Map<string, number>()
      for (const e of (prevExpenses ?? []) as any[]) {
        if (e.category_id) {
          spentMap.set(e.category_id, (spentMap.get(e.category_id) ?? 0) + e.amount)
        }
      }

      // Fetch current month's budgets to know existing amounts
      const { data: currBudgets } = await (supabase.from('budgets') as any)
        .select('id, category_id, amount, alert_threshold')
        .eq('couple_id', coupleId)
        .eq('month', currentMonth)

      const currMap = new Map<string, { id: string; amount: number; alert_threshold: number }>(
        (currBudgets ?? []).map((b: any) => [b.category_id, { id: b.id, amount: b.amount, alert_threshold: b.alert_threshold ?? 80 }])
      )

      let rolledCount = 0

      for (const prev of prevBudgets) {
        const spent = spentMap.get(prev.category_id) ?? 0
        const surplus = prev.amount - spent
        if (surplus <= 0) continue // nothing to roll over

        const curr = currMap.get(prev.category_id)
        if (curr) {
          // Update existing budget
          await (supabase.from('budgets') as any)
            .update({ amount: curr.amount + surplus })
            .eq('id', curr.id)
        } else {
          // Create budget for this month with the rollover amount
          await (supabase.from('budgets') as any).insert({
            couple_id: coupleId,
            category_id: prev.category_id,
            month: currentMonth,
            amount: surplus,
            alert_threshold: 80,
          })
        }
        rolledCount++
      }

      if (rolledCount === 0) {
        showToast('Nenhum saldo disponível para transferir.', 'error')
      } else {
        showToast(`Saldo de ${rolledCount} categoria(s) transferido!`)
        router.refresh()
      }
    } catch {
      showToast('Erro ao fazer rollover.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRollover}
      disabled={loading}
      title="Transferir saldo não usado do mês anterior"
      className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Transferindo...' : 'Rollover'}
    </button>
  )
}
