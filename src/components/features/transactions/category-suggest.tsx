'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Category = { id: string; name: string; type: 'income' | 'expense' }

export function DescriptionWithSuggest({
  coupleId,
  categories,
  type,
  onCategoryChange,
  defaultValue,
  value: controlledValue,
  onChange: controlledOnChange,
}: {
  coupleId: string | null
  categories: Category[]
  type: 'income' | 'expense' | 'transfer'
  onCategoryChange: (id: string) => void
  defaultValue?: string
  value?: string
  onChange?: (v: string) => void
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')
  const value = controlledValue !== undefined ? controlledValue : internalValue
  function setValue(v: string) {
    setInternalValue(v)
    controlledOnChange?.(v)
  }
  const [suggestion, setSuggestion] = useState<{ categoryId: string; categoryName: string } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSuggestion(null)
    if (!value || value.length < 3 || type === 'transfer' || !coupleId) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase.from('transactions')
        .select('category_id, categories(id, name)')
        .eq('couple_id', coupleId)
        .eq('type', type)
        .ilike('description', `%${value}%`)
        .is('deleted_at', null)
        .not('category_id', 'is', null)
        .limit(20)

      if (!data || data.length === 0) return

      // Conta qual categoria aparece mais
      const freq = new Map<string, { id: string; name: string; count: number }>()
      for (const t of data) {
        const cat = t.categories as { id: string; name: string } | null
        if (!cat) continue
        const entry = freq.get(cat.id) ?? { id: cat.id, name: cat.name, count: 0 }
        entry.count++
        freq.set(cat.id, entry)
      }
      const best = Array.from(freq.values()).sort((a, b) => b.count - a.count)[0]
      if (best) {
        setSuggestion({ categoryId: best.id, categoryName: best.name })
      }
    }, 400)
  }, [value, type, coupleId])

  function applySuggestion() {
    if (!suggestion) return
    onCategoryChange(suggestion.categoryId)
    setSuggestion(null)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
      <input
        name="description"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Opcional"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      {suggestion && (
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-gray-500">Categoria sugerida:</span>
          <button
            type="button"
            onClick={applySuggestion}
            className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full hover:bg-primary-100 transition-colors"
          >
            {suggestion.categoryName} — aplicar
          </button>
        </div>
      )}
    </div>
  )
}
