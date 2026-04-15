'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

export function WishlistVote({
  itemId,
  coupleId,
  userId,
  myVote,
  approveCount,
  rejectCount,
}: {
  itemId: string
  coupleId: string
  userId: string
  myVote: boolean | null
  approveCount: number
  rejectCount: number
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function vote(approved: boolean) {
    setLoading(true)
    const supabase = createClient()
    await (supabase.from('wishlist_votes') as any).upsert(
      { item_id: itemId, couple_id: coupleId, user_id: userId, approved },
      { onConflict: 'item_id,user_id' }
    )
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => vote(true)}
        disabled={loading}
        className={`p-1 rounded transition-colors flex items-center gap-0.5 text-xs ${myVote === true ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-green-500'}`}
        title="Aprovar"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
        {approveCount > 0 && <span>{approveCount}</span>}
      </button>
      <button
        onClick={() => vote(false)}
        disabled={loading}
        className={`p-1 rounded transition-colors flex items-center gap-0.5 text-xs ${myVote === false ? 'text-red-600 bg-red-50' : 'text-gray-300 hover:text-red-400'}`}
        title="Rejeitar"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
        {rejectCount > 0 && <span>{rejectCount}</span>}
      </button>
    </div>
  )
}
