'use client'
import { Download } from 'lucide-react'

type ExportInvestment = {
  name: string
  type: string
  institution: string | null
  invested_amount: number
  current_value: number | null
  rate_type: string | null
  rate_value: number | null
  liquidity: string | null
  start_date: string
  maturity_date: string | null
  notes: string | null
}

export function InvestmentExportButton({ investments, typeLabels }: {
  investments: ExportInvestment[]
  typeLabels: Record<string, string>
}) {
  function handleExport() {
    const headers = [
      'Nome', 'Tipo', 'Instituição', 'Valor Investido', 'Valor Atual',
      'Tipo de Taxa', 'Taxa', 'Liquidez', 'Data de Início', 'Vencimento', 'Observações',
    ]

    const rows = investments.map(inv => [
      inv.name,
      typeLabels[inv.type] ?? inv.type,
      inv.institution ?? '',
      inv.invested_amount.toFixed(2),
      inv.current_value != null ? inv.current_value.toFixed(2) : '',
      inv.rate_type ?? '',
      inv.rate_value != null ? inv.rate_value.toFixed(2) : '',
      inv.liquidity ?? '',
      inv.start_date,
      inv.maturity_date ?? '',
      inv.notes ?? '',
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `investimentos-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      title="Exportar para CSV"
    >
      <Download className="w-4 h-4" />
      Exportar CSV
    </button>
  )
}
