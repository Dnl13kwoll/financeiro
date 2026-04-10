// Edge Function: Gera registros mensais de recorrentes (cron — rodar no início de cada mês)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date()
  // Referência = primeiro dia do mês atual
  const referenceMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)

  // Busca todos os recorrentes ativos
  const { data: recurring, error: fetchError } = await supabase
    .from('recurring_accounts')
    .select('id')
    .eq('active', true)

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
  }

  if (!recurring || recurring.length === 0) {
    return new Response(JSON.stringify({ message: 'Nenhum recorrente ativo' }))
  }

  // Insere registros apenas se ainda não existirem
  const records = recurring.map((r) => ({
    recurring_id: r.id,
    reference_month: referenceMonth,
    amount: 0, // valor definido pelo usuário depois
    paid: false,
  }))

  const { error: insertError, count } = await supabase
    .from('recurring_records')
    .upsert(records, { onConflict: 'recurring_id,reference_month', ignoreDuplicates: true })

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 })
  }

  return new Response(
    JSON.stringify({ message: `${count ?? 0} registros criados para ${referenceMonth}` }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
