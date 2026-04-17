import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await request.json()

  // Check user has access to this trip
  const { data: member } = await (supabase as any)
    .from('couple_members').select('couple_id').eq('user_id', user.id).limit(1).maybeSingle()
  if (!member) return NextResponse.json({ error: 'No couple' }, { status: 403 })

  const { data: trip } = await (supabase as any)
    .from('trips').select('id').eq('id', tripId).eq('couple_id', member.couple_id).maybeSingle()
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check if token already exists
  const { data: existing } = await (supabase as any)
    .from('trip_share_tokens').select('token').eq('trip_id', tripId).maybeSingle()
  if (existing) return NextResponse.json({ token: existing.token })

  const { data: tokenRow } = await (supabase as any)
    .from('trip_share_tokens').insert({ trip_id: tripId }).select('token').single()

  return NextResponse.json({ token: tokenRow.token })
}
