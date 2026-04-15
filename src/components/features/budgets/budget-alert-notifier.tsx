'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type BudgetAlert = {
  category_id: string
  category_name: string
  percent: number
  coupleId: string
}

export function BudgetAlertNotifier({ alerts }: { alerts: BudgetAlert[] }) {
  useEffect(() => {
    if (alerts.length === 0) return

    async function notify() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      for (const alert of alerts) {
        const over = alert.percent >= 100
        const message = over
          ? `Orçamento de "${alert.category_name}" foi ultrapassado (${alert.percent}%)!`
          : `Orçamento de "${alert.category_name}" atingiu ${alert.percent}% do limite.`

        // Check if we already sent this notification (avoid duplicates in same session)
        const key = `budget_alert_${alert.category_id}_${new Date().toISOString().slice(0, 7)}`
        if (sessionStorage.getItem(key)) continue
        sessionStorage.setItem(key, '1')

        await (supabase.from('notifications') as any).insert({
          couple_id: alert.coupleId,
          user_id: user.id,
          type: over ? 'budget_over' : 'budget_warning',
          message,
          href: '/budgets',
          read: false,
        })
      }
    }
    notify()
  }, [alerts])

  return null
}
