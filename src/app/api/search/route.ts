import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) return NextResponse.json({ results: [] })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberRes = await supabase
    .from('couple_members').select('couple_id')
    .eq('user_id', user.id).limit(1).maybeSingle()
  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null
  if (!coupleId) return NextResponse.json({ results: [] })

  const pattern = `%${q}%`

  const [txRes, goalsRes, invRes, budgetsRes] = await Promise.all([
    // Transações
    supabase.from('transactions')
      .select('id, description, amount, type, competence_date, categories(name)')
      .eq('couple_id', coupleId)
      .is('deleted_at', null)
      .ilike('description', pattern)
      .order('competence_date', { ascending: false })
      .limit(8),

    // Metas
    (supabase.from('goals') as any)
      .select('id, name, current_amount, target_amount')
      .eq('couple_id', coupleId)
      .ilike('name', pattern)
      .limit(5),

    // Investimentos
    (supabase.from('investments') as any)
      .select('id, name, type, invested_amount, active')
      .eq('couple_id', coupleId)
      .ilike('name', pattern)
      .limit(5),

    // Orçamentos (busca por categoria)
    (supabase.from('budgets') as any)
      .select('id, category, amount, month')
      .eq('couple_id', coupleId)
      .ilike('category', pattern)
      .order('month', { ascending: false })
      .limit(4),
  ])

  const results: Array<{ type: string; id: string; label: string; sub?: string; href: string; amount?: number }> = []

  for (const tx of (txRes.data ?? []) as any[]) {
    results.push({
      type: 'transaction',
      id: tx.id,
      label: tx.description ?? '(sem descrição)',
      sub: `${tx.type === 'income' ? 'Receita' : tx.type === 'expense' ? 'Despesa' : 'Transferência'} · ${new Date(tx.competence_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}${(tx.categories as any)?.name ? ` · ${(tx.categories as any).name}` : ''}`,
      href: `/transactions?q=${encodeURIComponent(tx.description ?? '')}`,
      amount: tx.amount,
    })
  }

  for (const g of (goalsRes.data ?? []) as any[]) {
    const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0
    results.push({
      type: 'goal',
      id: g.id,
      label: g.name,
      sub: `Meta · ${pct}% concluída`,
      href: '/goals',
      amount: g.target_amount,
    })
  }

  for (const inv of (invRes.data ?? []) as any[]) {
    results.push({
      type: 'investment',
      id: inv.id,
      label: inv.name,
      sub: `Investimento · ${inv.type}${!inv.active ? ' (arquivado)' : ''}`,
      href: '/investments',
      amount: inv.invested_amount,
    })
  }

  for (const b of (budgetsRes.data ?? []) as any[]) {
    const monthLabel = new Date(b.month + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    results.push({
      type: 'budget',
      id: b.id,
      label: b.category,
      sub: `Orçamento · ${monthLabel}`,
      href: '/budgets',
      amount: b.amount,
    })
  }

  return NextResponse.json({ results })
}
