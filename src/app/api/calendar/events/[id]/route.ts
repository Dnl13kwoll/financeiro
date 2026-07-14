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

  const refreshed = await res.json()
  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()

  await supabase.from('google_tokens').update({
    access_token: refreshed.access_token,
    token_expiry: newExpiry,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId)

  return refreshed.access_token
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getValidToken(user.id, supabase)
  if (!token) return NextResponse.json({ error: 'not_connected' }, { status: 401 })

  const { id: eventId } = await params

  // Busca o evento para verificar se tem tag [fin:*] (evento do casal)
  const eventRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  let finTag: string | null = null
  if (eventRes.ok) {
    const ev = await eventRes.json()
    const match = (ev.description ?? '').match(/\[fin:[^\]]+\]/)
    finTag = match ? match[0] : null
  }

  // Exclui do calendário do usuário atual
  const deleteRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
  )

  if (!deleteRes.ok && deleteRes.status !== 404 && deleteRes.status !== 410) {
    return NextResponse.json({ error: 'Falha ao excluir evento' }, { status: deleteRes.status })
  }

  // Se tem tag do casal, exclui também do calendário do parceiro
  if (finTag) {
    const { data: myMember } = await supabase
      .from('couple_members')
      .select('couple_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (myMember?.couple_id) {
      const { data: partnerMember } = await supabase
        .from('couple_members')
        .select('user_id')
        .eq('couple_id', myMember.couple_id)
        .neq('user_id', user.id)
        .maybeSingle()

      if (partnerMember?.user_id) {
        const admin = createAdminClient()
        const partnerToken = await getValidToken(partnerMember.user_id, admin)

        if (partnerToken) {
          // Busca o evento correspondente no calendário do parceiro pela tag
          const searchRes = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?q=${encodeURIComponent(finTag)}&maxResults=10&singleEvents=true`,
            { headers: { Authorization: `Bearer ${partnerToken}` } }
          )

          if (searchRes.ok) {
            const searchData = await searchRes.json()
            const match = (searchData.items ?? []).find(
              (ev: any) => (ev.description ?? '').includes(finTag!)
            )
            if (match) {
              await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events/${match.id}`,
                { method: 'DELETE', headers: { Authorization: `Bearer ${partnerToken}` } }
              )
            }
          }
        }
      }
    }
  }

  return new NextResponse(null, { status: 204 })
}
