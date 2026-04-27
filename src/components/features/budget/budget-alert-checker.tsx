'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'

export function BudgetAlertChecker({ coupleId }: { coupleId: string }) {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const storageKey = `budget_alerts_${coupleId}_${today}`
    if (localStorage.getItem(storageKey)) return

    async function check() {
      const supabase = createClient()
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

      const { data } = await (supabase as any)
        .from('budget_summary')
        .select('category_name, budgeted, spent')
        .eq('couple_id', coupleId)
        .eq('month', monthStart)

      if (!data || data.length === 0) return

      const exceeded = data.filter((b: any) => b.budgeted > 0 && b.spent > b.budgeted)
      const nearLimit = data.filter((b: any) => b.budgeted > 0 && b.spent / b.budgeted >= 0.8 && b.spent <= b.budgeted)

      // Show one toast per exceeded category
      for (const b of exceeded.slice(0, 2)) {
        const pct = Math.round((b.spent / b.budgeted) * 100)
        showToast(`Orçamento de "${b.category_name}" excedido (${pct}%)`, 'error')
        await new Promise(r => setTimeout(r, 400))
      }

      // Show one combined toast for near-limit
      if (nearLimit.length > 0) {
        const names = nearLimit.slice(0, 2).map((b: any) => b.category_name).join(', ')
        const suffix = nearLimit.length > 2 ? ` +${nearLimit.length - 2}` : ''
        showToast(`Orçamento próximo do limite: ${names}${suffix}`, 'error')
      }

      localStorage.setItem(storageKey, '1')
    }

    // Delay slightly so page content loads first
    const timer = setTimeout(check, 2000)
    return () => clearTimeout(timer)
  }, [coupleId])

  return null
}
