import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const refreshed = await res.json()
  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()

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

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getValidToken(user.id, supabase)
  if (!token) return NextResponse.json({ error: 'not_connected' }, { status: 401 })

  const body = await req.json()

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
