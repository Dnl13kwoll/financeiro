'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronUp, ChevronDown } from 'lucide-react'

export function AccountSortButtons({
  id,
  sortOrder,
  isFirst,
  isLast,
}: {
  id: string
  sortOrder: number
  isFirst: boolean
  isLast: boolean
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function move(direction: 'up' | 'down') {
    const supabase = createClient()
    const delta = direction === 'up' ? -15 : 15
    await supabase.from('accounts')
      .update({ sort_order: sortOrder + delta })
      .eq('id', id)
    startTransition(() => { router.refresh() })
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={() => move('up')}
        disabled={isFirst}
        className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-default transition-colors"
        title="Mover para cima"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => move('down')}
        disabled={isLast}
        className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-default transition-colors"
        title="Mover para baixo"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
