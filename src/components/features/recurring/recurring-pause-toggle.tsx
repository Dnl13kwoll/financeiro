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
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    await (supabase.from('recurring_accounts') as any)
      .update({ paused: !paused })
      .eq('id', id)
    showToast(paused ? `"${name}" reativada!` : `"${name}" pausada.`)
    setLoading(false)
    startTransition(() => { router.refresh() })
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={paused ? 'Reativar' : 'Pausar'}
      className={`p-1.5 rounded transition-colors ${
        paused
          ? 'text-green-500 hover:bg-green-50 hover:text-green-600'
          : 'text-gray-400 hover:bg-amber-50 hover:text-amber-500'
      }`}
    >
      {paused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
    </button>
  )
}
