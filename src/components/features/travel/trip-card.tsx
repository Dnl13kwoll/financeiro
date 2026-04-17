'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import {
  MapPin, Hotel, Car, Utensils, ShoppingBag, FileText, Star,
  ChevronDown, ChevronUp, X, Plus, Check, ExternalLink,
  ArrowUp, ArrowDown, Trash2, Users, Target, Link2
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export type Trip = { id: string; name: string; destination: string; start_date: string | null; end_date: string | null; budget: number; status: string; notes: string | null; goal_id: string | null }
export type Expense = { id: string; category: string; description: string; estimated: number; actual: number | null; paid: boolean; notes: string | null; foreign_currency: string | null; exchange_rate: number; foreign_amount: number | null }
export type Place = { id: string; name: string; type: string; address: string | null; notes: string | null; status: string; sort_order: number; maps_url: string | null }
export type ChecklistItem = { id: string; label: string; checked: boolean; sort_order: number }
export type Companion = { id: string; name: string }
export type Quote = { id: string; category: string; description: string; provider: string | null; amount: number; currency: string; exchange_rate: number; notes: string | null; chosen: boolean }
export type Goal = { id: string; name: string; target_amount: number; current_amount: number }

// ─── Constants ────────────────────────────────────────────────────────────────
const categoryLabel: Record<string, string> = { hospedagem: 'Hospedagem', transporte: 'Transporte', passeios: 'Passeios', alimentacao: 'Alimentação', compras: 'Compras', documentos: 'Documentos', outros: 'Outros' }
const categoryIcon: Record<string, React.ReactNode> = { hospedagem: <Hotel className="w-3.5 h-3.5" />, transporte: <Car className="w-3.5 h-3.5" />, passeios: <Star className="w-3.5 h-3.5" />, alimentacao: <Utensils className="w-3.5 h-3.5" />, compras: <ShoppingBag className="w-3.5 h-3.5" />, documentos: <FileText className="w-3.5 h-3.5" />, outros: <MapPin className="w-3.5 h-3.5" /> }
const categoryColor: Record<string, string> = { hospedagem: '#16a34a', transporte: '#3b82f6', passeios: '#f59e0b', alimentacao: '#ef4444', compras: '#8b5cf6', documentos: '#0ea5e9', outros: '#6b7280' }
const placeTypeLabel: Record<string, string> = { tourist: 'Turístico', restaurant: 'Restaurante', hotel: 'Hotel', transport: 'Transporte', other: 'Outro' }
const statusBadge: Record<string, string> = { planning: 'bg-blue-100 text-blue-700', confirmed: 'bg-green-100 text-green-700', completed: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-700' }
const statusLabel: Record<string, string> = { planning: 'Planejando', confirmed: 'Confirmada', completed: 'Concluída', cancelled: 'Cancelada' }
const placeStatus: Record<string, { label: string; color: string }> = { wishlist: { label: 'Quero ir', color: 'bg-amber-100 text-amber-700' }, confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' }, visited: { label: 'Visitado', color: 'bg-green-100 text-green-700' } }
const CURRENCIES = ['BRL', 'USD', 'EUR', 'GBP', 'ARS', 'CLP', 'PYG', 'UYU', 'JPY']
const DEFAULT_CHECKLIST = ['Passaporte', 'Seguro viagem', 'Visto (se necessário)', 'Vacinas', 'Reserva de hotel confirmada', 'Passagem aérea', 'Dinheiro/cartão internacional', 'Adaptador de tomada']

// ─── Pie Chart ────────────────────────────────────────────────────────────────
function PieChart({ expenses }: { expenses: Expense[] }) {
  const byCategory = Object.keys(categoryLabel).reduce((acc, cat) => {
    const total = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.estimated * e.exchange_rate, 0)
    if (total > 0) acc[cat] = total
    return acc
  }, {} as Record<string, number>)

  const entries = Object.entries(byCategory)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0 || entries.length === 0) return null

  function polar(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg - 90) * Math.PI / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  function arc(cx: number, cy: number, r: number, s: number, e: number) {
    const a = polar(cx, cy, r, s), b = polar(cx, cy, r, e)
    return `M${cx},${cy} L${a.x},${a.y} A${r},${r} 0 ${e - s > 180 ? 1 : 0} 1 ${b.x},${b.y} Z`
  }

  let angle = 0
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0">
        {entries.map(([cat, val]) => {
          const sweep = (val / total) * 360
          const path = arc(50, 50, 45, angle, angle + sweep)
          angle += sweep
          return <path key={cat} d={path} fill={categoryColor[cat]} />
        })}
      </svg>
      <div className="space-y-1">
        {entries.map(([cat, val]) => (
          <div key={cat} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: categoryColor[cat] }} />
            <span>{categoryLabel[cat]}</span>
            <span className="text-gray-400 ml-1">{Math.round((val / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Card ────────────────────────────────────────────────────────────────
export function TripCard({ trip, expenses, places: initialPlaces, checklists: initialChecklists, companions: initialCompanions, quotes, goals }: {
  trip: Trip; expenses: Expense[]; places: Place[]; checklists: ChecklistItem[]; companions: Companion[]; quotes: Quote[]; goals: Goal[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [expanded, setExpanded] = useState(true)
  const [tab, setTab] = useState<'budget' | 'places' | 'checklist' | 'companions'>('budget')

  // local state for optimistic UI
  const [places, setPlaces] = useState(initialPlaces)
  const [checklists, setChecklists] = useState(initialChecklists)
  const [companions, setCompanions] = useState(initialCompanions)

  // Expense form
  const [showExpForm, setShowExpForm] = useState(false)
  const [expCat, setExpCat] = useState('hospedagem')
  const [expDesc, setExpDesc] = useState('')
  const [expEst, setExpEst] = useState('')
  const [expActual, setExpActual] = useState('')
  const [expCurrency, setExpCurrency] = useState('BRL')
  const [expRate, setExpRate] = useState('1')

  // Place form
  const [showPlaceForm, setShowPlaceForm] = useState(false)
  const [placeName, setPlaceName] = useState('')
  const [placeType, setPlaceType] = useState('tourist')
  const [placeAddr, setPlaceAddr] = useState('')
  const [placeMaps, setPlaceMaps] = useState('')
  const [placeNotes, setPlaceNotes] = useState('')

  // Checklist form
  const [checkInput, setCheckInput] = useState('')

  // Companion form
  const [companionInput, setCompanionInput] = useState('')

  // Quote form
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [quoteCat, setQuoteCat] = useState('hospedagem')
  const [quoteDesc, setQuoteDesc] = useState('')
  const [quoteProvider, setQuoteProvider] = useState('')
  const [quoteAmount, setQuoteAmount] = useState('')
  const [quoteCurrency, setQuoteCurrency] = useState('BRL')
  const [quoteRate, setQuoteRate] = useState('1')
  const [quoteNotes, setQuoteNotes] = useState('')

  // Budget summary
  const totalEst = expenses.reduce((s, e) => s + e.estimated * e.exchange_rate, 0)
  const totalActual = expenses.reduce((s, e) => s + (e.actual ?? e.estimated) * e.exchange_rate, 0)
  const totalPaid = expenses.filter(e => e.paid).reduce((s, e) => s + (e.actual ?? e.estimated) * e.exchange_rate, 0)
  const budgetPct = trip.budget > 0 ? Math.min(100, (totalEst / trip.budget) * 100) : 0
  const overBudget = trip.budget > 0 && totalEst > trip.budget
  const linkedGoal = goals.find(g => g.id === trip.goal_id)

  // ── Expense actions ──────────────────────────────────────────────────────────
  async function addExpense() {
    if (!expDesc || !expEst) return
    const rate = parseFloat(expRate) || 1
    const est = parseFloat(expEst) || 0
    await (supabase.from('trip_expenses') as any).insert({
      trip_id: trip.id, category: expCat, description: expDesc,
      estimated: expCurrency === 'BRL' ? est : est * rate,
      foreign_currency: expCurrency !== 'BRL' ? expCurrency : null,
      exchange_rate: rate,
      foreign_amount: expCurrency !== 'BRL' ? est : null,
      actual: expActual ? (expCurrency === 'BRL' ? parseFloat(expActual) : parseFloat(expActual) * rate) : null,
    })
    setExpDesc(''); setExpEst(''); setExpActual(''); setExpCurrency('BRL'); setExpRate('1')
    setShowExpForm(false); router.refresh()
  }

  async function togglePaid(exp: Expense) {
    await (supabase.from('trip_expenses') as any).update({ paid: !exp.paid }).eq('id', exp.id)
    router.refresh()
  }

  async function deleteExpense(id: string) {
    await (supabase.from('trip_expenses') as any).delete().eq('id', id)
    router.refresh()
  }

  // ── Place actions ────────────────────────────────────────────────────────────
  async function addPlace() {
    if (!placeName) return
    const maxOrder = places.length > 0 ? Math.max(...places.map(p => p.sort_order)) + 1 : 0
    const { data } = await (supabase.from('trip_places') as any).insert({
      trip_id: trip.id, name: placeName, type: placeType,
      address: placeAddr || null, maps_url: placeMaps || null,
      notes: placeNotes || null, sort_order: maxOrder,
    }).select().single()
    if (data) setPlaces(prev => [...prev, data])
    setPlaceName(''); setPlaceAddr(''); setPlaceMaps(''); setPlaceNotes('')
    setShowPlaceForm(false)
  }

  async function cycleStatus(place: Place) {
    const cycle = ['wishlist', 'confirmed', 'visited']
    const next = cycle[(cycle.indexOf(place.status) + 1) % cycle.length]
    await (supabase.from('trip_places') as any).update({ status: next }).eq('id', place.id)
    setPlaces(prev => prev.map(p => p.id === place.id ? { ...p, status: next } : p))
  }

  async function movePlace(place: Place, dir: 'up' | 'down') {
    const sorted = [...places].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex(p => p.id === place.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const other = sorted[swapIdx]
    await Promise.all([
      (supabase.from('trip_places') as any).update({ sort_order: other.sort_order }).eq('id', place.id),
      (supabase.from('trip_places') as any).update({ sort_order: place.sort_order }).eq('id', other.id),
    ])
    setPlaces(prev => prev.map(p =>
      p.id === place.id ? { ...p, sort_order: other.sort_order } :
      p.id === other.id ? { ...p, sort_order: place.sort_order } : p
    ))
  }

  async function deletePlace(id: string) {
    await (supabase.from('trip_places') as any).delete().eq('id', id)
    setPlaces(prev => prev.filter(p => p.id !== id))
  }

  // ── Checklist actions ────────────────────────────────────────────────────────
  async function addDefaultChecklist() {
    const existing = new Set(checklists.map(c => c.label))
    const toAdd = DEFAULT_CHECKLIST.filter(l => !existing.has(l))
    if (toAdd.length === 0) return
    const rows = toAdd.map((label, i) => ({ trip_id: trip.id, label, sort_order: checklists.length + i }))
    const { data } = await (supabase.from('trip_checklists') as any).insert(rows).select()
    if (data) setChecklists(prev => [...prev, ...data])
  }

  async function addCheckItem() {
    if (!checkInput.trim()) return
    const { data } = await (supabase.from('trip_checklists') as any).insert({
      trip_id: trip.id, label: checkInput.trim(), sort_order: checklists.length,
    }).select().single()
    if (data) setChecklists(prev => [...prev, data])
    setCheckInput('')
  }

  async function toggleCheck(item: ChecklistItem) {
    await (supabase.from('trip_checklists') as any).update({ checked: !item.checked }).eq('id', item.id)
    setChecklists(prev => prev.map(c => c.id === item.id ? { ...c, checked: !c.checked } : c))
  }

  async function deleteCheck(id: string) {
    await (supabase.from('trip_checklists') as any).delete().eq('id', id)
    setChecklists(prev => prev.filter(c => c.id !== id))
  }

  // ── Companion actions ────────────────────────────────────────────────────────
  async function addCompanion() {
    if (!companionInput.trim()) return
    const { data } = await (supabase.from('trip_companions') as any).insert({ trip_id: trip.id, name: companionInput.trim() }).select().single()
    if (data) setCompanions(prev => [...prev, data])
    setCompanionInput('')
  }

  async function deleteCompanion(id: string) {
    await (supabase.from('trip_companions') as any).delete().eq('id', id)
    setCompanions(prev => prev.filter(c => c.id !== id))
  }

  // ── Quote actions ────────────────────────────────────────────────────────────
  async function addQuote() {
    if (!quoteDesc || !quoteAmount) return
    const rate = parseFloat(quoteRate) || 1
    const amt = parseFloat(quoteAmount) || 0
    await (supabase.from('trip_quotes') as any).insert({
      trip_id: trip.id, category: quoteCat, description: quoteDesc,
      provider: quoteProvider || null, amount: quoteCurrency === 'BRL' ? amt : amt * rate,
      currency: quoteCurrency, exchange_rate: rate, notes: quoteNotes || null,
    })
    setQuoteDesc(''); setQuoteProvider(''); setQuoteAmount(''); setQuoteCurrency('BRL'); setQuoteRate('1'); setQuoteNotes('')
    setShowQuoteForm(false); router.refresh()
  }

  async function toggleChosen(q: Quote) {
    await (supabase.from('trip_quotes') as any).update({ chosen: !q.chosen }).eq('id', q.id)
    router.refresh()
  }

  async function deleteQuote(id: string) {
    await (supabase.from('trip_quotes') as any).delete().eq('id', id)
    router.refresh()
  }

  async function deleteTrip() {
    if (!confirm('Excluir esta viagem e todos os dados?')) return
    await (supabase.from('trips') as any).delete().eq('id', trip.id)
    router.refresh()
  }

  const sortedPlaces = [...places].sort((a, b) => a.sort_order - b.sort_order)
  const checkedCount = checklists.filter(c => c.checked).length
  const groupedExpenses = Object.keys(categoryLabel).reduce((acc, cat) => {
    const items = expenses.filter(e => e.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, Expense[]>)

  const inputCls = "border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full"

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-lg leading-tight">{trip.name}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[trip.status] ?? statusBadge.planning}`}>
                {statusLabel[trip.status]}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-gray-500 text-sm">
                <MapPin className="w-3.5 h-3.5" />{trip.destination}
              </span>
              {trip.start_date && (
                <span className="text-xs text-gray-400">
                  {new Date(trip.start_date).toLocaleDateString('pt-BR')}
                  {trip.end_date && ` → ${new Date(trip.end_date).toLocaleDateString('pt-BR')}`}
                </span>
              )}
              {companions.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="w-3 h-3" />
                  {companions.map(c => c.name).join(', ')}
                </span>
              )}
            </div>
            {linkedGoal && (
              <div className="mt-1.5 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-primary-500" />
                <span className="text-xs text-primary-600 font-medium">{linkedGoal.name}</span>
                <div className="flex-1 max-w-[120px] bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 bg-primary-500 rounded-full"
                    style={{ width: `${Math.min(100, (linkedGoal.current_amount / linkedGoal.target_amount) * 100)}%` }} />
                </div>
                <span className="text-xs text-gray-400">
                  {Math.round((linkedGoal.current_amount / linkedGoal.target_amount) * 100)}%
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={deleteTrip} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={() => setExpanded(v => !v)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Budget bar */}
        {trip.budget > 0 && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Orçamento: <strong className="text-gray-700">{formatCurrency(trip.budget)}</strong></span>
              <span className={overBudget ? 'text-red-600 font-semibold' : ''}>Estimado: {formatCurrency(totalEst)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full transition-all ${overBudget ? 'bg-red-500' : budgetPct > 80 ? 'bg-amber-500' : 'bg-primary-500'}`}
                style={{ width: `${budgetPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Pago: <span className="text-green-600 font-medium">{formatCurrency(totalPaid)}</span></span>
              <span>Real: <span className="font-medium text-gray-600">{formatCurrency(totalActual)}</span></span>
            </div>
          </div>
        )}
      </div>

      {expanded && (
        <>
          {/* ── Tabs ── */}
          <div className="flex border-b border-gray-100 text-xs font-medium overflow-x-auto">
            {([
              ['budget', `Orçamento (${expenses.length})`],
              ['places', `Roteiro (${places.length})`],
              ['checklist', `Checklist (${checkedCount}/${checklists.length})`],
              ['companions', `Companheiros (${companions.length})`],
            ] as [typeof tab, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-4 py-2.5 whitespace-nowrap transition-colors ${tab === key ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* ── Budget Tab ── */}
          {tab === 'budget' && (
            <div className="p-4 space-y-4">
              {expenses.length > 0 && <PieChart expenses={expenses} />}

              {Object.entries(groupedExpenses).map(([cat, items]) => (
                <div key={cat}>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    <span style={{ color: categoryColor[cat] }}>{categoryIcon[cat]}</span>
                    <span>{categoryLabel[cat]}</span>
                    <span className="ml-auto font-normal normal-case text-gray-400">
                      {formatCurrency(items.reduce((s, e) => s + e.estimated * e.exchange_rate, 0))}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map(exp => (
                      <div key={exp.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${exp.paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <button onClick={() => togglePaid(exp)} className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${exp.paid ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                          {exp.paid && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span className={`flex-1 truncate ${exp.paid ? 'line-through text-gray-400' : 'text-gray-700'}`}>{exp.description}</span>
                        <div className="text-right shrink-0">
                          <span className="font-medium">{formatCurrency(exp.estimated * exp.exchange_rate)}</span>
                          {exp.foreign_currency && (
                            <span className="block text-xs text-gray-400">{exp.foreign_amount ?? exp.estimated} {exp.foreign_currency} × {exp.exchange_rate}</span>
                          )}
                        </div>
                        <button onClick={() => deleteExpense(exp.id)} className="text-gray-300 hover:text-red-500 ml-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {expenses.length === 0 && !showExpForm && (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum item no orçamento.</p>
              )}

              {showExpForm ? (
                <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2">
                    <select value={expCat} onChange={e => setExpCat(e.target.value)} className={inputCls}>
                      {Object.entries(categoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Descrição" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" value={expEst} onChange={e => setExpEst(e.target.value)} placeholder="Valor" className={inputCls} />
                    <select value={expCurrency} onChange={e => setExpCurrency(e.target.value)} className={inputCls}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {expCurrency !== 'BRL' && (
                      <input type="number" value={expRate} onChange={e => setExpRate(e.target.value)} placeholder="Cotação (R$)" className={inputCls} />
                    )}
                  </div>
                  {expCurrency !== 'BRL' && expEst && expRate && (
                    <p className="text-xs text-gray-400">= {formatCurrency(parseFloat(expEst) * parseFloat(expRate))} em reais</p>
                  )}
                  <input type="number" value={expActual} onChange={e => setExpActual(e.target.value)} placeholder="Valor real (opcional)" className={inputCls} />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowExpForm(false)} className="px-3 py-1.5 text-sm text-gray-600">Cancelar</button>
                    <button onClick={addExpense} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Adicionar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowExpForm(true)} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  <Plus className="w-4 h-4" /> Adicionar item
                </button>
              )}

              {/* Cotações comparativas */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cotações comparativas</p>
                {quotes.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {quotes.map(q => (
                      <div key={q.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${q.chosen ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'}`}>
                        <button onClick={() => toggleChosen(q)} className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${q.chosen ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                          {q.chosen && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-700 truncate block">{q.description}</span>
                          {q.provider && <span className="text-xs text-gray-400">{q.provider}</span>}
                        </div>
                        <span className="font-medium text-gray-700 shrink-0">{formatCurrency(q.amount)}</span>
                        {q.currency !== 'BRL' && <span className="text-xs text-gray-400">{q.currency}</span>}
                        <button onClick={() => deleteQuote(q.id)} className="text-gray-300 hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {showQuoteForm ? (
                  <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      <select value={quoteCat} onChange={e => setQuoteCat(e.target.value)} className={inputCls}>
                        {Object.entries(categoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <input value={quoteDesc} onChange={e => setQuoteDesc(e.target.value)} placeholder="Ex: Hotel Ibis" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input value={quoteProvider} onChange={e => setQuoteProvider(e.target.value)} placeholder="Fornecedor (opcional)" className={inputCls} />
                      <input type="number" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)} placeholder="Valor" className={inputCls} />
                      <select value={quoteCurrency} onChange={e => setQuoteCurrency(e.target.value)} className={inputCls}>
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {quoteCurrency !== 'BRL' && (
                      <input type="number" value={quoteRate} onChange={e => setQuoteRate(e.target.value)} placeholder="Cotação em R$" className={inputCls} />
                    )}
                    <input value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)} placeholder="Notas (opcional)" className={inputCls} />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setShowQuoteForm(false)} className="px-3 py-1.5 text-sm text-gray-600">Cancelar</button>
                      <button onClick={addQuote} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Adicionar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowQuoteForm(true)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <Plus className="w-3.5 h-3.5" /> Adicionar cotação
                  </button>
                )}
              </div>

              {/* Link transações */}
              <a href={`/transactions?trip=${trip.id}`}
                className="flex items-center gap-2 text-xs text-primary-600 hover:underline mt-1">
                <Link2 className="w-3.5 h-3.5" /> Ver transações vinculadas a esta viagem
              </a>
            </div>
          )}

          {/* ── Places Tab ── */}
          {tab === 'places' && (
            <div className="p-4 space-y-2">
              {sortedPlaces.map((place, idx) => {
                const ps = placeStatus[place.status] ?? placeStatus.wishlist
                return (
                  <div key={place.id} className="flex items-start gap-2 rounded-xl border border-gray-100 p-3">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => movePlace(place, 'up')} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => movePlace(place, 'down')} disabled={idx === sortedPlaces.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800 text-sm">{place.name}</span>
                        <span className="text-xs text-gray-400">{placeTypeLabel[place.type]}</span>
                      </div>
                      {place.address && <p className="text-xs text-gray-400 mt-0.5">{place.address}</p>}
                      {place.notes && <p className="text-xs text-gray-500 mt-0.5 italic">{place.notes}</p>}
                      {place.maps_url && (
                        <a href={place.maps_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-500 hover:underline mt-0.5">
                          <ExternalLink className="w-3 h-3" /> Ver no Maps
                        </a>
                      )}
                    </div>
                    <button onClick={() => cycleStatus(place)}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${ps.color} hover:opacity-80`}>
                      {ps.label}
                    </button>
                    <button onClick={() => deletePlace(place.id)} className="text-gray-300 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}

              {places.length === 0 && !showPlaceForm && (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum local adicionado ainda.</p>
              )}

              {showPlaceForm ? (
                <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={placeName} onChange={e => setPlaceName(e.target.value)} placeholder="Nome do local" className={inputCls} />
                    <select value={placeType} onChange={e => setPlaceType(e.target.value)} className={inputCls}>
                      {Object.entries(placeTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <input value={placeAddr} onChange={e => setPlaceAddr(e.target.value)} placeholder="Endereço (opcional)" className={inputCls} />
                  <input value={placeMaps} onChange={e => setPlaceMaps(e.target.value)} placeholder="Link do Google Maps (opcional)" className={inputCls} />
                  <input value={placeNotes} onChange={e => setPlaceNotes(e.target.value)} placeholder="Notas (opcional)" className={inputCls} />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowPlaceForm(false)} className="px-3 py-1.5 text-sm text-gray-600">Cancelar</button>
                    <button onClick={addPlace} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Adicionar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowPlaceForm(true)} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  <Plus className="w-4 h-4" /> Adicionar local
                </button>
              )}
            </div>
          )}

          {/* ── Checklist Tab ── */}
          {tab === 'checklist' && (
            <div className="p-4 space-y-2">
              {checklists.length === 0 && (
                <button onClick={addDefaultChecklist}
                  className="w-full text-sm text-primary-600 border border-primary-200 rounded-lg py-2 hover:bg-primary-50 transition-colors">
                  + Adicionar checklist padrão de viagem
                </button>
              )}
              <div className="space-y-1.5">
                {checklists.sort((a, b) => a.sort_order - b.sort_order).map(item => (
                  <div key={item.id} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50 group">
                    <button onClick={() => toggleCheck(item)} className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                      {item.checked && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.label}</span>
                    <button onClick={() => deleteCheck(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input value={checkInput} onChange={e => setCheckInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCheckItem()}
                  placeholder="Adicionar item personalizado..." className={inputCls} />
                <button onClick={addCheckItem} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {checklists.length > 0 && (
                <p className="text-xs text-gray-400 text-right">{checkedCount}/{checklists.length} concluídos</p>
              )}
            </div>
          )}

          {/* ── Companions Tab ── */}
          {tab === 'companions' && (
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-400">Adicione as pessoas que vão na viagem. O orçamento pode ser dividido entre elas.</p>
              <div className="space-y-1.5">
                {companions.map(c => (
                  <div key={c.id} className="flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-50">
                    <Users className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="flex-1 text-sm text-gray-700">{c.name}</span>
                    {companions.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {formatCurrency(totalEst / (companions.length + 2))} /pessoa
                      </span>
                    )}
                    <button onClick={() => deleteCompanion(c.id)} className="text-gray-300 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {companions.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">Nenhum companheiro adicionado.</p>
                )}
              </div>
              {companions.length > 0 && (
                <div className="bg-primary-50 rounded-lg p-3 text-xs text-primary-700">
                  <strong>Divisão estimada</strong> (casal + {companions.length} companheiro{companions.length > 1 ? 's' : ''}):
                  <span className="font-bold ml-1">{formatCurrency(totalEst / (companions.length + 2))} por pessoa</span>
                </div>
              )}
              <div className="flex gap-2">
                <input value={companionInput} onChange={e => setCompanionInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCompanion()}
                  placeholder="Nome do companheiro..." className={inputCls} />
                <button onClick={addCompanion} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
