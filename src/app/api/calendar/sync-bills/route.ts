import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getValidToken(userId: string, supabase: any): Promise<string | null> {
  const { data } = await supabase
    .from('google_tokens')
    .select('access_token, refresh_token, token_expiry')
    .eq('user_id', userId)
    .single()

  if (!data) return null

  const expiry = data.token_expiry ? new Date(data.token_expiry) : null
  const needsRefresh = !expiry || expiry.getTime() < Date.now() + 5 * 60 * 1000

  if (!needsRefresh) return data.access_token
  if (!data.refresh_token) return null

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: data.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) return null

  const refreshed = await res.json().catch(() => null)
  if (!refreshed?.access_token) return null

  const newExpiry = refreshed.expires_in
    ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
    : null

  await supabase.from('google_tokens').update({
    access_token: refreshed.access_token,
    token_expiry: newExpiry,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId)

  return refreshed.access_token
}

function fmtAmount(amount: number | null): string {
  if (!amount) return ''
  return ` – R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getValidToken(user.id, supabase)
  if (!token) return NextResponse.json({ error: 'not_connected' }, { status: 401 })

  const { month, year } = await req.json()
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const lastDay = new Date(year, month, 0).getDate()
  const monthEnd = `${monthStr}-${String(lastDay).padStart(2, '0')}`

  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!(member as any)?.couple_id) return NextResponse.json({ error: 'Nenhum casal configurado' }, { status: 400 })
  const coupleId = (member as any).couple_id

  // Fetch installments for this couple
  const { data: coupleInstallments } = await supabase
    .from('installments')
    .select('id, description, total_parts')
    .eq('couple_id', coupleId)

  const installmentIds = (coupleInstallments ?? []).map((i: any) => i.id)
  const installmentMap = new Map((coupleInstallments ?? []).map((i: any) => [i.id, i]))

  // Fetch unpaid, non-canceled items due this month
  const { data: installItems } = installmentIds.length > 0
    ? await supabase
        .from('installment_items')
        .select('id, due_date, amount, part_number, installment_id')
        .in('installment_id', installmentIds)
        .gte('due_date', `${monthStr}-01`)
        .lte('due_date', monthEnd)
        .eq('paid', false)
        .eq('canceled', false)
    : { data: [] }

  // Fetch active recurring accounts
  const { data: recurring } = await supabase
    .from('recurring_accounts')
    .select('id, name, amount, day_due, type')
    .eq('couple_id', coupleId)
    .eq('active', true)
    .eq('paused', false)

  // Fetch tasks with due_date this month (not done)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, description, status, priority, due_date')
    .eq('couple_id', coupleId)
    .neq('status', 'done')
    .gte('due_date', `${monthStr}-01`)
    .lte('due_date', monthEnd)

  // Busca o parceiro (se tiver Google Calendar conectado)
  const { data: partnerMember } = await supabase
    .from('couple_members')
    .select('user_id')
    .eq('couple_id', coupleId)
    .neq('user_id', user.id)
    .maybeSingle()

  let partnerToken: string | null = null
  if (partnerMember?.user_id) {
    const admin = createAdminClient()
    partnerToken = await getValidToken(partnerMember.user_id, admin)
  }

  // Fetch existing events to detect duplicates via [fin:*] tags
  const timeMin = new Date(year, month - 1, 1).toISOString()
  const timeMax = new Date(year, month, 0, 23, 59, 59).toISOString()
  const calParams = new URLSearchParams({ timeMin, timeMax, singleEvents: 'true', maxResults: '500' })

  async function fetchExistingTags(tkn: string): Promise<Set<string>> {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${calParams}`,
      { headers: { Authorization: `Bearer ${tkn}` } }
    )
    const tags = new Set<string>()
    if (res.ok) {
      const d = await res.json()
      for (const ev of d.items ?? []) {
        const matches = (ev.description ?? '').match(/\[fin:[^\]]+\]/g) ?? []
        matches.forEach((m: string) => tags.add(m))
      }
    }
    return tags
  }

  const existingTags = await fetchExistingTags(token)
  const partnerExistingTags = partnerToken ? await fetchExistingTags(partnerToken) : new Set<string>()

  let created = 0
  let skipped = 0

  const createCalEvent = async (summary: string, date: string, tag: string, colorId: string) => {
    const nextDay = new Date(`${date}T00:00:00`)
    nextDay.setDate(nextDay.getDate() + 1)
    const eventBody = {
      summary,
      description: tag,
      start: { date },
      end: { date: nextDay.toISOString().slice(0, 10) },
      colorId,
    }

    let eventCreated = false

    if (!existingTags.has(tag)) {
      const res = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventBody),
        }
      )
      if (res.ok) { existingTags.add(tag); eventCreated = true }
    }

    if (partnerToken && !partnerExistingTags.has(tag)) {
      const res = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${partnerToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventBody),
        }
      )
      if (res.ok) { partnerExistingTags.add(tag); eventCreated = true }
    }

    if (eventCreated) created++
    else skipped++
  }

  // Sync installment items (colorId 11 = red/rose)
  for (const item of installItems ?? []) {
    const inst = installmentMap.get((item as any).installment_id)
    if (!inst) continue
    const tag = `[fin:INS:${(item as any).id}]`
    const summary = `💳 ${inst.description} (${(item as any).part_number}/${inst.total_parts})${fmtAmount((item as any).amount)}`
    await createCalEvent(summary, (item as any).due_date, tag, '11')
  }

  // Sync recurring accounts (colorId 6 = orange)
  const daysInMonth = new Date(year, month, 0).getDate()
  for (const rec of recurring ?? []) {
    const tag = `[fin:REC:${(rec as any).id}:${monthStr}]`
    const day = Math.min((rec as any).day_due, daysInMonth)
    const date = `${monthStr}-${String(day).padStart(2, '0')}`
    const emoji = (rec as any).type === 'income' ? '💰' : '🔄'
    const summary = `${emoji} ${(rec as any).name}${fmtAmount((rec as any).amount)}`
    await createCalEvent(summary, date, tag, '6')
  }

  // Sync tasks with due date (color by priority)
  const PRIORITY_COLOR: Record<string, string> = {
    urgent: '11', // red
    high: '6',    // orange
    medium: '9',  // blueberry
    low: '7',     // peacock
  }
  for (const task of tasks ?? []) {
    const tag = `[fin:TASK:${(task as any).id}]`
    const statusEmoji = (task as any).status === 'in_progress' ? '🔄' : '☑️'
    const summary = `${statusEmoji} ${(task as any).title}`
    const colorId = PRIORITY_COLOR[(task as any).priority] ?? '9'
    await createCalEvent(summary, (task as any).due_date, tag, colorId)
  }

  return NextResponse.json({ created, skipped })
}
