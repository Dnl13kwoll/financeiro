'use client'
import { Printer } from 'lucide-react'

export function PrintReportButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors print:hidden"
      title={`Imprimir / salvar como PDF: ${label}`}
    >
      <Printer className="w-4 h-4" />
      PDF
    </button>
  )
}
