'use client'
import { useState } from 'react'
import { Download, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function escapeCSV(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

function rowsToXLS(rows: any[]): string {
  // Simple XML-based XLS (Excel-compatible)
  const headers = ['Data', 'Descrição', 'Tipo', 'Valor', 'Categoria', 'Conta', 'Tags', 'Comentário', 'Privado', 'Comprovante']
  const toCell = (v: string | number | null | undefined) => `<Cell><Data ss:Type="String">${String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell>`
  const headerRow = headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')
  const dataRows = rows.map((t: any) => [
    t.date,
    t.description,
    t.type === 'income' ? 'Entrada' : t.type === 'expense' ? 'Saída' : 'Transferência',
    t.type === 'expense' ? -t.amount : t.amount,
    t.categories?.name ?? '',
    t.accounts?.name ?? '',
    (t.tags ?? []).join('; '),
    t.comment ?? '',
    t.is_private ? 'Sim' : 'Não',
    t.receipt_url ?? '',
  ].map(toCell).join('')).map(r => `<Row>${r}</Row>`).join('')

  return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Transações"><Table><Row>${headerRow}</Row>${dataRows}</Table></Worksheet></Workbook>`
}

export function ExportButton({
  coupleId,
  filters,
}: {
  coupleId: string
  filters: {
    monthStart: string
    monthEnd: string
    type?: string
    category_id?: string
    account_id?: string
    q?: string
    tag?: string
  }
}) {
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  async function fetchRows(): Promise<any[]> {
    const supabase = createClient()
    let query = (supabase.from('transactions') as any)
      .select('date, description, amount, type, categories(name), accounts(name), tags, comment, is_private, receipt_url')
      .eq('couple_id', coupleId)
      .gte('competence_date', filters.monthStart)
      .lte('competence_date', filters.monthEnd)
      .is('deleted_at', null)
      .order('date', { ascending: false })
    if (filters.type) query = query.eq('type', filters.type)
    if (filters.category_id) query = query.eq('category_id', filters.category_id)
    if (filters.account_id) query = query.eq('account_id', filters.account_id)
    const { data } = await query
    let rows: any[] = data ?? []
    if (filters.q) { const q = filters.q.toLowerCase(); rows = rows.filter((t: any) => (t.description ?? '').toLowerCase().includes(q) || (t.categories?.name ?? '').toLowerCase().includes(q)) }
    if (filters.tag) { const tag = filters.tag.toLowerCase(); rows = rows.filter((t: any) => (t.tags ?? []).some((tg: string) => tg.toLowerCase().includes(tag))) }
    return rows
  }

  async function handleExportCSV() {
    setLoading(true); setMenuOpen(false)
    const rows = await fetchRows()
    const header = ['Data', 'Descrição', 'Tipo', 'Valor', 'Categoria', 'Conta', 'Tags', 'Comentário', 'Privado', 'Comprovante']
    const lines = [header.join(','), ...rows.map((t: any) => [escapeCSV(t.date), escapeCSV(t.description), escapeCSV(t.type === 'income' ? 'Entrada' : t.type === 'expense' ? 'Saída' : 'Transferência'), escapeCSV(t.type === 'expense' ? -t.amount : t.amount), escapeCSV(t.categories?.name), escapeCSV(t.accounts?.name), escapeCSV((t.tags ?? []).join('; ')), escapeCSV(t.comment), escapeCSV(t.is_private ? 'Sim' : 'Não'), escapeCSV(t.receipt_url)].join(','))]
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `transacoes_${filters.monthStart}_${filters.monthEnd}.csv`; a.click()
    URL.revokeObjectURL(url); setLoading(false)
  }

  async function handleExportXLS() {
    setLoading(true); setMenuOpen(false)
    const rows = await fetchRows()
    const blob = new Blob([rowsToXLS(rows)], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `transacoes_${filters.monthStart}_${filters.monthEnd}.xls`; a.click()
    URL.revokeObjectURL(url); setLoading(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(o => !o)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {loading ? 'Exportando...' : 'Exportar'}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-36 py-1">
          <button onClick={handleExportCSV} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">CSV (.csv)</button>
          <button onClick={handleExportXLS} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Excel (.xls)</button>
        </div>
      )}
    </div>
  )
}
