'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { PauseCircle, PlayCircle } from 'lucide-react'

export function RecurringPauseToggle({
  id,
  paused,
  name,
}: {
  id: string
  paused: boolean
  name: string
}) {
  const [optimisticPaused, setOptimisticPaused] = useState(paused)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function toggle() {
    const next = !optimisticPaused
    setOptimisticPaused(next)
    const { error } = await createClient()
      .from('recurring_accounts')
      .update({ paused: next })
      .eq('id', id)
    if (error) {
      setOptimisticPaused(!next)
      showToast('Erro ao atualizar.', 'error')
      return
    }
    showToast(next ? `"${name}" pausada.` : `"${name}" reativada!`)
    startTransition(() => { router.refresh() })
  }

  return (
    <button
      onClick={toggle}
      title={optimisticPaused ? 'Reativar' : 'Pausar'}
      className={`p-1.5 rounded transition-colors ${
        optimisticPaused
          ? 'text-green-500 hover:bg-green-50 hover:text-green-600'
          : 'text-gray-400 hover:bg-amber-50 hover:text-amber-500'
      }`}
    >
      {optimisticPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
    </button>
  )
}
