'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import {
  MapPin, Hotel, Car, Utensils, ShoppingBag, FileText, Star,
  ChevronDown, ChevronUp, X, Plus, Check, ExternalLink,
  ArrowUp, ArrowDown, Trash2, Users, Target, Link2,
  Copy, Printer, Cloud, Calendar, Share2, Archive, Tag, FileUp, Paperclip,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export type Trip = {
  id: string; couple_id: string; name: string; destination: string
  start_date: string | null; end_date: string | null; budget: number
  status: string; notes: string | null; goal_id: string | null
  tags: string[]; archived: boolean; sort_order: number; budget_limits: Record<string, number>
}
export type Expense = { id: string; category: string; description: string; estimated: number; actual: number | null; paid: boolean; notes: string | null; foreign_currency: string | null; exchange_rate: number; foreign_amount: number | null; booking_ref: string | null }
export type Place = { id: string; name: string; type: string; address: string | null; notes: string | null; status: string; sort_order: number; maps_url: string | null }
export type ChecklistItem = { id: string; label: string; checked: boolean; sort_order: number }
export type Companion = { id: string; name: string }
export type Quote = { id: string; category: string; description: string; provider: string | null; amount: number; currency: string; exchange_rate: number; notes: string | null; chosen: boolean }
export type Goal = { id: string; name: string; target_amount: number; current_amount: number }
export type ItineraryItem = { id: string; day_date: string; time_slot: string | null; title: string; description: string | null; sort_order: number; place_id: string | null }
export type DiaryEntry = { id: string; trip_id: string; day_date: string; content: string }
export type Attachment = { id: string; name: string; url: string; size_bytes: number | null }

