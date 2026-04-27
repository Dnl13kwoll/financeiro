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
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
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

  const { data: subscriptions } = await supabase.from('push_subscriptions').select('*')
  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0

  for (const sub of subscriptions) {
    if (!sub.couple_id) continue

    // 1. Due installments in next 7 days
    const { data: dueSoon } = await supabase.from('installment_items')
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
    const { data: goalsData } = await supabase.from('goals')
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
        break
      }
    }

    const db = supabase as any

    // 6. Vehicle maintenance alerts (due in next 7 days or overdue)
    const { data: vehicleMaints } = await db
      .from('vehicle_maintenances')
      .select('type, next_date, vehicles(name)')
      .eq('couple_id', sub.couple_id)
      .not('next_date', 'is', null)
      .lte('next_date', next7)

    for (const m of (vehicleMaints ?? [])) {
      const vName = (m.vehicles as any)?.name ?? 'Veículo'
      const diff = Math.round((new Date(m.next_date).getTime() - now.getTime()) / 86400000)
      const body = diff < 0
        ? `${vName} — ${m.type} venceu há ${Math.abs(diff)} dia(s)`
        : `${vName} — ${m.type} vence em ${diff} dia(s)`
      if (await sendPush(sub, diff < 0 ? '🔧 Manutenção atrasada' : '🔧 Manutenção próxima', body, '/vehicles', supabase)) sent++
    }

    // 7. Property maintenance alerts (due in next 14 days or urgent pending)
    const next14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const { data: propMaints } = await db
      .from('property_maintenances')
      .select('type, next_date, priority, status, properties(name)')
      .eq('couple_id', sub.couple_id)

    for (const m of (propMaints ?? [])) {
      const pName = (m.properties as any)?.name ?? 'Imóvel'
      if (m.priority === 'urgente' && m.status !== 'concluido') {
        const body = `${pName} — ${m.type} com prioridade urgente pendente`
        if (await sendPush(sub, '🏠 Manutenção urgente', body, '/imoveis', supabase)) sent++
      } else if (m.next_date && m.status === 'concluido' && m.next_date <= next14) {
        const diff = Math.round((new Date(m.next_date).getTime() - now.getTime()) / 86400000)
        const body = diff < 0
          ? `${pName} — ${m.type} venceu há ${Math.abs(diff)} dia(s)`
          : `${pName} — ${m.type} vence em ${diff} dia(s)`
        if (await sendPush(sub, diff < 0 ? '🏠 Manutenção residencial atrasada' : '🏠 Manutenção residencial próxima', body, '/imoveis', supabase)) sent++
      }
    }

    // 8. Financial reminders due in next 3 days
    const next3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const { data: reminders } = await db
      .from('financial_reminders')
      .select('title, due_date, priority')
      .eq('couple_id', sub.couple_id)
      .eq('status', 'pendente')
      .lte('due_date', next3)

    if ((reminders ?? []).length > 0) {
      const overdue = (reminders ?? []).filter((r: any) => r.due_date < today)
      const upcoming = (reminders ?? []).filter((r: any) => r.due_date >= today)
      if (overdue.length > 0) {
        const body = overdue.length === 1 ? `"${overdue[0].title}" está atrasado` : `${overdue.length} lembretes em atraso`
        if (await sendPush(sub, '🔔 Lembrete atrasado', body, '/reminders', supabase)) sent++
      }
      if (upcoming.length > 0) {
        const body = upcoming.length === 1 ? `"${upcoming[0].title}" vence em breve` : `${upcoming.length} lembretes vencem em até 3 dias`
        if (await sendPush(sub, '🔔 Lembrete próximo', body, '/reminders', supabase)) sent++
      }
    }

    // 9. Subscription renewals in next 7 days
    const { data: subs } = await db
      .from('subscriptions')
      .select('name, renewal_date')
      .eq('couple_id', sub.couple_id)
      .eq('active', true)
      .not('renewal_date', 'is', null)
      .lte('renewal_date', next7)
      .gte('renewal_date', today)

    if ((subs ?? []).length > 0) {
      const names = (subs ?? []).slice(0, 3).map((s: any) => s.name).join(', ')
      const body = (subs ?? []).length === 1 ? `Renovação de "${names}" nos próximos dias` : `Renovações próximas: ${names}${(subs ?? []).length > 3 ? ` e mais ${(subs ?? []).length - 3}` : ''}`
      if (await sendPush(sub, '📦 Renovação de assinatura', body, '/subscriptions', supabase)) sent++
    }
  }

  return NextResponse.json({ sent })
}
