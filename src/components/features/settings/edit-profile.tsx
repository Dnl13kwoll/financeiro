'use client'
import { useState, useTransition} from 'react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'

export function EditProfile({ currentName }: { currentName: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleSave() {
    if (!value.trim()) return
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.updateUser({ data: { full_name: value.trim() } })
    // Also update profiles table
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await (supabase.from('profiles') as any)
        .update({ name: value.trim() })
        .eq('id', user.id)
    }
    setLoading(false)
    setEditing(false)
    showToast('Nome atualizado!')
    startTransition(() => { router.refresh() })
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-900">{currentName || '—'}</span>
        <button
          onClick={() => setEditing(true)}
          className="p-1 text-gray-400 hover:text-primary-600 rounded transition-colors"
          title="Editar nome"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
      />
      <button
        onClick={handleSave}
        disabled={loading}
        className="px-2 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? '...' : 'Salvar'}
      </button>
      <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:text-gray-700">
        Cancelar
      </button>
    </div>
  )
}
