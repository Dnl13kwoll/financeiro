'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export function LeaveCoupleButton({ userId, coupleId }: { userId: string; coupleId: string }) {
  const router = useRouter()

  async function handleLeave() {
    if (!confirm('Tem certeza que deseja sair do casal? Esta ação não pode ser desfeita.')) return
    const supabase = createClient()
    await supabase.from('couple_members')
      .delete()
      .eq('user_id', userId)
      .eq('couple_id', coupleId)
    window.location.href = '/settings'
  }

  return (
    <button
      onClick={handleLeave}
      className="flex items-center gap-2 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Sair do casal
    </button>
  )
}
