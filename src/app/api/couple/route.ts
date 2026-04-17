import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Verifica se já tem casal
  const { data: existing } = await (supabase as any)
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Você já pertence a um casal' }, { status: 400 })
  }

  const coupleId = crypto.randomUUID()

  const { error: coupleErr } = await (supabase as any)
    .from('couples')
    .insert({ id: coupleId, currency: 'BRL' })

  if (coupleErr) {
    return NextResponse.json({ error: coupleErr.message }, { status: 500 })
  }

  const { error: memberErr } = await (supabase as any)
    .from('couple_members')
    .insert({ couple_id: coupleId, user_id: user.id, role: 'owner' })

  if (memberErr) {
    await (supabase as any).from('couples').delete().eq('id', coupleId)
    return NextResponse.json({ error: memberErr.message }, { status: 500 })
  }

  return NextResponse.json({ coupleId })
}
