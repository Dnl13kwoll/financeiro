'use client'
import { useEffect, useRef, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'

export function AutoGenerateRecurring({
  coupleId,
  userId,
  currentMonth, // e.g. "2025-05-01"
}: {
  coupleId: string
  userId: string
  currentMonth: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const storageKey = `recurring_auto_${coupleId}_${currentMonth.slice(0, 7)}`
    if (localStorage.getItem(storageKey)) return // already ran this month

    async function autoGenerate() {
      const supabase = createClient()

      const { data: recurring } = await (supabase.from('recurring_accounts') as any)
        .select('id, name, amount, day_due, category_id, account_id, type')
        .eq('couple_id', coupleId)
        .eq('active', true)
        .not('paused', 'is', true)

      if (!recurring || recurring.length === 0) return

      const [year, month] = currentMonth.slice(0, 7).split('-').map(Number)
      const monthStart = currentMonth
      const monthEnd = new Date(year, month, 0).toISOString().slice(0, 10)
      let generated = 0

      for (const rec of recurring) {
        if (!rec.amount) continue // skip variable-amount ones

        const dueDate = new Date(year, month - 1, rec.day_due).toISOString().slice(0, 10)

        const { data: existing } = await (supabase.from('transactions') as any)
          .select('id')
          .eq('couple_id', coupleId)
          .eq('description', rec.name)
          .gte('competence_date', monthStart)
          .lte('competence_date', monthEnd)
          .limit(1)

        if (existing && existing.length > 0) continue

        await (supabase.from('transactions') as any).insert({
          couple_id: coupleId,
          user_id: userId,
          type: rec.type === 'income' ? 'income' : 'expense',
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

      localStorage.setItem(storageKey, '1')

      if (generated > 0) {
        showToast(`${generated} recorrente(s) gerada(s) automaticamente para este mês!`)
        startTransition(() => { router.refresh() })
      }
    }

    autoGenerate()
  }, [coupleId, userId, currentMonth, router])

  return null
}
