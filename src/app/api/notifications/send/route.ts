import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function sendPush(
  sub: any,
  title: string,
  body: string,
  url: string,
  supabase: any
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title, body, url })
    )
    return true
  } catch (err: any) {
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      await (supabase.from('push_subscriptions') as any).delete().eq('endpoint', sub.endpoint)
    }
    return false
  }
}

export async function GET(req: Request) {
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
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const next7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  const isMonday = now.getDay() === 1

  const { data: subscriptions } = await (supabase.from('push_subscriptions') as any).select('*')
  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0

  for (const sub of subscriptions) {
    if (!sub.couple_id) continue

    // 1. Due installments in next 7 days
    const { data: dueSoon } = await (supabase.from('installment_items') as any)
      .select('id, due_date, amount, installments(description, couple_id)')
      .eq('paid', false)
      .eq('canceled', false)
      .gte('due_date', today)
      .lte('due_date', next7)

    const dueInstallments = (dueSoon ?? []).filter(
      (d: any) => (d.installments as any)?.couple_id === sub.couple_id
    )

    // 2. Recurring due in next 7 days
    const { data: recurringDue } = await supabase
      .from('recurring_accounts')
      .select('id, name, day_due')
      .eq('couple_id', sub.couple_id)
      .eq('active', true)
      .eq('paused', false)
      .gte('day_due', now.getDate())
      .lte('day_due', now.getDate() + 7)

    const totalDue = (dueInstallments?.length ?? 0) + (recurringDue?.length ?? 0)
    if (totalDue > 0) {
      const body = totalDue === 1
        ? 'Você tem 1 vencimento nos próximos 7 dias.'
        : `Você tem ${totalDue} vencimentos nos próximos 7 dias.`
      if (await sendPush(sub, '⏰ Financeiro', body, '/timeline', supabase)) sent++
    }

    // 3. Budget exceeded alerts (only on Monday or when first exceeded)
    const { data: budgetData } = await (supabase.from('budget_summary' as any) as any)
      .select('*')
      .eq('couple_id', sub.couple_id)
      .eq('month', monthStart)

    const exceeded = (budgetData ?? []).filter((b: any) => b.budgeted > 0 && b.spent > b.budgeted)
    if (exceeded.length > 0) {
      const names = exceeded.slice(0, 3).map((b: any) => b.category_name).join(', ')
      const body = `Orçamento excedido em: ${names}${exceeded.length > 3 ? ` e mais ${exceeded.length - 3}` : ''}.`
      if (await sendPush(sub, '⚠️ Orçamento excedido', body, '/budgets', supabase)) sent++
    }

    // 4. Weekly summary (only on Mondays)
    if (isMonday) {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const { data: weekTx } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('couple_id', sub.couple_id)
        .gte('competence_date', weekAgo)
        .lte('competence_date', today)
        .is('deleted_at', null)
        .neq('type', 'transfer')

      const weekIncome = (weekTx ?? []).filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
      const weekExpense = (weekTx ?? []).filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)

      if (weekTx && weekTx.length > 0) {
        const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
        const body = `Semana passada: ${fmt(weekIncome)} de receitas, ${fmt(weekExpense)} de despesas.`
        if (await sendPush(sub, '📊 Resumo semanal', body, '/reports', supabase)) sent++
      }
    }

    // 5. Goal completion check
    const { data: goalsData } = await (supabase.from('goals') as any)
      .select('id, name, current_amount, target_amount')
      .eq('couple_id', sub.couple_id)

    for (const goal of (goalsData ?? [])) {
      if (goal.current_amount >= goal.target_amount) {
        if (await sendPush(
          sub,
          '🎉 Meta atingida!',
          `Parabéns! A meta "${goal.name}" foi concluída!`,
          '/goals',
          supabase
        )) sent++
        break // one notification per user per run
      }
    }
  }

  return NextResponse.json({ sent })
}
