'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Car, Bike, Plus, Pencil, Trash2, Wrench, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronUp, X, Fuel, Calendar,
  Gauge, MapPin, DollarSign, Clock, ChevronRight, Download,
} from 'lucide-react'
import { MaintenanceAlertChecker } from './maintenance-alert-checker'
import { confirmDialog } from '@/components/ui/confirm-dialog'
import { format, parseISO, differenceInDays, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Vehicle {
  id: string
  couple_id: string
  name: string
  make: string | null
  model: string | null
  year: number | null
  plate: string | null
  color: string | null
  fuel_type: string
  current_km: number
  notes: string | null
  active: boolean
  created_at: string
}

interface Maintenance {
  id: string
  vehicle_id: string
  couple_id: string
  type: string
  description: string | null
  date: string
  km_at_service: number | null
  cost: number | null
  shop: string | null
  next_km: number | null
  next_date: string | null
  notes: string | null
  created_at: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FUEL_LABELS: Record<string, string> = {
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  flex: 'Flex',
  diesel: 'Diesel',
  gnv: 'GNV',
  'elétrico': 'Elétrico',
  'híbrido': 'Híbrido',
}

const FUEL_COLORS: Record<string, string> = {
  gasolina: 'bg-red-100 text-red-700',
  etanol: 'bg-green-100 text-green-700',
  flex: 'bg-blue-100 text-blue-700',
  diesel: 'bg-yellow-100 text-yellow-700',
  gnv: 'bg-orange-100 text-orange-700',
  'elétrico': 'bg-emerald-100 text-emerald-700',
  'híbrido': 'bg-teal-100 text-teal-700',
}

const MAINTENANCE_TYPES = [
  'Troca de Óleo',
  'Troca de Filtro de Óleo',
  'Troca de Filtro de Ar',
  'Troca de Filtro de Combustível',
  'Revisão Geral',
  'Alinhamento e Balanceamento',
  'Troca de Pneus',
  'Calibragem de Pneus',
  'Pastilha de Freio',
  'Disco de Freio',
  'Fluido de Freio',
  'Correia Dentada',
  'Correia Acessórios',
  'Arrefecimento / Radiador',
  'Bateria',
  'Velas de Ignição',
  'Amortecedor',
  'Embreagem',
  'Suspensão',
  'Ar-condicionado',
  'IPVA',
  'Licenciamento / CRLV',
  'Seguro',
  'Multa',
  'Abastecimento',
  'Outro',
]

const VEHICLE_COLORS = [
  { value: 'Branco', hex: '#ffffff', border: true },
  { value: 'Preto', hex: '#1f2937' },
  { value: 'Prata', hex: '#9ca3af' },
  { value: 'Cinza', hex: '#6b7280' },
  { value: 'Vermelho', hex: '#dc2626' },
  { value: 'Azul', hex: '#2563eb' },
  { value: 'Verde', hex: '#16a34a' },
  { value: 'Amarelo', hex: '#ca8a04' },
  { value: 'Laranja', hex: '#ea580c' },
  { value: 'Bege', hex: '#d4b896' },
  { value: 'Marrom', hex: '#92400e' },
  { value: 'Vinho', hex: '#9f1239' },
  { value: 'Rosa', hex: '#db2777' },
  { value: 'Dourado', hex: '#b45309' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(d: string) {
  return format(parseISO(d), "dd/MM/yyyy", { locale: ptBR })
}

function formatKm(km: number) {
  return km.toLocaleString('pt-BR') + ' km'
}

/** Returns alert status for a maintenance record */
function getMaintenanceAlert(m: Maintenance, currentKm: number): 'overdue' | 'soon' | 'ok' | null {
  const today = new Date()
  let byDate: 'overdue' | 'soon' | null = null
  let byKm: 'overdue' | 'soon' | null = null

  if (m.next_date) {
    const nd = parseISO(m.next_date)
    const diff = differenceInDays(nd, today)
    if (diff < 0) byDate = 'overdue'
    else if (diff <= 30) byDate = 'soon'
  }

  if (m.next_km && currentKm > 0) {
    const diff = m.next_km - currentKm
    if (diff <= 0) byKm = 'overdue'
    else if (diff <= 1000) byKm = 'soon'
  }

  if (byDate === 'overdue' || byKm === 'overdue') return 'overdue'
  if (byDate === 'soon' || byKm === 'soon') return 'soon'
  if (m.next_date || m.next_km) return 'ok'
  return null
}

/** Get the most critical alert among all maintenances for a vehicle */
function getVehicleAlertLevel(maintenances: Maintenance[], currentKm: number): 'overdue' | 'soon' | null {
  let result: 'overdue' | 'soon' | null = null
  for (const m of maintenances) {
    const a = getMaintenanceAlert(m, currentKm)
    if (a === 'overdue') return 'overdue'
    if (a === 'soon') result = 'soon'
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

// ── Vehicle Form Modal ────────────────────────────────────────────────────────

function VehicleModal({
  vehicle,
  coupleId,
  onClose,
  onSaved,
}: {
  vehicle: Vehicle | null
  coupleId: string
  onClose: () => void
  onSaved: (v: Vehicle) => void
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: vehicle?.name ?? '',
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    year: vehicle?.year?.toString() ?? '',
    plate: vehicle?.plate ?? '',
    color: vehicle?.color ?? 'Branco',
    fuel_type: vehicle?.fuel_type ?? 'flex',
    current_km: vehicle?.current_km?.toString() ?? '0',
    notes: vehicle?.notes ?? '',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name.trim()) return
    setLoading(true)
    const payload = {
      couple_id: coupleId,
      name: form.name.trim(),
      make: form.make.trim() || null,
      model: form.model.trim() || null,
      year: form.year ? parseInt(form.year) : null,
      plate: form.plate.trim().toUpperCase() || null,
      color: form.color || null,
      fuel_type: form.fuel_type,
      current_km: parseInt(form.current_km) || 0,
      notes: form.notes.trim() || null,
    }
    const db = supabase as any
    if (vehicle) {
      const { data, error } = await db.from('vehicles').update(payload).eq('id', vehicle.id).select().single()
      if (error) { alert('Erro: ' + error.message); setLoading(false); return }
      onSaved(data as Vehicle)
    } else {
      const { data, error } = await db.from('vehicles').insert(payload).select().single()
      if (error) { alert('Erro: ' + error.message); setLoading(false); return }
      onSaved(data as Vehicle)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{vehicle ? 'Editar Veículo' : 'Novo Veículo'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome do veículo *</label>
            <input
              type="text"
              placeholder="Ex: Meu Carro, HB20 da Maria"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Make + Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Marca</label>
              <input
                type="text"
                placeholder="Ex: Volkswagen"
                value={form.make}
                onChange={e => set('make', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Modelo</label>
              <input
                type="text"
                placeholder="Ex: Gol 1.0"
                value={form.model}
                onChange={e => set('model', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Year + Plate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ano</label>
              <input
                type="number"
                placeholder="Ex: 2022"
                value={form.year}
                onChange={e => set('year', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Placa</label>
              <input
                type="text"
                placeholder="ABC-1234"
                value={form.plate}
                onChange={e => set('plate', e.target.value)}
                maxLength={8}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Fuel + KM */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Combustível</label>
              <select
                value={form.fuel_type}
                onChange={e => set('fuel_type', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(FUEL_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">KM atual</label>
              <input
                type="number"
                placeholder="0"
                value={form.current_km}
                onChange={e => set('current_km', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.value}
                  onClick={() => set('color', c.value)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-transform hover:scale-110',
                    c.border && 'border border-gray-300',
                    form.color === c.value && 'ring-2 ring-offset-1 ring-primary-500 scale-110'
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            {form.color && (
              <p className="text-xs text-gray-400 mt-1">{form.color} selecionado</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
            <textarea
              rows={2}
              placeholder="Informações adicionais..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !form.name.trim()}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Salvando...' : vehicle ? 'Salvar' : 'Criar Veículo'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Maintenance Form Modal ────────────────────────────────────────────────────

function MaintenanceModal({
  maintenance,
  vehicle,
  coupleId,
  onClose,
  onSaved,
}: {
  maintenance: Maintenance | null
  vehicle: Vehicle
  coupleId: string
  onClose: () => void
  onSaved: (m: Maintenance) => void
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    type: maintenance?.type ?? 'Troca de Óleo',
    type_custom: '',
    description: maintenance?.description ?? '',
    date: maintenance?.date ?? today,
    km_at_service: maintenance?.km_at_service?.toString() ?? '',
    cost: maintenance?.cost?.toString() ?? '',
    shop: maintenance?.shop ?? '',
    next_km: maintenance?.next_km?.toString() ?? '',
    next_date: maintenance?.next_date ?? '',
    notes: maintenance?.notes ?? '',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  const finalType = form.type === 'Outro' && form.type_custom.trim()
    ? form.type_custom.trim()
    : form.type

  async function handleSave() {
    if (!finalType || !form.date) return
    setLoading(true)
    const payload = {
      vehicle_id: vehicle.id,
      couple_id: coupleId,
      type: finalType,
      description: form.description.trim() || null,
      date: form.date,
      km_at_service: form.km_at_service ? parseInt(form.km_at_service) : null,
      cost: form.cost ? parseFloat(form.cost) : null,
      shop: form.shop.trim() || null,
      next_km: form.next_km ? parseInt(form.next_km) : null,
      next_date: form.next_date || null,
      notes: form.notes.trim() || null,
    }
    const db = supabase as any
    if (maintenance) {
      const { data, error } = await db.from('vehicle_maintenances').update(payload).eq('id', maintenance.id).select().single()
      if (error) { alert('Erro: ' + error.message); setLoading(false); return }
      onSaved(data as Maintenance)
    } else {
      const { data, error } = await db.from('vehicle_maintenances').insert(payload).select().single()
      if (error) { alert('Erro: ' + error.message); setLoading(false); return }
      onSaved(data as Maintenance)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">{maintenance ? 'Editar Manutenção' : 'Nova Manutenção'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{vehicle.name}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de manutenção *</label>
            <select
              value={form.type}
              onChange={e => set('type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {MAINTENANCE_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {form.type === 'Outro' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descrição do tipo</label>
              <input
                type="text"
                placeholder="Ex: Troca de vela"
                value={form.type_custom}
                onChange={e => set('type_custom', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Date + KM */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">KM no serviço</label>
              <input
                type="number"
                placeholder={vehicle.current_km.toString()}
                value={form.km_at_service}
                onChange={e => set('km_at_service', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Cost + Shop */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={form.cost}
                onChange={e => set('cost', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Oficina / Local</label>
              <input
                type="text"
                placeholder="Nome da oficina"
                value={form.shop}
                onChange={e => set('shop', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Next maintenance */}
          <div className="border border-amber-100 bg-amber-50 rounded-xl p-3 space-y-3">
            <p className="text-xs font-semibold text-amber-800">Próxima manutenção (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-amber-700 mb-1">Próx. KM</label>
                <input
                  type="number"
                  placeholder="Ex: 60000"
                  value={form.next_km}
                  onChange={e => set('next_km', e.target.value)}
                  className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs text-amber-700 mb-1">Próx. data</label>
                <input
                  type="date"
                  value={form.next_date}
                  onChange={e => set('next_date', e.target.value)}
                  className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descrição / Observações</label>
            <textarea
              rows={2}
              placeholder="Detalhes sobre o serviço..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !form.date}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Salvando...' : maintenance ? 'Salvar' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Update KM Modal ───────────────────────────────────────────────────────────

function UpdateKmModal({ vehicle, onClose, onSaved }: {
  vehicle: Vehicle
  onClose: () => void
  onSaved: (v: Vehicle) => void
}) {
  const supabase = createClient()
  const [km, setKm] = useState(vehicle.current_km.toString())
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    const newKm = parseInt(km)
    if (isNaN(newKm) || newKm < 0) return
    setLoading(true)
    const db = supabase as any
    const { data, error } = await db
      .from('vehicles')
      .update({ current_km: newKm })
      .eq('id', vehicle.id)
      .select()
      .single()
    if (!error) onSaved(data as Vehicle)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs p-5"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-semibold text-gray-900 mb-1">Atualizar KM</h3>
        <p className="text-xs text-gray-400 mb-3">{vehicle.name}</p>
        <input
          type="number"
          value={km}
          onChange={e => setKm(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Atualizar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Vehicle Card ──────────────────────────────────────────────────────────────

function VehicleCard({
  vehicle,
  maintenances,
  onEdit,
  onDelete,
  onAddMaintenance,
  onEditMaintenance,
  onDeleteMaintenance,
  onUpdateKm,
}: {
  vehicle: Vehicle
  maintenances: Maintenance[]
  onEdit: () => void
  onDelete: () => void
  onAddMaintenance: () => void
  onEditMaintenance: (m: Maintenance) => void
  onDeleteMaintenance: (id: string) => void
  onUpdateKm: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const alertLevel = getVehicleAlertLevel(maintenances, vehicle.current_km)
  const totalCost = maintenances.reduce((s, m) => s + (m.cost ?? 0), 0)
  const lastMaint = maintenances[0]

  const colorHex = VEHICLE_COLORS.find(c => c.value === vehicle.color)?.hex ?? '#9ca3af'

  // Upcoming alerts
  const upcomingAlerts = maintenances.filter(m => {
    const a = getMaintenanceAlert(m, vehicle.current_km)
    return a === 'overdue' || a === 'soon'
  })

  return (
    <div className={cn(
      'bg-white border rounded-2xl shadow-sm overflow-hidden transition-all',
      alertLevel === 'overdue' ? 'border-red-200' : alertLevel === 'soon' ? 'border-amber-200' : 'border-gray-100'
    )}>
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Color dot + icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-gray-200"
            style={{ backgroundColor: colorHex + '22', borderColor: colorHex + '44' }}
          >
            <Car className="w-5 h-5" style={{ color: colorHex === '#ffffff' ? '#9ca3af' : colorHex }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm">{vehicle.name}</h3>
              {alertLevel === 'overdue' && (
                <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  <AlertTriangle className="w-3 h-3" /> Manutenção atrasada
                </span>
              )}
              {alertLevel === 'soon' && (
                <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  <Clock className="w-3 h-3" /> Manutenção próxima
                </span>
              )}
            </div>

            {(vehicle.make || vehicle.model || vehicle.year) && (
              <p className="text-xs text-gray-500 mt-0.5">
                {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' · ')}
              </p>
            )}

            <div className="flex items-center flex-wrap gap-3 mt-2">
              {vehicle.plate && (
                <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-mono">
                  {vehicle.plate}
                </span>
              )}
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', FUEL_COLORS[vehicle.fuel_type] ?? 'bg-gray-100 text-gray-600')}>
                {FUEL_LABELS[vehicle.fuel_type] ?? vehicle.fuel_type}
              </span>
              <button
                onClick={onUpdateKm}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 hover:bg-primary-50 px-2 py-0.5 rounded-lg transition-colors"
                title="Clique para atualizar o KM"
              >
                <Gauge className="w-3.5 h-3.5" />
                {formatKm(vehicle.current_km)}
              </button>
            </div>
          </div>

          {/* Actions */}
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
            <p className="text-xs text-gray-400">Total gasto</p>
            <p className="text-sm font-semibold text-gray-700">{formatCurrency(totalCost)}</p>
          </div>
          {lastMaint && (
            <div className="text-center">
              <p className="text-xs text-gray-400">Última</p>
              <p className="text-sm font-semibold text-gray-700">{formatDate(lastMaint.date)}</p>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onAddMaintenance}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Wrench className="w-3.5 h-3.5" />
              Registrar
            </button>
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming alerts */}
      {upcomingAlerts.length > 0 && !expanded && (
        <div className={cn(
          'px-4 py-2 border-t text-xs',
          alertLevel === 'overdue' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
        )}>
          {upcomingAlerts.slice(0, 2).map(m => {
            const a = getMaintenanceAlert(m, vehicle.current_km)
            return (
              <span key={m.id} className="inline-flex items-center gap-1 mr-3">
                {a === 'overdue'
                  ? <AlertTriangle className="w-3 h-3 text-red-500" />
                  : <Clock className="w-3 h-3 text-amber-500" />}
                <span className={a === 'overdue' ? 'text-red-700' : 'text-amber-700'}>
                  {m.type}
                  {m.next_date && ` · ${formatDate(m.next_date)}`}
                  {m.next_km && ` · ${formatKm(m.next_km)}`}
                </span>
              </span>
            )
          })}
        </div>
      )}

      {/* Maintenance history */}
      {expanded && (
        <div className="border-t border-gray-100">
          {maintenances.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Wrench className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nenhuma manutenção registrada</p>
              <button
                onClick={onAddMaintenance}
                className="mt-2 text-xs text-primary-600 hover:underline"
              >
                Registrar a primeira manutenção
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {maintenances.map(m => {
                const alert = getMaintenanceAlert(m, vehicle.current_km)
                return (
                  <div key={m.id} className="px-4 py-3 flex items-start gap-3">
                    {/* Alert indicator */}
                    <div className={cn(
                      'w-2 h-2 rounded-full mt-1.5 shrink-0',
                      alert === 'overdue' ? 'bg-red-500' : alert === 'soon' ? 'bg-amber-400' : alert === 'ok' ? 'bg-green-400' : 'bg-gray-200'
                    )} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800">{m.type}</span>
                        {m.cost != null && (
                          <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {formatCurrency(m.cost)}
                          </span>
                        )}
                        {alert === 'overdue' && (
                          <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-medium">Atrasada</span>
                        )}
                        {alert === 'soon' && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">Em breve</span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" /> {formatDate(m.date)}
                        </span>
                        {m.km_at_service != null && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Gauge className="w-3 h-3" /> {formatKm(m.km_at_service)}
                          </span>
                        )}
                        {m.shop && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" /> {m.shop}
                          </span>
                        )}
                      </div>

                      {(m.next_km || m.next_date) && (
                        <div className="flex flex-wrap gap-x-3 mt-1">
                          {m.next_km && (
                            <span className={cn(
                              'text-xs',
                              alert === 'overdue' ? 'text-red-500' : alert === 'soon' ? 'text-amber-500' : 'text-gray-400'
                            )}>
                              Próx.: {formatKm(m.next_km)}
                            </span>
                          )}
                          {m.next_date && (
                            <span className={cn(
                              'text-xs',
                              alert === 'overdue' ? 'text-red-500' : alert === 'soon' ? 'text-amber-500' : 'text-gray-400'
                            )}>
                              Próx.: {formatDate(m.next_date)}
                            </span>
                          )}
                        </div>
                      )}

                      {m.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{m.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditMaintenance(m)}
                        className="p-1 text-gray-300 hover:text-primary-600 rounded transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteMaintenance(m.id)}
                        className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors"
                      >
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

// ── CSV Export ────────────────────────────────────────────────────────────────

function exportAllCSV(vehicles: Vehicle[], maintenances: Maintenance[]) {
  const rows = [
    ['Veículo', 'Marca', 'Modelo', 'Ano', 'Placa', 'KM Atual', 'Tipo', 'Data', 'KM Serviço', 'Valor (R$)', 'Oficina', 'Próx. KM', 'Próx. Data'],
  ]
  for (const v of vehicles) {
    const ms = maintenances.filter(m => m.vehicle_id === v.id)
    if (ms.length === 0) {
      rows.push([v.name, v.make ?? '', v.model ?? '', v.year?.toString() ?? '', v.plate ?? '', v.current_km.toString(), '', '', '', '', '', '', ''])
    } else {
      for (const m of ms) {
        rows.push([
          v.name, v.make ?? '', v.model ?? '', v.year?.toString() ?? '', v.plate ?? '', v.current_km.toString(),
          m.type, m.date, m.km_at_service?.toString() ?? '', m.cost?.toFixed(2) ?? '',
          m.shop ?? '', m.next_km?.toString() ?? '', m.next_date ?? '',
        ])
      }
    }
  }
  const csv = '\uFEFF' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = `veiculos_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

// ── Main Client ───────────────────────────────────────────────────────────────

export function VehiclesClient({
  coupleId,
  initialVehicles,
  initialMaintenances,
}: {
  coupleId: string
  initialVehicles: Vehicle[]
  initialMaintenances: Maintenance[]
}) {
  const supabase = createClient()
  const { show: showToast, ToastContainer } = useToast()

  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles)
  const [maintenances, setMaintenances] = useState<Maintenance[]>(initialMaintenances)

  const [vehicleModal, setVehicleModal] = useState<Vehicle | null | 'new'>(null)
  const [maintenanceModal, setMaintenanceModal] = useState<{ vehicle: Vehicle; maintenance: Maintenance | null } | null>(null)
  const [updateKmModal, setUpdateKmModal] = useState<Vehicle | null>(null)

  // Group maintenances by vehicle
  const maintByVehicle = useMemo(() => {
    const map: Record<string, Maintenance[]> = {}
    for (const m of maintenances) {
      if (!map[m.vehicle_id]) map[m.vehicle_id] = []
      map[m.vehicle_id].push(m)
    }
    return map
  }, [maintenances])

  // Summary stats
  const totalVehicles = vehicles.length
  const totalCost = maintenances.reduce((s, m) => s + (m.cost ?? 0), 0)
  const overdueCount = vehicles.filter(v => {
    const ms = maintByVehicle[v.id] ?? []
    return getVehicleAlertLevel(ms, v.current_km) === 'overdue'
  }).length
  const soonCount = vehicles.filter(v => {
    const ms = maintByVehicle[v.id] ?? []
    return getVehicleAlertLevel(ms, v.current_km) === 'soon'
  }).length

  async function handleDeleteVehicle(id: string) {
    if (!await confirmDialog('Excluir este veículo e todas as suas manutenções?')) return
    const { error } = await (supabase as any).from('vehicles').update({ active: false }).eq('id', id)
    if (error) { showToast('Erro ao excluir', 'error'); return }
    setVehicles(v => v.filter(x => x.id !== id))
    setMaintenances(m => m.filter(x => x.vehicle_id !== id))
    showToast('Veículo removido')
  }

  async function handleDeleteMaintenance(id: string) {
    if (!await confirmDialog('Excluir esta manutenção?')) return
    const { error } = await supabase.from('vehicle_maintenances').delete().eq('id', id)
    if (error) { showToast('Erro ao excluir', 'error'); return }
    setMaintenances(m => m.filter(x => x.id !== id))
    showToast('Manutenção removida')
  }

  function handleVehicleSaved(v: Vehicle) {
    setVehicles(prev => {
      const idx = prev.findIndex(x => x.id === v.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = v; return n }
      return [v, ...prev]
    })
    setVehicleModal(null)
    showToast(vehicleModal === 'new' ? 'Veículo criado!' : 'Veículo atualizado!')
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

  function handleKmSaved(v: Vehicle) {
    setVehicles(prev => prev.map(x => x.id === v.id ? v : x))
    setUpdateKmModal(null)
    showToast('KM atualizado!')
  }

  return (
    <>
      <ToastContainer />

      {vehicleModal !== null && (
        <VehicleModal
          vehicle={vehicleModal === 'new' ? null : vehicleModal}
          coupleId={coupleId}
          onClose={() => setVehicleModal(null)}
          onSaved={handleVehicleSaved}
        />
      )}

      {maintenanceModal && (
        <MaintenanceModal
          maintenance={maintenanceModal.maintenance}
          vehicle={maintenanceModal.vehicle}
          coupleId={coupleId}
          onClose={() => setMaintenanceModal(null)}
          onSaved={handleMaintenanceSaved}
        />
      )}

      {updateKmModal && (
        <UpdateKmModal
          vehicle={updateKmModal}
          onClose={() => setUpdateKmModal(null)}
          onSaved={handleKmSaved}
        />
      )}

      <MaintenanceAlertChecker />

      <div className="p-4 md:p-6 space-y-6 max-w-4xl">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Meus Veículos</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalVehicles} veículo{totalVehicles !== 1 ? 's' : ''} · {maintenances.length} manutenções registradas
            </p>
          </div>
          <div className="flex items-center gap-2">
            {maintenances.length > 0 && (
              <button
                onClick={() => exportAllCSV(vehicles, maintenances)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" /> CSV
              </button>
            )}
            <button
              onClick={() => setVehicleModal('new')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Novo Veículo
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {totalVehicles > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400">Veículos</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{totalVehicles}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400">Total gasto</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">{formatCurrency(totalCost)}</p>
            </div>
            {overdueCount > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-red-500">Manutenções atrasadas</p>
                <p className="text-xl font-bold text-red-700 mt-1">{overdueCount}</p>
              </div>
            )}
            {soonCount > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-amber-600">Próximas manutenções</p>
                <p className="text-xl font-bold text-amber-700 mt-1">{soonCount}</p>
              </div>
            )}
          </div>
        )}

        {/* Vehicles list */}
        {vehicles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-gray-600 font-semibold mb-1">Nenhum veículo cadastrado</h3>
            <p className="text-sm text-gray-400 mb-4">Adicione seu carro ou moto para controlar as manutenções.</p>
            <button
              onClick={() => setVehicleModal('new')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Adicionar primeiro veículo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {vehicles.map(v => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                maintenances={maintByVehicle[v.id] ?? []}
                onEdit={() => setVehicleModal(v)}
                onDelete={() => handleDeleteVehicle(v.id)}
                onAddMaintenance={() => setMaintenanceModal({ vehicle: v, maintenance: null })}
                onEditMaintenance={m => setMaintenanceModal({ vehicle: v, maintenance: m })}
                onDeleteMaintenance={handleDeleteMaintenance}
                onUpdateKm={() => setUpdateKmModal(v)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
