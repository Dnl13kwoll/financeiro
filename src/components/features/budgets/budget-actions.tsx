'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

export function BudgetDeleteButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Excluir este orçamento?')) return
    const supabase = createClient()
    await (supabase.from('budgets') as any).delete().eq('id', id)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
      title="Excluir"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}
