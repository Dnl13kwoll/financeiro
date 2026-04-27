export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Lista de Desejos' }
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { NewWishlistButton } from '@/components/features/wishlist/new-wishlist-button'
import { WishlistItemActions } from '@/components/features/wishlist/wishlist-item-actions'
import { WishlistVote } from '@/components/features/wishlist/wishlist-vote'
import { ExternalLink } from 'lucide-react'

const priorityLabel: Record<number, { label: string; color: string }> = {
  1: { label: 'Alta', color: 'bg-red-100 text-red-700' },
  2: { label: 'Média', color: 'bg-amber-100 text-amber-700' },
  3: { label: 'Baixa', color: 'bg-gray-100 text-gray-500' },
}

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const itemsRes = coupleId
    ? await supabase.from('wishlist_items')
        .select('*')
        .eq('couple_id', coupleId)
        .order('priority')
        .order('created_at', { ascending: false })
    : null

  const votesRes = coupleId
    ? await supabase.from('wishlist_votes')
        .select('*')
        .eq('couple_id', coupleId)
    : null

  const queryError = itemsRes?.error ?? null

  const items: any[] = (itemsRes?.data ?? []).map((item: any) => ({
    ...item,
    wishlist_votes: (votesRes?.data ?? []).filter((v: any) => v.item_id === item.id),
  }))
  const currentUserId = user!.id
  const pending = items.filter((i) => !i.purchased)
  const purchased = items.filter((i) => i.purchased)
  const totalPending = pending.reduce((s: number, i: any) => s + (i.price ?? 0), 0)

  return (
    <div className="flex flex-col flex-1">
      <Header title="Lista de Desejos" />

      <div className="p-4 md:p-6 space-y-4">
        {queryError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <strong>Erro ao carregar lista:</strong> {(queryError as any).message ?? JSON.stringify(queryError)}
          </div>
        )}
        <div className="flex items-center justify-between">
          {totalPending > 0 && (
            <p className="text-sm text-gray-500">
              {pending.length} {pending.length === 1 ? 'item' : 'itens'} · estimado{' '}
              <span className="font-semibold text-gray-800 financial-value">{formatCurrency(totalPending)}</span>
            </p>
          )}
          <div className="ml-auto">
            {coupleId && <NewWishlistButton coupleId={coupleId} userId={user!.id} />}
          </div>
        </div>

        {pending.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {pending.map((item) => {
              const p = priorityLabel[item.priority] ?? priorityLabel[2]
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${p.color}`}>{p.label}</span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-0.5">
                      {item.price && (
                        <span className="text-xs text-gray-500 financial-value">{formatCurrency(item.price)}</span>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:underline flex items-center gap-0.5"
                        >
                          <ExternalLink className="w-3 h-3" /> Ver link
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 relative z-10">
                    {coupleId && (
                      <WishlistVote
                        itemId={item.id}
                        coupleId={coupleId}
                        userId={currentUserId}
                        myVote={(item.wishlist_votes ?? []).find((v: any) => v.user_id === currentUserId)?.approved ?? null}
                        approveCount={(item.wishlist_votes ?? []).filter((v: any) => v.approved).length}
                        rejectCount={(item.wishlist_votes ?? []).filter((v: any) => !v.approved).length}
                      />
                    )}
                    <WishlistItemActions id={item.id} purchased={false} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {purchased.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2 px-1">Comprados ({purchased.length})</p>
            <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
              {purchased.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 opacity-60">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-600 text-sm line-through">{item.name}</span>
                    {item.price && (
                      <span className="ml-2 text-xs text-gray-400 financial-value">{formatCurrency(item.price)}</span>
                    )}
                  </div>
                  <WishlistItemActions id={item.id} purchased={true} />
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            {coupleId ? 'Nenhum item na lista de desejos.' : 'Crie um casal em Configurações para começar.'}
          </div>
        )}
      </div>
    </div>
  )
}
