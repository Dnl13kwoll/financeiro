'use client'
import { useState } from 'react'
import { Plus, X, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { showToast } from '@/components/ui/toast'
import {
  TYPE_LABELS, TYPE_GROUPS, RATE_LABELS, LIQUIDITY_OPTIONS,
  type InvestmentType, type RateType,
} from './investment-constants'

// ── Tipos que têm campo de taxa ───────────────────────────────────────────────
const RATE_TYPES: InvestmentType[] = [
  'cdb', 'lci', 'lca', 'poupanca',
  'tesouro_selic', 'tesouro_ipca', 'tesouro_pre',
  'fundo_di', 'fundo_multi',
]

const MATURITY_TYPES: InvestmentType[] = [
  'cdb', 'lci', 'lca',
  'tesouro_selic', 'tesouro_ipca', 'tesouro_pre',
  'pgbl', 'vgbl',
]

function InvestmentForm({
  coupleId, userId, goals, initial, onClose, onSave,
}: {
  coupleId: string
  userId: string
  goals: { id: string; name: string }[]
  initial?: any
  onClose: () => void
  onSave: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<InvestmentType>(initial?.type ?? 'cdb')
  const [institution, setInstitution] = useState(initial?.institution ?? '')
  const [invested, setInvested] = useState(initial?.invested_amount?.toString() ?? '')
  const [currentVal, setCurrentVal] = useState(initial?.current_value?.toString() ?? '')
  const [rateType, setRateType] = useState<RateType | ''>(initial?.rate_type ?? '')
  const [rateValue, setRateValue] = useState(initial?.rate_value?.toString() ?? '')
  const [maturity, setMaturity] = useState(initial?.maturity_date ?? '')
  const [startDate, setStartDate] = useState(initial?.start_date ?? new Date().toISOString().slice(0, 10))
  const [liquidity, setLiquidity] = useState(initial?.liquidity ?? '')
  const [goalId, setGoalId] = useState(initial?.goal_id ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const showRate = RATE_TYPES.includes(type)
  const showMaturity = MATURITY_TYPES.includes(type)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !invested) return
    setLoading(true)
    const supabase = createClient()
    const payload = {
      couple_id: coupleId,
      created_by: userId,
      name: name.trim(),
      type,
      institution: institution.trim() || null,
      invested_amount: parseFloat(invested),
      current_value: currentVal ? parseFloat(currentVal) : null,
      rate_type: rateType || null,
      rate_value: rateValue ? parseFloat(rateValue) : null,
      maturity_date: maturity || null,
      start_date: startDate,
      liquidity: liquidity || null,
      goal_id: goalId || null,
      notes: notes.trim() || null,
      last_updated_at: currentVal ? new Date().toISOString().slice(0, 10) : null,
    }
    let error
    if (initial?.id) {
      ;({ error } = await (supabase.from('investments') as any).update(payload).eq('id', initial.id))
    } else {
      ;({ error } = await (supabase.from('investments') as any).insert(payload))
    }
    setLoading(false)
    if (error) { showToast('Erro: ' + error.message, 'error'); return }
    showToast(initial?.id ? 'Investimento atualizado!' : 'Investimento cadastrado!')
    onSave()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between sticky top-0 bg-white pb-2">
          <h2 className="font-semibold text-gray-900">{initial?.id ? 'Editar investimento' : 'Novo investimento'}</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tipo */}
        <div>
          <label className="text-xs text-gray-500 font-medium">Tipo *</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as InvestmentType)}
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
          >
            {TYPE_GROUPS.map(g => (
              <optgroup key={g.label} label={g.label}>
                {g.types.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Nome e Instituição */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium">Nome *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`Ex: ${TYPE_LABELS[type]} Nubank`}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Banco / Corretora</label>
            <input
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              placeholder="Ex: Nubank, XP, Rico"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        </div>

        {/* Valores */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium">Valor investido (R$) *</label>
            <input
              type="number" min="0" step="0.01" required
              value={invested}
              onChange={e => setInvested(e.target.value)}
              placeholder="0,00"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Valor atual (R$)</label>
            <input
              type="number" min="0" step="0.01"
              value={currentVal}
              onChange={e => setCurrentVal(e.target.value)}
              placeholder="Deixe em branco para estimar"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        </div>

        {/* Rentabilidade */}
        {showRate && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Tipo de rentabilidade</label>
              <select
                value={rateType}
                onChange={e => setRateType(e.target.value as RateType | '')}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
              >
                <option value="">Selecionar</option>
                {(Object.entries(RATE_LABELS) as [RateType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">
                {rateType === 'pct_cdi' ? '% do CDI' :
                 rateType === 'selic' ? '% da SELIC' :
                 rateType === 'ipca_plus' ? 'IPCA + (% a.a.)' :
                 rateType === 'fixed' ? 'Taxa % a.a.' : 'Valor'}
              </label>
              <input
                type="number" min="0" step="0.01"
                value={rateValue}
                onChange={e => setRateValue(e.target.value)}
                placeholder={rateType === 'pct_cdi' ? '100' : rateType === 'ipca_plus' ? '5.50' : '13.75'}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>
        )}

        {/* Datas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium">Data de início</label>
            <input
              type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          {showMaturity && (
            <div>
              <label className="text-xs text-gray-500 font-medium">Vencimento</label>
              <input
                type="date" value={maturity}
                onChange={e => setMaturity(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          )}
        </div>

        {/* Liquidez */}
        <div>
          <label className="text-xs text-gray-500 font-medium">Liquidez</label>
          <select
            value={liquidity}
            onChange={e => setLiquidity(e.target.value)}
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
          >
            <option value="">Selecionar</option>
            {LIQUIDITY_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Meta vinculada */}
        {goals.length > 0 && (
          <div>
            <label className="text-xs text-gray-500 font-medium">Vincular a uma meta (opcional)</label>
            <select
              value={goalId}
              onChange={e => setGoalId(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
            >
              <option value="">Nenhuma</option>
              {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className="text-xs text-gray-500 font-medium">Observações</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Ex: resgate automático, imposto de renda, estratégia..."
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
          <button
            type="submit"
            disabled={loading || !name.trim() || !invested}
            className="px-4 py-2 bg-primary-600 text-white text-sm rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Salvando...' : (initial?.id ? 'Salvar alterações' : 'Cadastrar')}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── New Investment Button ─────────────────────────────────────────────────────
export function NewInvestmentButton({ coupleId, userId, goals }: {
  coupleId: string; userId: string; goals: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-4 h-4" /> Novo investimento
      </button>
      {open && (
        <InvestmentForm
          coupleId={coupleId} userId={userId} goals={goals}
          onClose={() => setOpen(false)} onSave={() => setOpen(false)}
        />
      )}
    </>
  )
}

// ── Edit Button ───────────────────────────────────────────────────────────────
export function EditInvestmentButton({ investment, goals }: {
  investment: any; goals: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors" title="Editar">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      {open && (
        <InvestmentForm
          coupleId={investment.couple_id} userId={investment.created_by}
          goals={goals} initial={investment}
          onClose={() => setOpen(false)} onSave={() => setOpen(false)}
        />
      )}
    </>
  )
}

// ── Update Current Value ──────────────────────────────────────────────────────
export function UpdateValueButton({ id, currentValue }: { id: string; currentValue: number | null }) {
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState(currentValue?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function save() {
    if (!val) return
    setLoading(true)
    const { error } = await (createClient().from('investments') as any)
      .update({ current_value: parseFloat(val), last_updated_at: new Date().toISOString().slice(0, 10) })
      .eq('id', id)
    setLoading(false)
    if (error) { showToast('Erro: ' + error.message, 'error'); return }
    showToast('Valor atualizado!')
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Atualizar valor atual">
        <RefreshCw className="w-3.5 h-3.5" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus type="number" min="0" step="0.01"
        value={val} onChange={e => setVal(e.target.value)}
        placeholder="Valor atual"
        className="w-28 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-300"
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false) }}
      />
      <button onClick={save} disabled={loading}
        className="text-xs px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">
        {loading ? '...' : 'OK'}
      </button>
      <button onClick={() => setOpen(false)} className="text-xs px-1.5 py-1 text-gray-400 hover:text-gray-600">✕</button>
    </div>
  )
}

// ── Archive / Delete ──────────────────────────────────────────────────────────
export function InvestmentMenuButton({ id, active }: { id: string; active: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggleActive() {
    setLoading(true)
    await (createClient().from('investments') as any).update({ active: !active }).eq('id', id)
    setLoading(false)
    router.refresh()
  }

  async function del() {
    if (!confirm('Excluir este investimento permanentemente?')) return
    setLoading(true)
    await (createClient().from('investments') as any).delete().eq('id', id)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-0.5">
      <button onClick={toggleActive} disabled={loading}
        className={`p-1.5 rounded-lg text-xs transition-colors ${active ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-amber-500 hover:text-gray-600 hover:bg-gray-50'}`}
        title={active ? 'Arquivar' : 'Reativar'}>
        {active ? '📦' : '↩️'}
      </button>
      <button onClick={del} disabled={loading}
        className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Excluir">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
