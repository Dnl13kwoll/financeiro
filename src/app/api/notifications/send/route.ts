import { createAdminClient } from '@/lib/supabase/admin'
import webpush from 'web-push'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type AdminClient = ReturnType<typeof createAdminClient>

async function sendPush(
  sub: any,
  title: string,
  body: string,
  url: string,
  admin: AdminClient
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title, body, url })
    )
    return true
  } catch (err: any) {
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    }
    return false
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

  const admin = createAdminClient()
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const next3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const next7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const next14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const yesterday25h = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
  const isMonday = now.getDay() === 1
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const { data: subscriptions } = await admin.from('push_subscriptions').select('*')
  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Group subscriptions by couple_id — all DB queries run once per couple, not once per subscription
  const byCoupleId = new Map<string, any[]>()
  for (const sub of subscriptions) {
    if (!sub.couple_id) continue
    const arr = byCoupleId.get(sub.couple_id) ?? []
    arr.push(sub)
    byCoupleId.set(sub.couple_id, arr)
  }

  let sent = 0

  for (const [coupleId, coupleSubs] of byCoupleId) {
    // All data for this couple fetched in parallel
    const [
      todayInstRes,
      todayRecRes,
      dueSoonInstRes,
      recurringDueRes,
      budgetRes,
      weekTxRes,
      goalsRes,
      vehicleRes,
      propRes,
      remindersRes,
      renewalsRes,
      cardsRes,
    ] = await Promise.all([
      admin.from('installment_items')
        .select('id, amount, installments!inner(description, couple_id)')
        .eq('paid', false)
        .eq('canceled', false)
        .eq('due_date', today)
        .eq('installments.couple_id', coupleId),

      admin.from('recurring_accounts')
        .select('id, name, amount, day_due')
        .eq('couple_id', coupleId)
        .eq('active', true)
        .eq('paused', false)
        .eq('day_due', now.getDate()),

      admin.from('installment_items')
        .select('id, due_date, amount, installments!inner(description, couple_id)')
        .eq('paid', false)
        .eq('canceled', false)
        .gte('due_date', today)
        .lte('due_date', next7)
        .eq('installments.couple_id', coupleId),

      admin.from('recurring_accounts')
        .select('id, name, day_due')
        .eq('couple_id', coupleId)
        .eq('active', true)
        .eq('paused', false)
        .gte('day_due', now.getDate())
        .lte('day_due', now.getDate() + 7),

      (admin.from('budget_summary' as any) as any)
        .select('*')
        .eq('couple_id', coupleId)
        .eq('month', monthStart),

      isMonday
        ? admin.from('transactions')
            .select('type, amount')
            .eq('couple_id', coupleId)
            .gte('competence_date', weekAgo)
            .lte('competence_date', today)
            .is('deleted_at', null)
            .neq('type', 'transfer')
        : Promise.resolve({ data: null as any }),

      admin.from('goals')
        .select('id, name, current_amount, target_amount, updated_at')
        .eq('couple_id', coupleId)
        .gte('updated_at', yesterday25h),

      (admin as any).from('vehicle_maintenances')
        .select('type, next_date, vehicles(name)')
        .eq('couple_id', coupleId)
        .not('next_date', 'is', null)
        .lte('next_date', next7),

      (admin as any).from('property_maintenances')
        .select('type, next_date, priority, status, properties(name)')
        .eq('couple_id', coupleId),

      (admin as any).from('financial_reminders')
        .select('title, due_date, priority')
        .eq('couple_id', coupleId)
        .eq('done', false)
        .lte('due_date', next3),

      (admin as any).from('subscriptions')
        .select('name, renewal_date')
        .eq('couple_id', coupleId)
        .eq('active', true)
        .not('renewal_date', 'is', null)
        .gte('renewal_date', today)
        .lte('renewal_date', next7),

      admin.from('accounts')
        .select('id, name, closing_day, due_day, limit_amount')
        .eq('couple_id', coupleId)
        .eq('type', 'credit_card')
        .is('deleted_at', null),
    ])

    const notifications: Array<{ title: string; body: string; url: string }> = []

    // 0. Bills due TODAY
    const todayInst = todayInstRes.data ?? []
    const todayRec = todayRecRes.data ?? []
    let todayRecUnpaid: any[] = []
    if (todayRec.length > 0) {
      const recIds = todayRec.map((r: any) => r.id)
      const { data: paidRecs } = await admin.from('recurring_records')
        .select('recurring_id')
        .in('recurring_id', recIds)
        .eq('reference_month', monthStart)
        .eq('paid', true)
      const paidIds = new Set((paidRecs ?? []).map((r: any) => r.recurring_id))
      todayRecUnpaid = todayRec.filter((r: any) => !paidIds.has(r.id))
    }
    const todayTotal = todayInst.length + todayRecUnpaid.length
    if (todayTotal > 0) {
      const names = [
        ...todayInst.map((d: any) => (d.installments as any)?.description ?? 'Parcela'),
        ...todayRecUnpaid.map((r: any) => r.name),
      ].slice(0, 3).join(', ')
      const body = todayTotal === 1
        ? `"${names}" vence hoje. Não esqueça de pagar!`
        : `${todayTotal} contas vencem hoje: ${names}${todayTotal > 3 ? '...' : ''}`
      notifications.push({ title: '🔴 Vence hoje!', body, url: '/recurring' })
    }

    // 1 & 2. Due in next 7 days
    const totalDue = (dueSoonInstRes.data?.length ?? 0) + (recurringDueRes.data?.length ?? 0)
    if (totalDue > 0) {
      const body = totalDue === 1
        ? 'Você tem 1 vencimento nos próximos 7 dias.'
        : `Você tem ${totalDue} vencimentos nos próximos 7 dias.`
      notifications.push({ title: '⏰ Financeiro', body, url: '/timeline' })
    }

    // 3. Budget exceeded
    const exceeded = (budgetRes.data ?? []).filter((b: any) => b.budgeted > 0 && b.spent > b.budgeted)
    if (exceeded.length > 0) {
      const names = exceeded.slice(0, 3).map((b: any) => b.category_name).join(', ')
      const body = `Orçamento excedido em: ${names}${exceeded.length > 3 ? ` e mais ${exceeded.length - 3}` : ''}.`
      notifications.push({ title: '⚠️ Orçamento excedido', body, url: '/budgets' })
    }

    // 4. Weekly summary (only Mondays)
    if (isMonday && weekTxRes.data && weekTxRes.data.length > 0) {
      const weekIncome = weekTxRes.data.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
      const weekExpense = weekTxRes.data.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)
      notifications.push({
        title: '📊 Resumo semanal',
        body: `Semana passada: ${fmt(weekIncome)} de receitas, ${fmt(weekExpense)} de despesas.`,
        url: '/reports',
      })
    }

    // 5. Goals completed in the last 25h (already filtered by DB query)
    for (const goal of (goalsRes.data ?? [])) {
      if (goal.current_amount >= goal.target_amount) {
        notifications.push({
          title: '🎉 Meta atingida!',
          body: `Parabéns! A meta "${goal.name}" foi concluída!`,
          url: '/goals',
        })
        break
      }
    }

    // 6. Vehicle maintenances
    for (const m of (vehicleRes.data ?? [])) {
      const vName = (m.vehicles as any)?.name ?? 'Veículo'
      const diff = Math.round((new Date(m.next_date).getTime() - now.getTime()) / 86400000)
      notifications.push({
        title: diff < 0 ? '🔧 Manutenção atrasada' : '🔧 Manutenção próxima',
        body: diff < 0 ? `${vName} — ${m.type} venceu há ${Math.abs(diff)} dia(s)` : `${vName} — ${m.type} vence em ${diff} dia(s)`,
        url: '/vehicles',
      })
    }

    // 7. Property maintenances
    for (const m of (propRes.data ?? [])) {
      const pName = (m.properties as any)?.name ?? 'Imóvel'
      if (m.priority === 'urgente' && m.status !== 'concluido') {
        notifications.push({ title: '🏠 Manutenção urgente', body: `${pName} — ${m.type} com prioridade urgente pendente`, url: '/imoveis' })
      } else if (m.next_date && m.status === 'concluido' && m.next_date <= next14) {
        const diff = Math.round((new Date(m.next_date).getTime() - now.getTime()) / 86400000)
        notifications.push({
          title: diff < 0 ? '🏠 Manutenção residencial atrasada' : '🏠 Manutenção residencial próxima',
          body: diff < 0 ? `${pName} — ${m.type} venceu há ${Math.abs(diff)} dia(s)` : `${pName} — ${m.type} vence em ${diff} dia(s)`,
          url: '/imoveis',
        })
      }
    }

    // 8. Financial reminders
    const reminders = remindersRes.data ?? []
    const overdue = reminders.filter((r: any) => r.due_date < today)
    const upcoming = reminders.filter((r: any) => r.due_date >= today)
    if (overdue.length > 0) {
      notifications.push({
        title: '🔔 Lembrete atrasado',
        body: overdue.length === 1 ? `"${overdue[0].title}" está atrasado` : `${overdue.length} lembretes em atraso`,
        url: '/reminders',
      })
    }
    if (upcoming.length > 0) {
      notifications.push({
        title: '🔔 Lembrete próximo',
        body: upcoming.length === 1 ? `"${upcoming[0].title}" vence em breve` : `${upcoming.length} lembretes vencem em até 3 dias`,
        url: '/reminders',
      })
    }

    // 9. Subscription renewals
    const renewals = renewalsRes.data ?? []
    if (renewals.length > 0) {
      const names = renewals.slice(0, 3).map((s: any) => s.name).join(', ')
      notifications.push({
        title: '📦 Renovação de assinatura',
        body: renewals.length === 1 ? `Renovação de "${names}" nos próximos dias` : `Renovações próximas: ${names}${renewals.length > 3 ? ` e mais ${renewals.length - 3}` : ''}`,
        url: '/subscriptions',
      })
    }

    // 10 & 11. Credit cards: closing soon + limit alerts
    const cards = cardsRes.data ?? []
    if (cards.length > 0) {
      const cardIds = cards.map((c: any) => c.id)
      const { data: balances } = await admin.from('account_balances').select('id, balance').in('id', cardIds)
      const balMap = new Map((balances ?? []).map((b: any) => [b.id, b.balance as number]))

      for (const card of cards) {
        if (card.closing_day !== null) {
          const closingDay = card.closing_day as number
          const dayOfMonth = now.getDate()
          const daysUntilClose = closingDay >= dayOfMonth
            ? closingDay - dayOfMonth
            : new Date(now.getFullYear(), now.getMonth() + 1, closingDay).getDate() + (new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - dayOfMonth)

          if (daysUntilClose <= 3) {
            const closingThisMonth = new Date(now.getFullYear(), now.getMonth(), closingDay)
            const cycleStart = now > closingThisMonth
              ? new Date(now.getFullYear(), now.getMonth(), closingDay + 1)
              : new Date(now.getFullYear(), now.getMonth() - 1, closingDay + 1)
            const cycleEnd = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, closingDay)

            const { data: cycleTx } = await admin.from('transactions')
              .select('amount')
              .eq('account_id', card.id)
              .eq('type', 'expense')
              .gte('date', cycleStart.toISOString().slice(0, 10))
              .lte('date', cycleEnd.toISOString().slice(0, 10))
              .is('deleted_at', null)

            const invoiceTotal = (cycleTx ?? []).reduce((s: number, t: any) => s + t.amount, 0)
            notifications.push({
              title: '💳 Fatura fechando',
              body: daysUntilClose === 0
                ? `Fatura do ${card.name} fecha hoje! Total atual: ${fmt(invoiceTotal)}`
                : `Fatura do ${card.name} fecha em ${daysUntilClose} dia(s). Total atual: ${fmt(invoiceTotal)}`,
              url: `/cards/${card.id}`,
            })
          }
        }

        if (card.limit_amount) {
          const used = Math.max(0, -(balMap.get(card.id) ?? 0))
          const limit = card.limit_amount as number
          const pct = limit > 0 ? used / limit : 0
          if (pct >= 0.95) {
            notifications.push({
              title: '🚨 Limite do cartão',
              body: `${card.name}: limite quase esgotado! ${Math.round(pct * 100)}% usado (${fmt(limit - used)} disponível)`,
              url: '/accounts',
            })
          } else if (pct >= 0.8) {
            notifications.push({
              title: '⚠️ Limite do cartão',
              body: `${card.name}: ${Math.round(pct * 100)}% do limite usado. Disponível: ${fmt(limit - used)}`,
              url: '/accounts',
            })
          }
        }
      }
    }

    // Deliver all notifications to every subscriber in this couple
    for (const sub of coupleSubs) {
      for (const notif of notifications) {
        if (await sendPush(sub, notif.title, notif.body, notif.url, admin)) sent++
      }
    }
  }

  return NextResponse.json({ sent })
}
