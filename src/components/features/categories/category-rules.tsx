'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { Zap, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Rule = {
  id: string
  pattern: string
  match_type: 'contains' | 'starts_with' | 'exact'
  category_id: string
  category_name?: string
}

type Category = { id: string; name: string; type: string }

export function CategoryRules({
  coupleId,
  categories,
  rules: initialRules,
}: {
  coupleId: string
  categories: Category[]
  rules: Rule[]
}) {
  const [open, setOpen] = useState(false)
  const [rules, setRules] = useState<Rule[]>(initialRules)
  const [pattern, setPattern] = useState('')
  const [matchType, setMatchType] = useState<'contains' | 'starts_with' | 'exact'>('contains')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleAdd() {
    if (!pattern.trim() || !categoryId) return
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await (supabase.from('category_rules') as any)
      .insert({ couple_id: coupleId, pattern: pattern.trim(), match_type: matchType, category_id: categoryId })
      .select('id, pattern, match_type, category_id')
      .single()
    if (error) {
      showToast('Erro ao criar regra', 'error')
    } else {
      const cat = categories.find(c => c.id === categoryId)
      setRules(prev => [...prev, { ...data, category_name: cat?.name }])
      setPattern('')
      showToast('Regra criada!')
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await (supabase.from('category_rules') as any).delete().eq('id', id)
    setRules(prev => prev.filter(r => r.id !== id))
    showToast('Regra removida')
  }

  async function handleApplyAll() {
    setLoading(true)
    const supabase = createClient()
    const { data: txs } = await (supabase
      .from('transactions') as any)
      .select('id, description, category_id')
      .eq('couple_id', coupleId)
      .is('deleted_at', null)

    if (!txs) { setLoading(false); return }

    let count = 0
    for (const tx of txs) {
      const desc = (tx.description ?? '').toLowerCase()
      for (const rule of rules) {
        const pat = rule.pattern.toLowerCase()
        const matches =
          rule.match_type === 'contains' ? desc.includes(pat) :
          rule.match_type === 'starts_with' ? desc.startsWith(pat) :
          desc === pat
        if (matches && tx.category_id !== rule.category_id) {
          await (supabase.from('transactions') as any)
            .update({ category_id: rule.category_id })
            .eq('id', tx.id)
          count++
          break
        }
      }
    }

    setLoading(false)
    showToast(`${count} transações categorizadas!`)
    router.refresh()
  }

  const matchLabels = { contains: 'contém', starts_with: 'começa com', exact: 'igual a' }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        title="Regras de auto-categorização"
      >
        <Zap className="w-4 h-4" />
        Regras
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Regras de Auto-categorização">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Defina padrões de descrição para categorizar transações automaticamente.
          </p>

          {/* Add rule */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nova regra</p>
            <div className="flex gap-2">
              <select
                value={matchType}
                onChange={e => setMatchType(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="contains">Contém</option>
                <option value="starts_with">Começa com</option>
                <option value="exact">Igual a</option>
              </select>
              <input
                value={pattern}
                onChange={e => setPattern(e.target.value)}
                placeholder="texto da descrição..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={loading || !pattern.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>
          </div>

          {/* Rules list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {rules.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma regra criada ainda.</p>
            )}
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg bg-white">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-400">{matchLabels[rule.match_type]} </span>
                  <span className="text-sm font-medium text-gray-800">&ldquo;{rule.pattern}&rdquo;</span>
                  <span className="text-xs text-gray-400 ml-2">→ {rule.category_name ?? '?'}</span>
                </div>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Apply button */}
          {rules.length > 0 && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleApplyAll}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                <Zap className="w-4 h-4" />
                {loading ? 'Aplicando...' : 'Aplicar a todas as transações'}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

/** Apply rules to a description string, returns matching category_id or null */
export function applyRules(description: string, rules: Rule[]): string | null {
  const desc = description.toLowerCase()
  for (const rule of rules) {
    const pat = rule.pattern.toLowerCase()
    const matches =
      rule.match_type === 'contains' ? desc.includes(pat) :
      rule.match_type === 'starts_with' ? desc.startsWith(pat) :
      desc === pat
    if (matches) return rule.category_id
  }
  return null
}
