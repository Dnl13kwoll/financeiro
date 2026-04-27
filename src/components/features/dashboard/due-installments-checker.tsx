'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'

export function DueInstallmentsChecker({ coupleId }: { coupleId: string }) {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const storageKey = `due_check_${coupleId}_${today}`
    if (localStorage.getItem(storageKey)) return

    async function check() {
      const supabase = createClient()
      const in3days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

      const { data: items } = await supabase.from('installment_items')
        .select('due_date, amount, installments(description, couple_id)')
        .eq('paid', false)
        .eq('canceled', false)
        .gte('due_date', today)
        .lte('due_date', in3days)

      const due = (items ?? []).filter(
        (d: any) => (d.installments as any)?.couple_id === coupleId
      )

      const { data: recurring } = await (createClient().from('recurring_accounts') as any)
        .select('name, day_due, amount')
        .eq('couple_id', coupleId)
        .eq('active', true)

      const now = new Date()
      const recurringDue = (recurring ?? []).filter((r: any) => {
        const dueDay = r.day_due as number
        const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay)
        if (dueDate < now) return false
        const diff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return diff <= 3
      })

      const total = due.length + recurringDue.length
      if (total > 0) {
        const msg = total === 1
          ? '⏰ 1 vencimento nos próximos 3 dias!'
          : `⏰ ${total} vencimentos nos próximos 3 dias!`
        showToast(msg, 'error')
      }

      localStorage.setItem(storageKey, '1')
    }

    check()
  }, [coupleId])

  return null
}
