'use client'
import { useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const WATCHED_TABLES = [
  'transactions',
  'accounts',
  'installments',
  'installment_items',
  'recurring_accounts',
  'recurring_records',
  'goals',
  'budgets',
  'wishlist_items',
  'wishlist_votes',
]

export function RealtimeSync() {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ownUserIdRef = useRef<string | null>(null)

  function scheduleRefresh() {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => {
      startTransition(() => router.refresh())
    }, 800)
  }

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      ownUserIdRef.current = user.id

      const memberRes = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('user_id', user.id)
        .maybeSingle()

      const coupleId = (memberRes.data as any)?.couple_id
      if (!coupleId) return

      channel = supabase.channel(`realtime-couple-${coupleId}`)

      for (const table of WATCHED_TABLES) {
        channel.on(
          'postgres_changes' as any,
          { event: '*', schema: 'public', table, filter: `couple_id=eq.${coupleId}` },
          (payload: any) => {
            // Skip if triggered by current user's own action
            const changedBy = payload.new?.user_id ?? payload.old?.user_id
            if (changedBy && changedBy === ownUserIdRef.current) return
            scheduleRefresh()
          }
        )
      }

      channel.subscribe()
    }

    setup()

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  return null
}
