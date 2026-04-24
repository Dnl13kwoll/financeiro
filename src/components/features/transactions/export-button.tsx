'use client'
import { useState } from 'react'
import { Download, ChevronDown, FileText } from 'lucide-react'
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

  async function handleExportPDF() {
    setLoading(true); setMenuOpen(false)
    const rows = await fetchRows()
    const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    const totalIncome = rows.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpense = rows.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const balance = totalIncome - totalExpense

    const tableRows = rows.map(t => `
      <tr>
        <td>${t.date}</td>
        <td>${t.description ?? '—'}</td>
        <td>${t.categories?.name ?? '—'}</td>
        <td>${t.accounts?.name ?? '—'}</td>
        <td class="${t.type === 'income' ? 'income' : t.type === 'expense' ? 'expense' : 'transfer'}">
          ${t.type === 'income' ? 'Entrada' : t.type === 'expense' ? 'Saída' : 'Transf.'}
        </td>
        <td class="amount ${t.type === 'income' ? 'income' : t.type === 'expense' ? 'expense' : ''}">
          ${t.type === 'expense' ? '-' : '+'}${fmt(t.amount)}
        </td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Extrato de Transações — ${filters.monthStart} a ${filters.monthEnd}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1f2937; background: white; }
  .header { padding: 24px 32px 16px; border-bottom: 2px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-start; }
  .logo { font-size: 20px; font-weight: 700; color: #6366f1; }
  .subtitle { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .period { text-align: right; }
  .period-label { font-size: 10px; color: #6b7280; }
  .period-value { font-size: 13px; font-weight: 600; color: #374151; }
  .summary { display: flex; gap: 0; border-bottom: 1px solid #e5e7eb; }
  .summary-card { flex: 1; padding: 14px 32px; border-right: 1px solid #f3f4f6; }
  .summary-card:last-child { border-right: none; }
  .summary-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .summary-value { font-size: 16px; font-weight: 700; }
  .green { color: #059669; }
  .red { color: #dc2626; }
  .blue { color: #6366f1; }
  table { width: 100%; border-collapse: collapse; margin: 0; }
  thead th { background: #f9fafb; padding: 8px 12px; text-align: left; font-weight: 600; font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; }
  tbody tr { border-bottom: 1px solid #f3f4f6; }
  tbody tr:hover { background: #fafafa; }
  td { padding: 7px 12px; font-size: 11px; color: #374151; }
  td.income { color: #059669; font-weight: 500; }
  td.expense { color: #dc2626; font-weight: 500; }
  td.transfer { color: #6366f1; font-weight: 500; }
  td.amount { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
  .footer { padding: 16px 32px; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 9px; display: flex; justify-content: space-between; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    .header { padding: 16px 24px 12px; }
    .summary-card { padding: 10px 24px; }
    td, th { padding: 5px 10px; }
  }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">Financeiro</div>
    <div class="subtitle">para casais — extrato de transações</div>
  </div>
  <div class="period">
    <div class="period-label">Período</div>
    <div class="period-value">${filters.monthStart} → ${filters.monthEnd}</div>
    <div class="period-label" style="margin-top:4px">${rows.length} transação(ões)</div>
  </div>
</div>
<div class="summary">
  <div class="summary-card"><div class="summary-label">Receitas</div><div class="summary-value green">${fmt(totalIncome)}</div></div>
  <div class="summary-card"><div class="summary-label">Despesas</div><div class="summary-value red">${fmt(totalExpense)}</div></div>
  <div class="summary-card"><div class="summary-label">Saldo</div><div class="summary-value ${balance >= 0 ? 'green' : 'red'}">${fmt(balance)}</div></div>
</div>
<table>
  <thead>
    <tr>
      <th>Data</th><th>Descrição</th><th>Categoria</th><th>Conta</th><th>Tipo</th><th style="text-align:right">Valor</th>
    </tr>
  </thead>
  <tbody>${tableRows}</tbody>
</table>
<div class="footer">
  <span>Gerado em ${new Date().toLocaleDateString('pt-BR')} — Financeiro para casais</span>
  <span>${rows.length} transações</span>
</div>
<script>window.onload = () => { window.print() }</script>
</body></html>`

    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close() }
    setLoading(false)
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
          <button onClick={handleExportPDF} className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm hover:bg-gray-50"><FileText className="w-3.5 h-3.5 text-gray-400" />PDF</button>
        </div>
      )}
    </div>
  )
}
