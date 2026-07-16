import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getValidToken(userId: string, supabase: any): Promise<string | null> {
  const { data } = await supabase
    .from('google_tokens')
    .select('access_token, refresh_token, token_expiry')
    .eq('user_id', userId)
    .maybeSingle()

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

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getValidToken(user.id, supabase)
  if (!token) return NextResponse.json({ error: 'not_connected' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const timeMin = searchParams.get('timeMin') ?? new Date().toISOString()
  const timeMax = searchParams.get('timeMax')

  const params = new URLSearchParams({
    timeMin,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })
  if (timeMax) params.set('timeMax', timeMax)

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) {
    const err = await res.json()
    return NextResponse.json({ error: err.error?.message ?? 'Falha ao buscar eventos' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json({ events: data.items ?? [] })
}

async function pushToGCal(token: string, body: object) {
  return fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getValidToken(user.id, supabase)
  if (!token) return NextResponse.json({ error: 'not_connected' }, { status: 401 })

  const body = await req.json()

  // Cria evento no calendário do usuário atual
  const res = await pushToGCal(token, body)
  const data = await res.json().catch(() => ({}))

  let partnerSynced = false
  let partnerStatus = 'no_couple'

  if (res.ok) {
    try {
      const { data: myMember } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (myMember?.couple_id) {
        partnerStatus = 'no_service_key'
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (serviceKey && supabaseUrl) {
          partnerStatus = 'no_partner'

          // Busca direta via PostgREST com service role (bypassa RLS sem depender do SDK)
          const pgRes = await fetch(
            `${supabaseUrl}/rest/v1/couple_members?select=user_id&couple_id=eq.${myMember.couple_id}&user_id=neq.${user.id}&limit=1`,
            {
              headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
              },
            }
          )
          const pgRows = await pgRes.json().catch(() => null)
          const partnerId: string | null = Array.isArray(pgRows) ? (pgRows[0]?.user_id ?? null) : null

          if (partnerId) {
            partnerStatus = 'no_token'
            const admin = createAdminClient()
            const partnerToken = await getValidToken(partnerId, admin)
            if (partnerToken) {
              partnerStatus = 'gcal_error'
              const partnerRes = await pushToGCal(partnerToken, body)
              if (partnerRes.ok) {
                partnerSynced = true
                partnerStatus = 'synced'
              } else {
                partnerStatus = 'gcal_error'
              }
            }
          }
        }
      }
    } catch {
      partnerStatus = 'exception'
    }
  }

  return NextResponse.json({ ...data, partnerSynced, partnerStatus }, { status: res.status })
}
