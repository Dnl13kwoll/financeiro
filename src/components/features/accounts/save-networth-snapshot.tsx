'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { Camera } from 'lucide-react'

export function SaveNetworthSnapshot({
  coupleId,
  assets,
  liabilities,
  netWorth,
  month,
}: {
  coupleId: string
  assets: number
  liabilities: number
  netWorth: number
  month: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSave() {
    setLoading(true)
    const supabase = createClient()
    await (supabase.from('networth_snapshots') as any).upsert(
      { couple_id: coupleId, month, assets, liabilities, net_worth: netWorth },
      { onConflict: 'couple_id,month' }
    )
    setLoading(false)
    showToast('Snapshot salvo!')
    router.refresh()
  }

  return (
    <button
      onClick={handleSave}
      disabled={loading}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-primary-300 transition-colors disabled:opacity-50"
      title="Salvar snapshot do patrimônio deste mês"
    >
      <Camera className="w-4 h-4" />
      {loading ? 'Salvando...' : 'Salvar snapshot'}
    </button>
  )
}
