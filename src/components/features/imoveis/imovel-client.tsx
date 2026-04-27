'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Home, Plus, Pencil, Trash2, Wrench, AlertTriangle,
  ChevronDown, ChevronUp, X, Calendar, DollarSign,
  Clock, CheckCircle2, Circle, AlertCircle, Maximize2,
  Building2, TreePine, MapPin, ShieldCheck, Receipt, Download,
} from 'lucide-react'
import { MaintenanceAlertChecker } from '@/components/features/vehicles/maintenance-alert-checker'
import { confirmDialog } from '@/components/ui/confirm-dialog'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Property {
  id: string
  couple_id: string
  name: string
  type: string
  address: string | null
  area_m2: number | null
  purchase_date: string | null
  purchase_value: number | null
  current_value: number | null
  condo_fee: number | null
  iptu_annual: number | null
  notes: string | null
  active: boolean
  created_at: string
}

interface Maintenance {
  id: string
  property_id: string
  couple_id: string
  type: string
  description: string | null
  date: string
  cost: number | null
  contractor: string | null
  status: 'concluido' | 'agendado' | 'orcamento'
  priority: 'baixa' | 'media' | 'alta' | 'urgente'
  next_date: string | null
  warranty_until: string | null
  notes: string | null
  created_at: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROPERTY_TYPES: Record<string, { label: string; icon: React.ReactNode }> = {
  casa:        { label: 'Casa',        icon: <Home className="w-4 h-4" /> },
  apartamento: { label: 'Apartamento', icon: <Building2 className="w-4 h-4" /> },
  terreno:     { label: 'Terreno',     icon: <Maximize2 className="w-4 h-4" /> },
  comercial:   { label: 'Comercial',   icon: <Building2 className="w-4 h-4" /> },
  sitio:       { label: 'Sítio',       icon: <TreePine className="w-4 h-4" /> },
  chacara:     { label: 'Chácara',     icon: <TreePine className="w-4 h-4" /> },
  outro:       { label: 'Outro',       icon: <Home className="w-4 h-4" /> },
}

const MAINTENANCE_TYPES = [
  'Pintura Interna',
  'Pintura Externa',
  'Hidráulica / Encanamento',
  'Elétrica',
  'Telhado / Cobertura',
  'Impermeabilização',
  'Piso / Revestimento',
  'Gesso / Drywall',
  'Jardim / Área Externa',
  'Piscina',
  'Portão / Cerca',
  'Interfone / Câmeras',
  'Ar-condicionado',
  'Aquecedor / Chuveiro',
  'Dedetização',
  'Limpeza de Caixa d\'água',
  'Reforma / Ampliação',
  'IPTU',
  'Condomínio',
  'Seguro Residencial',
  'Vistoria / Laudo',
  'Outro',
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  concluido: { label: 'Concluído',  color: 'bg-green-100 text-green-700',  icon: <CheckCircle2 className="w-3 h-3" /> },
  agendado:  { label: 'Agendado',   color: 'bg-blue-100 text-blue-700',    icon: <Clock className="w-3 h-3" /> },
  orcamento: { label: 'Orçamento',  color: 'bg-amber-100 text-amber-700',  icon: <Circle className="w-3 h-3" /> },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  baixa:   { label: 'Baixa',   color: 'text-gray-500',  dot: 'bg-gray-300' },
  media:   { label: 'Média',   color: 'text-blue-600',  dot: 'bg-blue-400' },
  alta:    { label: 'Alta',    color: 'text-amber-600', dot: 'bg-amber-400' },
  urgente: { label: 'Urgente', color: 'text-red-600',   dot: 'bg-red-500' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(d: string) {
  return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR })
}

function getNextDateAlert(nextDate: string | null): 'overdue' | 'soon' | 'ok' | null {
  if (!nextDate) return null
  const diff = differenceInDays(parseISO(nextDate), new Date())
  if (diff < 0) return 'overdue'
  if (diff <= 30) return 'soon'
  return 'ok'
}

function getPropertyAlertLevel(maintenances: Maintenance[]): 'overdue' | 'soon' | null {
  let result: 'overdue' | 'soon' | null = null
  for (const m of maintenances) {
    if (m.status === 'concluido') {
      const a = getNextDateAlert(m.next_date)
      if (a === 'overdue') return 'overdue'
      if (a === 'soon') result = 'soon'
    }
    if (m.status === 'agendado' && m.date) {
      const diff = differenceInDays(parseISO(m.date), new Date())
      if (diff < 0) return 'overdue'
      if (diff <= 7) result = 'soon'
    }
    if (m.priority === 'urgente' && m.status !== 'concluido') return 'overdue'
  }
  return result
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'error' }[]>([])
  function show(msg: string, type: 'success' | 'error' = 'success') {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }
  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-[999] space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={cn(
          'px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white',
          t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        )}>
          {t.msg}
        </div>
      ))}
    </div>
  )
  return { show, ToastContainer }
}

