export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Target, Layers, RefreshCw } from 'lucide-react'

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `há ${days}d`
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .single()
  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  if (!coupleId) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="Atividade" />
        <div className="text-center py-16 text-gray-400">Crie um casal em Configurações para começar.</div>
      </div>
    )
  }

  // Fetch recent activity across multiple tables
  const [txRes, goalHistRes, installmentRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, type, amount, description, date, user_id, profiles(name, email)')
      .eq('couple_id', coupleId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(30),
    (supabase.from('goal_history') as any)
      .select('id, amount, note, created_at, goals(name)')
      .limit(10)
      .order('created_at', { ascending: false }),
    (supabase.from('installment_items') as any)
      .select('id, amount, due_date, paid, installments(description, couple_id)')
      .eq('paid', true)
      .order('updated_at', { ascending: false })
      .limit(10),
  ])

  type FeedItem = {
    id: string
    time: string
    icon: React.ReactNode
    text: string
    sub?: string
    color: string
  }

  const feed: FeedItem[] = []

  ;(txRes.data ?? []).forEach((t: any) => {
    const profile = t.profiles as any
    const who = profile?.name ?? profile?.email ?? 'Alguém'
    const icon = t.type === 'income'
      ? <ArrowUpCircle className="w-4 h-4 text-green-500" />
      : t.type === 'expense'
      ? <ArrowDownCircle className="w-4 h-4 text-red-500" />
      : <ArrowLeftRight className="w-4 h-4 text-blue-500" />

    feed.push({
      id: `tx-${t.id}`,
      time: t.date,
      icon,
      text: `${who} ${t.type === 'income' ? 'recebeu' : t.type === 'transfer' ? 'transferiu' : 'gastou'} ${formatCurrency(t.amount)}`,
      sub: t.description ?? undefined,
      color: t.type === 'income' ? 'text-green-600' : t.type === 'expense' ? 'text-red-600' : 'text-blue-600',
    })
  })

  ;(goalHistRes.data ?? []).forEach((h: any) => {
    feed.push({
      id: `gh-${h.id}`,
      time: h.created_at,
      icon: <Target className="w-4 h-4 text-primary-500" />,
      text: `+${formatCurrency(h.amount)} na meta "${(h.goals as any)?.name ?? '—'}"`,
      sub: h.note ?? undefined,
      color: 'text-primary-600',
    })
  })

  // Sort all by time desc
  feed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  return (
    <div className="flex flex-col flex-1">
      <Header title="Feed de Atividade" />

      <div className="p-4 md:p-6 max-w-xl space-y-3">
        {feed.length === 0 && (
          <div className="text-center py-16 text-gray-400">Nenhuma atividade recente.</div>
        )}

        {feed.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-start gap-3">
            <div className="mt-0.5 p-2 rounded-lg bg-gray-50 shrink-0">{item.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{item.text}</p>
              {item.sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{item.sub}</p>}
            </div>
            <span className="text-xs text-gray-400 shrink-0 mt-0.5">{timeAgo(item.time)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
