'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark, ChevronDown, Trash2 } from 'lucide-react'
import { showToast } from '@/components/ui/toast'

type Template = {
  id: string
  name: string
  type: string
  amount: number | null
  description: string | null
  category_id: string | null
  account_id: string | null
  tags: string[] | null
}

export function TransactionTemplates({
  coupleId,
  userId,
  onLoad,
}: {
  coupleId: string
  userId: string
  onLoad: (t: Template) => void
}) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('transaction_templates')
        .select('*')
        .eq('couple_id', coupleId)
        .order('name')
      setTemplates(data ?? [])
    }
    load()
  }, [coupleId])

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const supabase = createClient()
    await supabase.from('transaction_templates').delete().eq('id', id)
    setTemplates(prev => prev.filter(t => t.id !== id))
    showToast('Template removido.', 'error')
  }

  if (templates.length === 0) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
      >
        <Bookmark className="w-3.5 h-3.5" />
        Templates
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-64 py-1">
          {templates.map(t => (
            <div
              key={t.id}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer group"
              onClick={() => { onLoad(t); setOpen(false) }}
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{t.name}</p>
                {t.amount && <p className="text-xs text-gray-400">R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}
              </div>
              <button
                onClick={(e) => handleDelete(t.id, e)}
                className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export async function saveTransactionTemplate(coupleId: string, userId: string, template: Omit<Template, 'id'>) {
  const supabase = createClient()
  await supabase.from('transaction_templates').insert({
    ...template,
    couple_id: coupleId,
    user_id: userId,
  })
  showToast('Template salvo!')
}