// ── Property Modal ────────────────────────────────────────────────────────────

function PropertyModal({ property, coupleId, onClose, onSaved }: {
  property: Property | null
  coupleId: string
  onClose: () => void
  onSaved: (p: Property) => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: property?.name ?? '',
    type: property?.type ?? 'casa',
    address: property?.address ?? '',
    area_m2: property?.area_m2?.toString() ?? '',
    purchase_date: property?.purchase_date ?? '',
    purchase_value: property?.purchase_value?.toString() ?? '',
    current_value: property?.current_value?.toString() ?? '',
    condo_fee: property?.condo_fee?.toString() ?? '',
    iptu_annual: property?.iptu_annual?.toString() ?? '',
    notes: property?.notes ?? '',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name.trim()) return
    setLoading(true)
    const db = createClient() as any
    const payload = {
      couple_id: coupleId,
      name: form.name.trim(),
      type: form.type,
      address: form.address.trim() || null,
      area_m2: form.area_m2 ? parseFloat(form.area_m2) : null,
      purchase_date: form.purchase_date || null,
      purchase_value: form.purchase_value ? parseFloat(form.purchase_value) : null,
      current_value: form.current_value ? parseFloat(form.current_value) : null,
      condo_fee: form.condo_fee ? parseFloat(form.condo_fee) : null,
      iptu_annual: form.iptu_annual ? parseFloat(form.iptu_annual) : null,
      notes: form.notes.trim() || null,
    }
    if (property) {
      const { data, error } = await db.from('properties').update(payload).eq('id', property.id).select().single()
      if (error) { alert('Erro: ' + error.message); setLoading(false); return }
      onSaved(data)
    } else {
      const { data, error } = await db.from('properties').insert(payload).select().single()
      if (error) { alert('Erro: ' + error.message); setLoading(false); return }
      onSaved(data)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{property ? 'Editar Imóvel' : 'Novo Imóvel'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome / Apelido *</label>
            <input type="text" placeholder='Ex: "Nossa Casa", "Apto Centro"' value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PROPERTY_TYPES).map(([v, { label, icon }]) => (
                <button key={v} type="button" onClick={() => set('type', v)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors',
                    form.type === v
                      ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Endereço</label>
            <input type="text" placeholder="Rua, número, bairro, cidade" value={form.address}
              onChange={e => set('address', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          {/* Area + Purchase date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Área (m²)</label>
              <input type="number" placeholder="Ex: 120" value={form.area_m2}
                onChange={e => set('area_m2', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data de aquisição</label>
              <input type="date" value={form.purchase_date}
                onChange={e => set('purchase_date', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor de compra (R$)</label>
              <input type="number" step="0.01" placeholder="0,00" value={form.purchase_value}
                onChange={e => set('purchase_value', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor atual estimado (R$)</label>
              <input type="number" step="0.01" placeholder="0,00" value={form.current_value}
                onChange={e => set('current_value', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          {/* IPTU + Condomínio */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">IPTU anual (R$)</label>
              <input type="number" step="0.01" placeholder="0,00" value={form.iptu_annual}
                onChange={e => set('iptu_annual', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Condomínio/mês (R$)</label>
              <input type="number" step="0.01" placeholder="0,00" value={form.condo_fee}
                onChange={e => set('condo_fee', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
            <textarea rows={2} placeholder="Informações adicionais..." value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={loading || !form.name.trim()}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium">
            {loading ? 'Salvando...' : property ? 'Salvar' : 'Criar Imóvel'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Maintenance Modal ─────────────────────────────────────────────────────────

function MaintenanceModal({ maintenance, property, coupleId, onClose, onSaved }: {
  maintenance: Maintenance | null
  property: Property
  coupleId: string
  onClose: () => void
  onSaved: (m: Maintenance) => void
}) {
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    type: maintenance?.type ?? 'Pintura Interna',
    type_custom: '',
    description: maintenance?.description ?? '',
    date: maintenance?.date ?? today,
    cost: maintenance?.cost?.toString() ?? '',
    contractor: maintenance?.contractor ?? '',
    status: maintenance?.status ?? 'concluido',
    priority: maintenance?.priority ?? 'media',
    next_date: maintenance?.next_date ?? '',
    warranty_until: maintenance?.warranty_until ?? '',
    notes: maintenance?.notes ?? '',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  const finalType = form.type === 'Outro' && form.type_custom.trim()
    ? form.type_custom.trim() : form.type

  async function handleSave() {
    if (!finalType || !form.date) return
    setLoading(true)
    const db = createClient() as any
    const payload = {
      property_id: property.id,
      couple_id: coupleId,
      type: finalType,
      description: form.description.trim() || null,
      date: form.date,
      cost: form.cost ? parseFloat(form.cost) : null,
      contractor: form.contractor.trim() || null,
      status: form.status,
      priority: form.priority,
      next_date: form.next_date || null,
      warranty_until: form.warranty_until || null,
      notes: form.notes.trim() || null,
    }
    if (maintenance) {
      const { data, error } = await db.from('property_maintenances').update(payload).eq('id', maintenance.id).select().single()
      if (error) { alert('Erro: ' + error.message); setLoading(false); return }
      onSaved(data)
    } else {
      const { data, error } = await db.from('property_maintenances').insert(payload).select().single()
      if (error) { alert('Erro: ' + error.message); setLoading(false); return }
      onSaved(data)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">{maintenance ? 'Editar Manutenção' : 'Nova Manutenção'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{property.name}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de manutenção *</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {form.type === 'Outro' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descrição do tipo</label>
              <input type="text" placeholder="Ex: Troca de telhado" value={form.type_custom}
                onChange={e => set('type_custom', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          )}

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="concluido">Concluído</option>
                <option value="agendado">Agendado</option>
                <option value="orcamento">Em orçamento</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Prioridade</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Date + Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {form.status === 'agendado' ? 'Data agendada *' : 'Data de realização *'}
              </label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
              <input type="number" step="0.01" placeholder="0,00" value={form.cost}
                onChange={e => set('cost', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          {/* Contractor */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prestador / Empresa</label>
            <input type="text" placeholder="Nome da empresa ou profissional" value={form.contractor}
              onChange={e => set('contractor', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          {/* Next date + Warranty */}
          <div className="border border-amber-100 bg-amber-50 rounded-xl p-3 space-y-3">
            <p className="text-xs font-semibold text-amber-800">Datas importantes (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-amber-700 mb-1">Próxima manutenção</label>
                <input type="date" value={form.next_date} onChange={e => set('next_date', e.target.value)}
                  className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs text-amber-700 mb-1">Garantia até</label>
                <input type="date" value={form.warranty_until} onChange={e => set('warranty_until', e.target.value)}
                  className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descrição / Observações</label>
            <textarea rows={2} placeholder="Detalhes sobre o serviço..." value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={loading || !form.date}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium">
            {loading ? 'Salvando...' : maintenance ? 'Salvar' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Property Card ─────────────────────────────────────────────────────────────

function PropertyCard({ property, maintenances, onEdit, onDelete, onAddMaintenance, onEditMaintenance, onDeleteMaintenance }: {
  property: Property
  maintenances: Maintenance[]
  onEdit: () => void
  onDelete: () => void
  onAddMaintenance: () => void
  onEditMaintenance: (m: Maintenance) => void
  onDeleteMaintenance: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [filter, setFilter] = useState<'todos' | 'concluido' | 'agendado' | 'orcamento'>('todos')

  const alertLevel = getPropertyAlertLevel(maintenances)
  const totalCost = maintenances.filter(m => m.status === 'concluido').reduce((s, m) => s + (m.cost ?? 0), 0)
  const pending = maintenances.filter(m => m.status !== 'concluido')
  const typeInfo = PROPERTY_TYPES[property.type] ?? PROPERTY_TYPES.outro

  const appreciation = property.purchase_value && property.current_value
    ? ((property.current_value - property.purchase_value) / property.purchase_value * 100)
    : null

  const filteredMaintenances = filter === 'todos'
    ? maintenances
    : maintenances.filter(m => m.status === filter)

  // Upcoming alerts
  const upcomingAlerts = maintenances.filter(m => {
    if (m.status === 'concluido') return getNextDateAlert(m.next_date) === 'overdue' || getNextDateAlert(m.next_date) === 'soon'
    if (m.priority === 'urgente') return true
    return false
  })

  return (
    <div className={cn(
      'bg-white border rounded-2xl shadow-sm overflow-hidden transition-all',
      alertLevel === 'overdue' ? 'border-red-200' : alertLevel === 'soon' ? 'border-amber-200' : 'border-gray-100'
    )}>
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 shrink-0">
            {typeInfo.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm">{property.name}</h3>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{typeInfo.label}</span>
              {alertLevel === 'overdue' && (
                <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  <AlertTriangle className="w-3 h-3" /> Atenção necessária
                </span>
              )}
              {alertLevel === 'soon' && (
                <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  <Clock className="w-3 h-3" /> Manutenção próxima
                </span>
              )}
            </div>

            {property.address && (
              <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" /> {property.address}
              </p>
            )}

            <div className="flex items-center flex-wrap gap-3 mt-2">
              {property.area_m2 && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Maximize2 className="w-3 h-3" /> {property.area_m2} m²
                </span>
              )}
              {property.current_value && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <DollarSign className="w-3 h-3" /> {formatCurrency(property.current_value)}
                  {appreciation !== null && (
                    <span className={cn('ml-1', appreciation >= 0 ? 'text-green-600' : 'text-red-500')}>
                      ({appreciation >= 0 ? '+' : ''}{appreciation.toFixed(1)}%)
                    </span>
                  )}
                </span>
              )}
              {property.iptu_annual && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Receipt className="w-3 h-3" /> IPTU {formatCurrency(property.iptu_annual)}/ano
                </span>
              )}
              {property.condo_fee && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Building2 className="w-3 h-3" /> Cond. {formatCurrency(property.condo_fee)}/mês
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-400">Manutenções</p>
            <p className="text-sm font-semibold text-gray-700">{maintenances.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Gasto total</p>
            <p className="text-sm font-semibold text-emerald-700">{formatCurrency(totalCost)}</p>
          </div>
          {pending.length > 0 && (
            <div className="text-center">
              <p className="text-xs text-gray-400">Pendentes</p>
              <p className="text-sm font-semibold text-amber-600">{pending.length}</p>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={onAddMaintenance}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors">
              <Wrench className="w-3.5 h-3.5" /> Registrar
            </button>
            <button onClick={() => setExpanded(e => !e)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Alerts strip */}
      {upcomingAlerts.length > 0 && !expanded && (
        <div className={cn(
          'px-4 py-2 border-t text-xs flex flex-wrap gap-x-3',
          alertLevel === 'overdue' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
        )}>
          {upcomingAlerts.slice(0, 3).map(m => (
            <span key={m.id} className="inline-flex items-center gap-1">
              {m.priority === 'urgente'
                ? <AlertCircle className="w-3 h-3 text-red-500" />
                : <Clock className="w-3 h-3 text-amber-500" />}
              <span className={m.priority === 'urgente' ? 'text-red-700' : 'text-amber-700'}>
                {m.type}{m.next_date ? ` · ${formatDate(m.next_date)}` : ''}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* History */}
      {expanded && (
        <div className="border-t border-gray-100">
          {/* Filter tabs */}
          {maintenances.length > 0 && (
            <div className="flex gap-1 px-4 pt-3 pb-1">
              {(['todos', 'concluido', 'agendado', 'orcamento'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full transition-colors',
                    filter === f ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-500 hover:bg-gray-100'
                  )}>
                  {f === 'todos' ? 'Todos' : STATUS_CONFIG[f].label}
                  {f !== 'todos' && (
                    <span className="ml-1 opacity-60">({maintenances.filter(m => m.status === f).length})</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {filteredMaintenances.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Wrench className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nenhuma manutenção registrada</p>
              <button onClick={onAddMaintenance} className="mt-2 text-xs text-primary-600 hover:underline">
                Registrar a primeira
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredMaintenances.map(m => {
                const statusConf = STATUS_CONFIG[m.status]
                const priorityConf = PRIORITY_CONFIG[m.priority]
                const nextAlert = m.status === 'concluido' ? getNextDateAlert(m.next_date) : null
                const isWarrantyActive = m.warranty_until
                  ? differenceInDays(parseISO(m.warranty_until), new Date()) >= 0
                  : false

                return (
                  <div key={m.id} className="px-4 py-3 flex items-start gap-3">
                    {/* Priority dot */}
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', priorityConf.dot)} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800">{m.type}</span>
                        <span className={cn('flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full', statusConf.color)}>
                          {statusConf.icon} {statusConf.label}
                        </span>
                        {m.cost != null && (
                          <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {formatCurrency(m.cost)}
                          </span>
                        )}
                        {m.priority === 'urgente' && (
                          <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-medium">Urgente</span>
                        )}
                        {isWarrantyActive && (
                          <span className="flex items-center gap-0.5 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3" /> Garantia
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" /> {formatDate(m.date)}
                        </span>
                        {m.contractor && (
                          <span className="text-xs text-gray-400">{m.contractor}</span>
                        )}
                      </div>

                      {m.next_date && (
                        <div className={cn(
                          'text-xs mt-0.5',
                          nextAlert === 'overdue' ? 'text-red-500' : nextAlert === 'soon' ? 'text-amber-500' : 'text-gray-400'
                        )}>
                          Próxima: {formatDate(m.next_date)}
                          {nextAlert === 'overdue' && ' — atrasada'}
                          {nextAlert === 'soon' && ' — em breve'}
                        </div>
                      )}

                      {m.warranty_until && (
                        <div className={cn(
                          'text-xs mt-0.5',
                          isWarrantyActive ? 'text-blue-500' : 'text-gray-300'
                        )}>
                          Garantia: {formatDate(m.warranty_until)}{!isWarrantyActive && ' (expirada)'}
                        </div>
                      )}

                      {m.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{m.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => onEditMaintenance(m)} className="p-1 text-gray-300 hover:text-primary-600 rounded transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDeleteMaintenance(m.id)} className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Client ───────────────────────────────────────────────────────────────

function exportPropertiesCSV(properties: Property[], maintenances: Maintenance[]) {
  const rows = [
    ['Imóvel', 'Tipo', 'Endereço', 'Área (m²)', 'Valor Atual', 'Tipo Manutenção', 'Status', 'Prioridade', 'Data', 'Valor (R$)', 'Prestador', 'Próxima Data', 'Garantia Até'],
  ]
  for (const p of properties) {
    const ms = maintenances.filter(m => m.property_id === p.id)
    if (ms.length === 0) {
      rows.push([p.name, p.type, p.address ?? '', p.area_m2?.toString() ?? '', p.current_value?.toFixed(2) ?? '', '', '', '', '', '', '', '', ''])
    } else {
      for (const m of ms) {
        rows.push([
          p.name, p.type, p.address ?? '', p.area_m2?.toString() ?? '', p.current_value?.toFixed(2) ?? '',
          m.type, m.status, m.priority, m.date, m.cost?.toFixed(2) ?? '',
          m.contractor ?? '', m.next_date ?? '', m.warranty_until ?? '',
        ])
      }
    }
  }
  const csv = '\uFEFF' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = `imoveis_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

export function ImovelClient({ coupleId, initialProperties, initialMaintenances }: {
  coupleId: string
  initialProperties: Property[]
  initialMaintenances: Maintenance[]
}) {
  const { show: showToast, ToastContainer } = useToast()

  const [properties, setProperties] = useState<Property[]>(initialProperties)
  const [maintenances, setMaintenances] = useState<Maintenance[]>(initialMaintenances)

  const [propertyModal, setPropertyModal] = useState<Property | null | 'new'>(null)
  const [maintenanceModal, setMaintenanceModal] = useState<{ property: Property; maintenance: Maintenance | null } | null>(null)

  const maintByProperty = useMemo(() => {
    const map: Record<string, Maintenance[]> = {}
    for (const m of maintenances) {
      if (!map[m.property_id]) map[m.property_id] = []
      map[m.property_id].push(m)
    }
    return map
  }, [maintenances])

  const totalCost = maintenances.filter(m => m.status === 'concluido').reduce((s, m) => s + (m.cost ?? 0), 0)
  const totalValue = properties.reduce((s, p) => s + (p.current_value ?? 0), 0)
  const overdueCount = properties.filter(p => getPropertyAlertLevel(maintByProperty[p.id] ?? []) === 'overdue').length
  const pendingCount = maintenances.filter(m => m.status !== 'concluido').length

  async function handleDeleteProperty(id: string) {
    if (!await confirmDialog('Excluir este imóvel e todas as suas manutenções?')) return
    const { error } = await (createClient() as any).from('properties').update({ active: false }).eq('id', id)
    if (error) { showToast('Erro ao excluir', 'error'); return }
    setProperties(v => v.filter(x => x.id !== id))
    setMaintenances(m => m.filter(x => x.property_id !== id))
    showToast('Imóvel removido')
  }

  async function handleDeleteMaintenance(id: string) {
    if (!await confirmDialog('Excluir esta manutenção?')) return
    const { error } = await (createClient() as any).from('property_maintenances').delete().eq('id', id)
    if (error) { showToast('Erro ao excluir', 'error'); return }
    setMaintenances(m => m.filter(x => x.id !== id))
    showToast('Manutenção removida')
  }

  function handlePropertySaved(p: Property) {
    setProperties(prev => {
      const idx = prev.findIndex(x => x.id === p.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = p; return n }
      return [p, ...prev]
    })
    setPropertyModal(null)
    showToast(propertyModal === 'new' ? 'Imóvel criado!' : 'Imóvel atualizado!')
  }

  function handleMaintenanceSaved(m: Maintenance) {
    setMaintenances(prev => {
      const idx = prev.findIndex(x => x.id === m.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = m; return n }
      return [m, ...prev]
    })
    setMaintenanceModal(null)
    showToast('Manutenção registrada!')
  }

  return (
    <>
      <ToastContainer />

      {propertyModal !== null && (
        <PropertyModal
          property={propertyModal === 'new' ? null : propertyModal}
          coupleId={coupleId}
          onClose={() => setPropertyModal(null)}
          onSaved={handlePropertySaved}
        />
      )}

      {maintenanceModal && (
        <MaintenanceModal
          maintenance={maintenanceModal.maintenance}
          property={maintenanceModal.property}
          coupleId={coupleId}
          onClose={() => setMaintenanceModal(null)}
          onSaved={handleMaintenanceSaved}
        />
      )}

      <MaintenanceAlertChecker />

      <div className="p-4 md:p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Meus Imóveis</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {properties.length} imóvel{properties.length !== 1 ? 'is' : ''} · {maintenances.length} manutenções registradas
            </p>
          </div>
          <div className="flex items-center gap-2">
            {maintenances.length > 0 && (
              <button onClick={() => exportPropertiesCSV(properties, maintenances)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" /> CSV
              </button>
            )}
            <button onClick={() => setPropertyModal('new')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">
              <Plus className="w-4 h-4" /> Novo Imóvel
            </button>
          </div>
        </div>

        {/* Summary */}
        {properties.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400">Patrimônio imóveis</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(totalValue)}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400">Total em manutenções</p>
              <p className="text-lg font-bold text-emerald-700 mt-1">{formatCurrency(totalCost)}</p>
            </div>
            {pendingCount > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-blue-500">Pendentes / Agendados</p>
                <p className="text-lg font-bold text-blue-700 mt-1">{pendingCount}</p>
              </div>
            )}
            {overdueCount > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-red-500">Atenção necessária</p>
                <p className="text-lg font-bold text-red-700 mt-1">{overdueCount}</p>
              </div>
            )}
          </div>
        )}

        {/* Properties */}
        {properties.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-gray-600 font-semibold mb-1">Nenhum imóvel cadastrado</h3>
            <p className="text-sm text-gray-400 mb-4">Adicione sua casa, apartamento ou terreno para controlar manutenções e custos.</p>
            <button onClick={() => setPropertyModal('new')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors mx-auto">
              <Plus className="w-4 h-4" /> Adicionar primeiro imóvel
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map(p => (
              <PropertyCard
                key={p.id}
                property={p}
                maintenances={maintByProperty[p.id] ?? []}
                onEdit={() => setPropertyModal(p)}
                onDelete={() => handleDeleteProperty(p.id)}
                onAddMaintenance={() => setMaintenanceModal({ property: p, maintenance: null })}
                onEditMaintenance={m => setMaintenanceModal({ property: p, maintenance: m })}
                onDeleteMaintenance={handleDeleteMaintenance}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
