import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
  }

  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL ?? 'admin@example.com'),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)
  const next7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // Get all active subscriptions
  const { data: subscriptions } = await (supabase.from('push_subscriptions') as any)
    .select('*')

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0

  for (const sub of subscriptions) {
    if (!sub.couple_id) continue

    // Check due installments in next 7 days
    const { data: dueSoon } = await (supabase.from('installment_items') as any)
      .select('id, due_date, amount, installments(description)')
      .eq('paid', false)
      .eq('canceled', false)
      .gte('due_date', today)
      .lte('due_date', next7)

    // Check recurring accounts due in next 7 days
    const now = new Date()
    const { data: recurringDue } = await supabase
      .from('recurring_accounts')
      .select('id, name, day_due')
      .eq('couple_id', sub.couple_id)
      .eq('active', true)
      .gte('day_due', now.getDate())
      .lte('day_due', now.getDate() + 7)

    const totalDue = (dueSoon?.length ?? 0) + (recurringDue?.length ?? 0)
    if (totalDue === 0) continue

    const body =
      totalDue === 1
        ? `Você tem 1 vencimento nos próximos 7 dias.`
        : `Você tem ${totalDue} vencimentos nos próximos 7 dias.`

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({ title: 'Financeiro', body, url: '/dashboard' })
      )
      sent++
    } catch (err: any) {
      // Remove expired/invalid subscriptions (410 Gone)
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await (supabase.from('push_subscriptions') as any)
          .delete()
          .eq('endpoint', sub.endpoint)
      }
    }
  }

  return NextResponse.json({ sent })
}
