'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Circle } from 'lucide-react'

export function ReconcileToggle({ id, reconciled }: { id: string; reconciled: boolean }) {
  const [value, setValue] = useState(reconciled)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('transactions').update({ reconciled: !value }).eq('id', id)
    setValue(v => !v)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={value ? 'Conciliado — clique para desfazer' : 'Marcar como conciliado'}
      className={`p-1.5 rounded transition-colors ${
        value
          ? 'text-green-600 hover:text-green-700'
          : 'text-gray-300 hover:text-green-500'
      }`}
    >
      {value ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
    </button>
  )
}