// ─── Constants ────────────────────────────────────────────────────────────────
const categoryLabel: Record<string, string> = { hospedagem: 'Hospedagem', transporte: 'Transporte', passeios: 'Passeios', alimentacao: 'Alimentação', compras: 'Compras', documentos: 'Documentos', outros: 'Outros' }
const categoryIcon: Record<string, React.ReactNode> = { hospedagem: <Hotel className="w-3.5 h-3.5" />, transporte: <Car className="w-3.5 h-3.5" />, passeios: <Star className="w-3.5 h-3.5" />, alimentacao: <Utensils className="w-3.5 h-3.5" />, compras: <ShoppingBag className="w-3.5 h-3.5" />, documentos: <FileText className="w-3.5 h-3.5" />, outros: <MapPin className="w-3.5 h-3.5" /> }
const categoryColor: Record<string, string> = { hospedagem: '#16a34a', transporte: '#3b82f6', passeios: '#f59e0b', alimentacao: '#ef4444', compras: '#8b5cf6', documentos: '#0ea5e9', outros: '#6b7280' }
const placeTypeLabel: Record<string, string> = { tourist: 'Turístico', restaurant: 'Restaurante', hotel: 'Hotel', transport: 'Transporte', other: 'Outro' }
const statusBadge: Record<string, string> = { planning: 'bg-blue-100 text-blue-700', confirmed: 'bg-green-100 text-green-700', completed: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-700' }
export const statusLabel: Record<string, string> = { planning: 'Planejando', confirmed: 'Confirmada', completed: 'Concluída', cancelled: 'Cancelada' }
const placeStatus: Record<string, { label: string; color: string }> = { wishlist: { label: 'Quero ir', color: 'bg-amber-100 text-amber-700' }, confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' }, visited: { label: 'Visitado', color: 'bg-green-100 text-green-700' } }
const CURRENCIES = ['BRL', 'USD', 'EUR', 'GBP', 'ARS', 'CLP', 'PYG', 'UYU', 'JPY']
const DEFAULT_CHECKLIST = ['Passaporte', 'Seguro viagem', 'Visto (se necessário)', 'Vacinas', 'Reserva de hotel confirmada', 'Passagem aérea', 'Dinheiro/cartão internacional', 'Adaptador de tomada']
const WX: Record<number, string> = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 55: '🌦️', 61: '🌧️', 63: '🌧️', 65: '🌧️', 71: '🌨️', 80: '🌦️', 81: '🌧️', 95: '⛈️', 99: '⛈️' }

const TAG_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700', 'bg-indigo-100 text-indigo-700',
]

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
export function TripCard({
  trip, expenses, places: initialPlaces, checklists: initialChecklists,
  companions: initialCompanions, quotes, goals, itinerary: initialItinerary,
  diary: initialDiary, attachments: initialAttachments,
}: {
  trip: Trip; expenses: Expense[]; places: Place[]; checklists: ChecklistItem[]
  companions: Companion[]; quotes: Quote[]; goals: Goal[]
  itinerary: ItineraryItem[]; diary: DiaryEntry[]; attachments: Attachment[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [expanded, setExpanded] = useState(true)
  const [tab, setTab] = useState<'budget' | 'places' | 'checklist' | 'companions' | 'itinerary' | 'notes' | 'files' | 'today'>('budget')

  // core state
  const [places, setPlaces] = useState(initialPlaces)
  const [checklists, setChecklists] = useState(initialChecklists)
  const [companions, setCompanions] = useState(initialCompanions)
  const [itinerary, setItinerary] = useState(initialItinerary)
  const [notes, setNotes] = useState(trip.notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [weather, setWeather] = useState<{ temp: number; max: number; min: number; code: number } | null>(null)

  // new state
  const [tags, setTags] = useState<string[]>(trip.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [budgetLimits, setBudgetLimits] = useState<Record<string, number>>(trip.budget_limits ?? {})
  const [editingLimits, setEditingLimits] = useState(false)
  const [diary, setDiary] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    initialDiary.forEach(d => { map[d.day_date] = d.content })
    return map
  })
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments)
  const [shareCopied, setShareCopied] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const diaryTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Expense form
  const [showExpForm, setShowExpForm] = useState(false)
  const [expCat, setExpCat] = useState('hospedagem')
  const [expDesc, setExpDesc] = useState('')
  const [expEst, setExpEst] = useState('')
  const [expActual, setExpActual] = useState('')
  const [expCurrency, setExpCurrency] = useState('BRL')
  const [expRate, setExpRate] = useState('1')
  const [expBookingRef, setExpBookingRef] = useState('')

  // Place form
  const [showPlaceForm, setShowPlaceForm] = useState(false)
  const [placeName, setPlaceName] = useState('')
  const [placeType, setPlaceType] = useState('tourist')
  const [placeAddr, setPlaceAddr] = useState('')
  const [placeMaps, setPlaceMaps] = useState('')
  const [placeNotes, setPlaceNotes] = useState('')

  // Checklist / Companion forms
  const [checkInput, setCheckInput] = useState('')
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

  // Itinerary form
  const [showItinForm, setShowItinForm] = useState(false)
  const [itinDay, setItinDay] = useState('')
  const [itinTime, setItinTime] = useState('')
  const [itinTitle, setItinTitle] = useState('')
  const [itinDesc, setItinDesc] = useState('')
  const [itinPlaceId, setItinPlaceId] = useState('')

  // Budget summary
  const totalEst = expenses.reduce((s, e) => s + e.estimated * e.exchange_rate, 0)
  const totalActual = expenses.reduce((s, e) => s + (e.actual ?? e.estimated) * e.exchange_rate, 0)
  const totalPaid = expenses.filter(e => e.paid).reduce((s, e) => s + (e.actual ?? e.estimated) * e.exchange_rate, 0)
  const budgetPct = trip.budget > 0 ? Math.min(100, (totalEst / trip.budget) * 100) : 0
  const overBudget = trip.budget > 0 && totalEst > trip.budget
  const linkedGoal = goals.find(g => g.id === trip.goal_id)

  // Countdown
  const daysUntil = trip.start_date
    ? Math.ceil((new Date(trip.start_date + 'T12:00:00').getTime() - Date.now()) / 86400000)
    : null

  // Today check
  const todayStr = new Date().toISOString().split('T')[0]
  const isActiveToday = !!(trip.start_date && trip.end_date && todayStr >= trip.start_date && todayStr <= trip.end_date)

  // Weather fetch (Open-Meteo — free, sem API key)
  useEffect(() => {
    const city = trip.destination.split(',')[0].trim()
    let cancelled = false
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`)
      .then(r => r.json())
      .then(d => {
        if (cancelled || !d.results?.[0]) return null
        const { latitude: lat, longitude: lon } = d.results[0]
        return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`)
      })
      .then(r => r?.json())
      .then(d => {
        if (cancelled || !d?.current_weather) return
        setWeather({
          temp: Math.round(d.current_weather.temperature),
          max: Math.round(d.daily.temperature_2m_max[0]),
          min: Math.round(d.daily.temperature_2m_min[0]),
          code: d.current_weather.weathercode,
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [trip.destination])

  // ── Actions ──────────────────────────────────────────────────────────────────
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
      booking_ref: expBookingRef || null,
    })
    setExpDesc(''); setExpEst(''); setExpActual(''); setExpCurrency('BRL'); setExpRate('1'); setExpBookingRef('')
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

  async function duplicateTrip() {
    await (supabase.from('trips') as any).insert({
      couple_id: trip.couple_id,
      name: `Cópia de ${trip.name}`,
      destination: trip.destination,
      start_date: trip.start_date,
      end_date: trip.end_date,
      budget: trip.budget,
      status: 'planning',
      goal_id: trip.goal_id,
    })
    router.refresh()
  }

  async function saveNotes() {
    setSavingNotes(true)
    await (supabase.from('trips') as any).update({ notes }).eq('id', trip.id)
    setSavingNotes(false)
  }

  async function addItinItem() {
    if (!itinTitle || !itinDay) return
    const dayItems = itinerary.filter(i => i.day_date === itinDay)
    const { data } = await (supabase.from('trip_itinerary') as any).insert({
      trip_id: trip.id, day_date: itinDay,
      time_slot: itinTime || null,
      title: itinTitle,
      description: itinDesc || null,
      sort_order: dayItems.length,
      place_id: itinPlaceId || null,
    }).select().single()
    if (data) setItinerary(prev => [...prev, data])
    setItinTitle(''); setItinDesc(''); setItinTime(''); setItinPlaceId('')
  }

  async function deleteItinItem(id: string) {
    await (supabase.from('trip_itinerary') as any).delete().eq('id', id)
    setItinerary(prev => prev.filter(i => i.id !== id))
  }

  // Tags
  async function addTag() {
    if (!tagInput.trim() || tags.includes(tagInput.trim())) return
    const newTags = [...tags, tagInput.trim()]
    await (supabase.from('trips') as any).update({ tags: newTags }).eq('id', trip.id)
    setTags(newTags)
    setTagInput('')
  }

  async function removeTag(tag: string) {
    const newTags = tags.filter(t => t !== tag)
    await (supabase.from('trips') as any).update({ tags: newTags }).eq('id', trip.id)
    setTags(newTags)
  }

  // Budget limits
  async function saveBudgetLimits() {
    await (supabase.from('trips') as any).update({ budget_limits: budgetLimits }).eq('id', trip.id)
    setEditingLimits(false)
  }

  // Diary auto-save with debounce
  function handleDiaryChange(day: string, content: string) {
    setDiary(prev => ({ ...prev, [day]: content }))
    clearTimeout(diaryTimers.current[day])
    diaryTimers.current[day] = setTimeout(async () => {
      await (supabase.from('trip_diary') as any).upsert(
        { trip_id: trip.id, day_date: day, content },
        { onConflict: 'trip_id,day_date' }
      )
    }, 1500)
  }

  // Archive
  async function toggleArchive() {
    setArchiving(true)
    await (supabase.from('trips') as any).update({ archived: !trip.archived }).eq('id', trip.id)
    setArchiving(false)
    router.refresh()
  }

  // File upload
  async function uploadFile(file: File) {
    setUploadingFile(true)
    const ext = file.name.split('.').pop()
    const path = `${trip.couple_id}/${trip.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('trip-files').upload(path, file)
    if (error) {
      alert('Erro no upload. Verifique se o bucket "trip-files" foi criado no Supabase Storage.')
      setUploadingFile(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('trip-files').getPublicUrl(path)
    const { data: att } = await (supabase.from('trip_attachments') as any).insert({
      trip_id: trip.id, name: file.name, url: publicUrl, size_bytes: file.size,
    }).select().single()
    if (att) setAttachments(prev => [...prev, att])
    setUploadingFile(false)
  }

  async function deleteAttachment(id: string, url: string) {
    const path = url.split('/trip-files/')[1]
    if (path) await supabase.storage.from('trip-files').remove([path])
    await (supabase.from('trip_attachments') as any).delete().eq('id', id)
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  // Google Calendar ICS export
  function exportCalendar() {
    if (!trip.start_date) return
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FinanceiroCasais//Travel//PT',
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${trip.start_date.replace(/-/g, '')}`,
      trip.end_date ? `DTEND;VALUE=DATE:${trip.end_date.replace(/-/g, '')}` : null,
      `SUMMARY:${trip.name}`,
      `LOCATION:${trip.destination}`,
      `DESCRIPTION:Orçamento: R$ ${trip.budget}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].filter(Boolean).join('\r\n')
    const blob = new Blob([lines], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${trip.name}.ics`; a.click()
    URL.revokeObjectURL(url)
  }

  // Share link
  async function createShare() {
    const res = await fetch('/api/travel/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId: trip.id }),
    })
    const { token } = await res.json()
    await navigator.clipboard.writeText(`${window.location.origin}/share/${token}`)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2500)
  }

  // Maps route
  function openMapsRoute() {
    const pts = sortedPlaces.map(p => encodeURIComponent(p.address || p.name)).join('/')
    window.open(`https://www.google.com/maps/dir/${pts}`, '_blank')
  }

  // Export PDF
  function exportPDF() {
    const w = window.open('', '_blank')
    if (!w) return
    const expRows = expenses.map(e =>
      `<tr><td>${categoryLabel[e.category]}</td><td>${e.description}</td><td>${formatCurrency(e.estimated * e.exchange_rate)}</td><td>${e.paid ? '✓' : ''}</td>${e.booking_ref ? `<td>${e.booking_ref}</td>` : '<td></td>'}</tr>`
    ).join('')
    const placeRows = sortedPlaces.map((p, i) =>
      `<tr><td>${i + 1}</td><td>${p.name}</td><td>${placeTypeLabel[p.type] ?? p.type}</td><td>${p.address ?? ''}</td></tr>`
    ).join('')
    const byDay = groupByDay(itinerary)
    const itinHtml = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, items]) => `
      <h3>${new Date(day + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
      <ul>${(items as ItineraryItem[]).sort((a, b) => (a.time_slot ?? '').localeCompare(b.time_slot ?? '')).map(it =>
        `<li>${it.time_slot ? `<strong>${it.time_slot}</strong> &ndash; ` : ''}${it.title}${it.description ? `: <em>${it.description}</em>` : ''}</li>`
      ).join('')}</ul>
    `).join('')
    const checkHtml = checklists.map(c =>
      `<li style="text-decoration:${c.checked ? 'line-through' : 'none'};color:${c.checked ? '#9ca3af' : '#374151'}">${c.label}</li>`
    ).join('')

    w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${trip.name}</title>
    <style>
      body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#333}
      h1{color:#16a34a;border-bottom:2px solid #16a34a;padding-bottom:8px}
      h2{color:#374151;margin-top:24px;border-left:4px solid #16a34a;padding-left:10px}
      h3{color:#555;margin-top:14px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th{background:#f0fdf4;text-align:left;padding:8px 10px;border:1px solid #d1fae5;font-size:13px}
      td{padding:8px 10px;border:1px solid #e5e7eb;font-size:13px}
      .meta{color:#666;font-size:14px;margin-bottom:16px}
      ul{margin:8px 0;padding-left:20px} li{margin-bottom:4px;font-size:13px}
      @media print{.no-print{display:none}}
    </style></head><body>
    <h1>${trip.name}</h1>
    <p class="meta">
      📍 ${trip.destination} &nbsp;|&nbsp;
      ${trip.start_date ? `📅 ${new Date(trip.start_date + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}
      ${trip.end_date ? ` → ${new Date(trip.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}
      &nbsp;|&nbsp; ${statusLabel[trip.status] ?? trip.status}
    </p>
    ${trip.budget > 0 ? `<p>💰 Orçamento: <strong>${formatCurrency(trip.budget)}</strong> &nbsp;|&nbsp; Estimado: <strong>${formatCurrency(totalEst)}</strong> &nbsp;|&nbsp; Pago: <strong>${formatCurrency(totalPaid)}</strong></p>` : ''}
    ${tags.length > 0 ? `<p>🏷️ Tags: ${tags.join(', ')}</p>` : ''}
    ${notes ? `<h2>📝 Notas</h2><p style="white-space:pre-wrap">${notes}</p>` : ''}
    ${expenses.length > 0 ? `<h2>💸 Orçamento</h2><table><tr><th>Categoria</th><th>Descrição</th><th>Valor estimado</th><th>Pago</th><th>Reserva</th></tr>${expRows}</table>` : ''}
    ${itinerary.length > 0 ? `<h2>📅 Itinerário</h2>${itinHtml}` : ''}
    ${sortedPlaces.length > 0 ? `<h2>📍 Roteiro</h2><table><tr><th>#</th><th>Local</th><th>Tipo</th><th>Endereço</th></tr>${placeRows}</table>` : ''}
    ${checklists.length > 0 ? `<h2>✅ Checklist</h2><ul>${checkHtml}</ul>` : ''}
    ${companions.length > 0 ? `<h2>👥 Companheiros</h2><ul>${companions.map(c => `<li>${c.name}</li>`).join('')}</ul>` : ''}
    <p class="no-print" style="margin-top:32px">
      <button onclick="window.print()" style="padding:8px 20px;background:#16a34a;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px">Imprimir / Salvar PDF</button>
    </p>
    </body></html>`)
    w.document.close()
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function getTripDays(): string[] {
    if (!trip.start_date || !trip.end_date) return []
    const days: string[] = []
    const end = new Date(trip.end_date + 'T12:00:00')
    let cur = new Date(trip.start_date + 'T12:00:00')
    while (cur <= end && days.length < 60) {
      days.push(cur.toISOString().split('T')[0])
      cur.setDate(cur.getDate() + 1)
    }
    return days
  }

  function groupByDay(items: ItineraryItem[]): Record<string, ItineraryItem[]> {
    return items.reduce((acc: Record<string, ItineraryItem[]>, item) => {
      if (!acc[item.day_date]) acc[item.day_date] = []
      acc[item.day_date].push(item)
      return acc
    }, {})
  }

  function formatBytes(bytes: number | null): string {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ── Computed ─────────────────────────────────────────────────────────────────
  const sortedPlaces = [...places].sort((a, b) => a.sort_order - b.sort_order)
  const checkedCount = checklists.filter(c => c.checked).length
  const groupedExpenses = Object.keys(categoryLabel).reduce((acc, cat) => {
    const items = expenses.filter(e => e.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, Expense[]>)
  const tripDays = getTripDays()
  const itineraryByDay = groupByDay(itinerary)
  const inputCls = "border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full"
  const wxEmoji = WX[weather?.code ?? -1] ?? '🌡️'
  const todayItems = itinerary.filter(i => i.day_date === todayStr).sort((a, b) => (a.time_slot ?? '').localeCompare(b.time_slot ?? ''))
  const placeById = Object.fromEntries(places.map(p => [p.id, p]))

  // Tabs list
  type TabKey = 'budget' | 'places' | 'checklist' | 'companions' | 'itinerary' | 'notes' | 'files' | 'today'
  const tabList: [TabKey, string][] = [
    ['budget', `Orçamento (${expenses.length})`],
    ['places', `Roteiro (${places.length})`],
    ['checklist', `Checklist (${checkedCount}/${checklists.length})`],
    ['companions', `Companheiros (${companions.length})`],
    ['itinerary', `Itinerário (${itinerary.length})`],
    ['notes', 'Notas'],
    ['files', `Arquivos (${attachments.length})`],
    ...(isActiveToday ? [['today', '📍 Hoje'] as [TabKey, string]] : []),
  ]

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${trip.archived ? 'border-gray-200 opacity-75' : 'border-gray-100'}`}>
      {/* ── Header ── */}
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-lg leading-tight">{trip.name}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[trip.status] ?? statusBadge.planning}`}>
                {statusLabel[trip.status]}
              </span>
              {trip.archived && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Arquivada</span>
              )}
              {/* Countdown */}
              {daysUntil !== null && trip.status !== 'completed' && trip.status !== 'cancelled' && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  daysUntil === 0 ? 'bg-green-100 text-green-700' :
                  daysUntil < 0 ? 'bg-gray-100 text-gray-500' :
                  daysUntil <= 7 ? 'bg-amber-100 text-amber-700' :
                  'bg-primary-50 text-primary-700'
                }`}>
                  {daysUntil === 0 ? '✈️ Hoje!' : daysUntil < 0 ? `${Math.abs(daysUntil)}d atrás` : `${daysUntil}d`}
                </span>
              )}
              {isActiveToday && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 animate-pulse">
                  Em viagem!
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-gray-500 text-sm">
                <MapPin className="w-3.5 h-3.5" />{trip.destination}
              </span>
              {trip.start_date && (
                <span className="text-xs text-gray-400">
                  {new Date(trip.start_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  {trip.end_date && ` → ${new Date(trip.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                </span>
              )}
              {companions.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="w-3 h-3" />
                  {companions.map(c => c.name).join(', ')}
                </span>
              )}
              {/* Weather */}
              {weather && (
                <span className="flex items-center gap-1 text-xs text-gray-500 bg-blue-50 px-2 py-0.5 rounded-full">
                  <Cloud className="w-3 h-3 text-blue-400" />
                  {wxEmoji} {weather.temp}°C
                  <span className="text-gray-400">({weather.min}↓ {weather.max}↑)</span>
                </span>
              )}
            </div>
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <Tag className="w-3 h-3 text-gray-400 shrink-0" />
                {tags.map((t, i) => (
                  <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:opacity-70 ml-0.5" title={`Remover tag "${t}"`}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTag()}
                    placeholder="+ tag"
                    className="text-xs border border-gray-200 rounded-full px-2 py-0.5 w-16 focus:outline-none focus:ring-1 focus:ring-primary-400 focus:w-24 transition-all"
                  />
                </div>
              </div>
            )}
            {tags.length === 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Tag className="w-3 h-3 text-gray-300 shrink-0" />
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag()}
                  placeholder="Adicionar tag..."
                  className="text-xs border border-gray-200 rounded-full px-2 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-primary-400 text-gray-500"
                />
              </div>
            )}
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
          <div className="flex items-center gap-1 flex-wrap justify-end">
            <button onClick={createShare} title={shareCopied ? 'Link copiado!' : 'Compartilhar roteiro'} className={`p-1.5 rounded-lg transition-colors ${shareCopied ? 'text-green-500' : 'text-gray-300 hover:text-primary-500'}`}>
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={exportCalendar} title="Exportar para Google Calendar (.ics)" className="p-1.5 text-gray-300 hover:text-blue-500 rounded-lg transition-colors" disabled={!trip.start_date}>
              <Calendar className="w-4 h-4" />
            </button>
            <button onClick={exportPDF} title="Exportar roteiro como PDF" className="p-1.5 text-gray-300 hover:text-primary-500 rounded-lg transition-colors">
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={duplicateTrip} title="Duplicar viagem" className="p-1.5 text-gray-300 hover:text-blue-500 rounded-lg transition-colors">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={toggleArchive} title={trip.archived ? 'Desarquivar viagem' : 'Arquivar viagem'} disabled={archiving} className={`p-1.5 rounded-lg transition-colors ${trip.archived ? 'text-amber-400 hover:text-amber-600' : 'text-gray-300 hover:text-amber-500'}`}>
              <Archive className="w-4 h-4" />
            </button>
            <button onClick={deleteTrip} title="Excluir viagem" className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={() => setExpanded(v => !v)} title={expanded ? 'Recolher' : 'Expandir'} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
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
            {tabList.map(([key, label]) => (
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

              {/* Category comparison bars */}
              {Object.entries(groupedExpenses).map(([cat, items]) => {
                const catEst = items.reduce((s, e) => s + e.estimated * e.exchange_rate, 0)
                const catActual = items.reduce((s, e) => s + (e.actual ?? e.estimated) * e.exchange_rate, 0)
                const limit = budgetLimits[cat] ?? 0
                const overLimit = limit > 0 && catEst > limit
                const limitPct = limit > 0 ? Math.min(100, (catEst / limit) * 100) : 0

                return (
                  <div key={cat}>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      <span style={{ color: categoryColor[cat] }}>{categoryIcon[cat]}</span>
                      <span>{categoryLabel[cat]}</span>
                      {overLimit && (
                        <span className="ml-1 text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 normal-case tracking-normal">
                          Estouro!
                        </span>
                      )}
                      <span className="ml-auto font-normal normal-case text-gray-400">
                        {formatCurrency(catEst)}
                        {catActual !== catEst && <span className="text-gray-300 ml-1">/ real: {formatCurrency(catActual)}</span>}
                      </span>
                    </div>
                    {/* Comparison bar */}
                    {limit > 0 && (
                      <div className="mb-1.5 space-y-0.5">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${overLimit ? 'bg-red-500' : limitPct > 80 ? 'bg-amber-500' : 'bg-primary-500'}`}
                            style={{ width: `${limitPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>{Math.round(limitPct)}% do limite</span>
                          <span>Limite: {formatCurrency(limit)}</span>
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      {items.map(exp => (
                        <div key={exp.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${exp.paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                          <button onClick={() => togglePaid(exp)} className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${exp.paid ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                            {exp.paid && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className={`truncate block ${exp.paid ? 'line-through text-gray-400' : 'text-gray-700'}`}>{exp.description}</span>
                            {exp.booking_ref && (
                              <span className="text-xs text-blue-500 font-mono">#{exp.booking_ref}</span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-medium">{formatCurrency(exp.estimated * exp.exchange_rate)}</span>
                            {exp.foreign_currency && (
                              <span className="block text-xs text-gray-400">{exp.foreign_amount ?? exp.estimated} {exp.foreign_currency} × {exp.exchange_rate}</span>
                            )}
                          </div>
                          <button onClick={() => deleteExpense(exp.id)} className="text-gray-300 hover:text-red-500 ml-1" title="Excluir">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

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
                  <input value={expBookingRef} onChange={e => setExpBookingRef(e.target.value)} placeholder="Nº reserva/booking (opcional)" className={inputCls} />
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

              {/* Sub-orçamentos por categoria */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sub-orçamentos por categoria</p>
                  {!editingLimits ? (
                    <button onClick={() => setEditingLimits(true)} className="text-xs text-primary-600 hover:underline">Editar limites</button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditingLimits(false)} className="text-xs text-gray-500 hover:underline">Cancelar</button>
                      <button onClick={saveBudgetLimits} className="text-xs text-primary-600 font-medium hover:underline">Salvar</button>
                    </div>
                  )}
                </div>
                {editingLimits && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(categoryLabel).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 w-24 shrink-0">{v}</span>
                        <input
                          type="number"
                          value={budgetLimits[k] ?? ''}
                          onChange={e => setBudgetLimits(prev => ({ ...prev, [k]: parseFloat(e.target.value) || 0 }))}
                          placeholder="0"
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {!editingLimits && Object.keys(budgetLimits).some(k => (budgetLimits[k] ?? 0) > 0) && (
                  <div className="space-y-1">
                    {Object.entries(budgetLimits).filter(([, v]) => v > 0).map(([cat, limit]) => {
                      const spent = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.estimated * e.exchange_rate, 0)
                      const pct = Math.min(100, (spent / limit) * 100)
                      const over = spent > limit
                      return (
                        <div key={cat} className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="w-20 shrink-0">{categoryLabel[cat]}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${over ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`shrink-0 ${over ? 'text-red-600 font-medium' : ''}`}>{formatCurrency(spent)} / {formatCurrency(limit)}</span>
                          {over && <span className="text-red-500 shrink-0">⚠️</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

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
                        <button onClick={() => deleteQuote(q.id)} className="text-gray-300 hover:text-red-500" title="Excluir">
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
              <a href={`/transactions?trip=${trip.id}`}
                className="flex items-center gap-2 text-xs text-primary-600 hover:underline mt-1">
                <Link2 className="w-3.5 h-3.5" /> Ver transações vinculadas a esta viagem
              </a>
            </div>
          )}

          {/* ── Places Tab ── */}
          {tab === 'places' && (
            <div className="p-4 space-y-2">
              {sortedPlaces.length >= 2 && (
                <button
                  onClick={openMapsRoute}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors w-full"
                  title="Abrir percurso completo no Google Maps"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver percurso no Maps ({sortedPlaces.length} locais)
                </button>
              )}
              {sortedPlaces.map((place, idx) => {
                const ps = placeStatus[place.status] ?? placeStatus.wishlist
                return (
                  <div key={place.id} className="flex items-start gap-2 rounded-xl border border-gray-100 p-3">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => movePlace(place, 'up')} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20" title="Mover para cima">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => movePlace(place, 'down')} disabled={idx === sortedPlaces.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20" title="Mover para baixo">
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
                    <button onClick={() => deletePlace(place.id)} className="text-gray-300 hover:text-red-500" title="Excluir local">
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
                    <button onClick={() => deleteCheck(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity" title="Excluir">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input value={checkInput} onChange={e => setCheckInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCheckItem()}
                  placeholder="Adicionar item personalizado..." className={inputCls} />
                <button onClick={addCheckItem} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 shrink-0" title="Adicionar">
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
              <p className="text-xs text-gray-400">Adicione as pessoas que vão na viagem.</p>
              <div className="space-y-1.5">
                {companions.map(c => (
                  <div key={c.id} className="flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-50">
                    <Users className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="flex-1 text-sm text-gray-700">{c.name}</span>
                    <span className="text-xs text-gray-400">
                      {formatCurrency(totalEst / (companions.length + 2))} /pessoa
                    </span>
                    <button onClick={() => deleteCompanion(c.id)} className="text-gray-300 hover:text-red-500" title="Remover">
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
                <button onClick={addCompanion} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 shrink-0" title="Adicionar">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Itinerary Tab ── */}
          {tab === 'itinerary' && (
            <div className="p-4 space-y-4">
              {!trip.start_date || !trip.end_date ? (
                <div className="text-center py-10 text-gray-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Configure as datas de ida e volta para usar o itinerário.</p>
                </div>
              ) : (
                <>
                  {tripDays.map(day => {
                    const dayItems = (itineraryByDay[day] ?? []).sort((a, b) => (a.time_slot ?? '').localeCompare(b.time_slot ?? ''))
                    const dayLabel = new Date(day + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
                    const isToday = day === todayStr
                    return (
                      <div key={day}>
                        <div className={`flex items-center gap-2 mb-1.5 ${isToday ? 'bg-emerald-50 rounded-lg px-2 py-1' : ''}`}>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${isToday ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{dayLabel}</span>
                          {isToday && <span className="text-xs text-emerald-600 font-medium">Hoje</span>}
                          {dayItems.length === 0 && <span className="text-xs text-gray-300">Livre</span>}
                        </div>
                        <div className="space-y-1.5 ml-2">
                          {dayItems.map(item => {
                            const linkedPlace = item.place_id ? placeById[item.place_id] : null
                            return (
                              <div key={item.id} className="flex items-start gap-2 rounded-lg border border-gray-100 px-3 py-2 group">
                                {item.time_slot && (
                                  <span className="text-xs font-mono text-primary-600 shrink-0 mt-0.5 w-10">{item.time_slot}</span>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800">{item.title}</p>
                                  {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                                  {linkedPlace && (
                                    <p className="text-xs text-blue-500 flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3 h-3" />{linkedPlace.name}
                                    </p>
                                  )}
                                </div>
                                <button onClick={() => deleteItinItem(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity shrink-0" title="Excluir">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                        {/* Diary for this day */}
                        <div className="ml-2 mt-2">
                          <textarea
                            value={diary[day] ?? ''}
                            onChange={e => handleDiaryChange(day, e.target.value)}
                            placeholder={`Diário do dia ${dayLabel}...`}
                            rows={2}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none text-gray-600 placeholder-gray-300"
                          />
                        </div>
                      </div>
                    )
                  })}

                  {showItinForm ? (
                    <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                      <div className="grid grid-cols-2 gap-2">
                        <select value={itinDay} onChange={e => setItinDay(e.target.value)} className={inputCls}>
                          <option value="">Selecione o dia</option>
                          {tripDays.map(d => (
                            <option key={d} value={d}>
                              {new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </option>
                          ))}
                        </select>
                        <input value={itinTime} onChange={e => setItinTime(e.target.value)} placeholder="Horário (ex: 09:00)" className={inputCls} />
                      </div>
                      <input value={itinTitle} onChange={e => setItinTitle(e.target.value)} placeholder="Atividade (ex: Visita ao Museu do Louvre)" className={inputCls} />
                      <input value={itinDesc} onChange={e => setItinDesc(e.target.value)} placeholder="Detalhes (opcional)" className={inputCls} />
                      {places.length > 0 && (
                        <select value={itinPlaceId} onChange={e => setItinPlaceId(e.target.value)} className={inputCls}>
                          <option value="">Nenhum local vinculado</option>
                          {sortedPlaces.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      )}
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowItinForm(false)} className="px-3 py-1.5 text-sm text-gray-600">Cancelar</button>
                        <button onClick={addItinItem} disabled={!itinTitle || !itinDay}
                          className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
                          Adicionar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowItinForm(true)} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
                      <Plus className="w-4 h-4" /> Adicionar atividade
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Notes Tab ── */}
          {tab === 'notes' && (
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-400">Anotações gerais: dicas, observações, links úteis, etc.</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Lembrar de comprar protetor solar, pegar moeda no aeroporto, confirmar seguro viagem..."
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <div className="flex justify-end">
                <button onClick={saveNotes} disabled={savingNotes}
                  className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {savingNotes ? 'Salvando...' : 'Salvar notas'}
                </button>
              </div>
            </div>
          )}

          {/* ── Files Tab ── */}
          {tab === 'files' && (
            <div className="p-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                <strong>Atenção:</strong> é necessário criar o bucket &quot;trip-files&quot; (público) no Supabase Storage antes de fazer uploads.
              </div>

              <label className={`flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploadingFile ? (
                  <span className="text-sm text-gray-400 flex items-center gap-2 w-full justify-center">
                    <FileUp className="w-4 h-4 animate-bounce" /> Enviando...
                  </span>
                ) : (
                  <span className="text-sm text-gray-500 flex items-center gap-2 w-full justify-center">
                    <FileUp className="w-4 h-4" /> Clique para enviar um arquivo
                  </span>
                )}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploadingFile}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) uploadFile(file)
                    e.target.value = ''
                  }}
                />
              </label>

              {attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
                      <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <a href={att.url} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:underline truncate block">{att.name}</a>
                        {att.size_bytes && <span className="text-xs text-gray-400">{formatBytes(att.size_bytes)}</span>}
                      </div>
                      <button onClick={() => deleteAttachment(att.id, att.url)} className="text-gray-300 hover:text-red-500 shrink-0" title="Excluir arquivo">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum arquivo enviado ainda.</p>
              )}
            </div>
          )}

          {/* ── Today Tab ── */}
          {tab === 'today' && isActiveToday && (
            <div className="p-4 space-y-4">
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">Hoje</p>
                <p className="text-lg font-bold text-emerald-800">
                  {new Date(todayStr + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {trip.end_date && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {Math.ceil((new Date(trip.end_date + 'T12:00:00').getTime() - Date.now()) / 86400000)} dias restantes de viagem
                  </p>
                )}
                <div className="flex gap-4 mt-3 text-xs">
                  <div className="bg-white rounded-lg px-3 py-2">
                    <span className="text-gray-500 block">Total pago</span>
                    <span className="font-bold text-green-600">{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="bg-white rounded-lg px-3 py-2">
                    <span className="text-gray-500 block">Estimado</span>
                    <span className="font-bold text-gray-700">{formatCurrency(totalEst)}</span>
                  </div>
                  {weather && (
                    <div className="bg-white rounded-lg px-3 py-2">
                      <span className="text-gray-500 block">Clima</span>
                      <span className="font-bold text-gray-700">{wxEmoji} {weather.temp}°C</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Programação de hoje</p>
                {todayItems.length > 0 ? (
                  <div className="space-y-2">
                    {todayItems.map(item => {
                      const linkedPlace = item.place_id ? placeById[item.place_id] : null
                      return (
                        <div key={item.id} className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2">
                          {item.time_slot && (
                            <span className="text-xs font-mono text-emerald-600 shrink-0 mt-0.5 w-10">{item.time_slot}</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{item.title}</p>
                            {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                            {linkedPlace && (
                              <p className="text-xs text-blue-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />{linkedPlace.name}
                                {linkedPlace.address && ` · ${linkedPlace.address}`}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-4 text-center">Nenhuma atividade programada para hoje.</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Diário de hoje</p>
                <textarea
                  value={diary[todayStr] ?? ''}
                  onChange={e => handleDiaryChange(todayStr, e.target.value)}
                  placeholder="Como foi o dia? Anote suas memórias, descobertas e momentos especiais..."
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">Salvo automaticamente.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
