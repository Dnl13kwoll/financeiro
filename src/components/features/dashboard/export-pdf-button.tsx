'use client'
import { FileDown } from 'lucide-react'

export function ExportPdfButton() {
  function handleClick() {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    window.open(`/reports/print?month=${month}`, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-gray-300 transition-colors"
      title="Exportar relatório mensal em PDF"
    >
      <FileDown className="w-3.5 h-3.5" />
      Exportar PDF
    </button>
  )
}
