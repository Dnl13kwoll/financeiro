import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Verifica se o usuário está autenticado
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Verifica se o usuário já tem um casal
  const { data: existing } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Você já pertence a um casal' }, { status: 400 })
  }

  // Usa service role para ignorar RLS e criar o casal
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const coupleId = crypto.randomUUID()

  const { error: coupleErr } = await admin
    .from('couples')
    .insert({ id: coupleId, currency: 'BRL' })

  if (coupleErr) {
    return NextResponse.json({ error: coupleErr.message }, { status: 500 })
  }

  const { error: memberErr } = await admin
    .from('couple_members')
    .insert({ couple_id: coupleId, user_id: user.id, role: 'owner' })

  if (memberErr) {
    // Limpa o casal criado se o membro falhou
    await admin.from('couples').delete().eq('id', coupleId)
    return NextResponse.json({ error: memberErr.message }, { status: 500 })
  }

  return NextResponse.json({ coupleId })
}
