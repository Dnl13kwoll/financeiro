'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload } from 'lucide-react'
import { showToast } from '@/components/ui/toast'

type BackupData = {
  version: string
  exported_at: string
  data: {
    transactions?: any[]
    installments?: any[]
    installment_items?: any[]
    recurring_accounts?: any[]
    recurring_records?: any[]
    accounts?: any[]
    budgets?: any[]
    goals?: any[]
    goal_history?: any[]
    categories?: any[]
  }
}

const TABLES: { key: keyof BackupData['data']; table: string }[] = [
  { key: 'accounts', table: 'accounts' },
  { key: 'categories', table: 'categories' },
  { key: 'transactions', table: 'transactions' },
  { key: 'installments', table: 'installments' },
  { key: 'installment_items', table: 'installment_items' },
  { key: 'recurring_accounts', table: 'recurring_accounts' },
  { key: 'recurring_records', table: 'recurring_records' },
  { key: 'budgets', table: 'budgets' },
  { key: 'goals', table: 'goals' },
  { key: 'goal_history', table: 'goal_history' },
]

export function BackupImport() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<{ key: string; count: number }[] | null>(null)
  const [backup, setBackup] = useState<BackupData | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const parsed: BackupData = JSON.parse(evt.target?.result as string)
        if (!parsed.data) {
          showToast('Arquivo de backup inválido.', 'error')
          return
        }
        setBackup(parsed)
        setPreview(
          TABLES
            .map(({ key }) => ({ key, count: (parsed.data[key] ?? []).length }))
            .filter(({ count }) => count > 0)
        )
      } catch {
        showToast('Erro ao ler o arquivo. Verifique se é um JSON válido.', 'error')
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!backup) return
    setLoading(true)

    const supabase = createClient()
    let totalInserted = 0
    let errors = 0

    for (const { key, table } of TABLES) {
      const rows = backup.data[key]
      if (!rows || rows.length === 0) continue

      const { error } = await supabase.from(table as any).upsert(rows, { onConflict: 'id', ignoreDuplicates: false })
      if (error) {
        console.error(`Error importing ${table}:`, error.message)
        errors++
      } else {
        totalInserted += rows.length
      }
    }

    setLoading(false)
    setPreview(null)
    setBackup(null)
    if (inputRef.current) inputRef.current.value = ''

    if (errors === 0) {
      showToast(`Backup importado com sucesso! ${totalInserted} registros restaurados.`)
    } else {
      showToast(`Importação concluída com ${errors} erro(s). Verifique o console.`, 'error')
    }
  }

  function handleCancel() {
    setPreview(null)
    setBackup(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
        id="backup-import-input"
      />

      {!preview ? (
        <label
          htmlFor="backup-import-input"
          className="flex items-center gap-2 text-sm text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer w-fit"
        >
          <Upload className="w-4 h-4" />
          Selecionar arquivo de backup (.json)
        </label>
      ) : (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
            <p className="font-medium text-amber-800 mb-2">Confirmar importação</p>
            <p className="text-amber-700 mb-3 text-xs">
              Os dados existentes serão mesclados (upsert). Registros com o mesmo ID serão sobrescritos.
            </p>
            <div className="grid grid-cols-2 gap-1">
              {preview.map(({ key, count }) => (
                <div key={key} className="text-xs text-amber-700">
                  <span className="font-medium">{count}</span> {key.replace(/_/g, ' ')}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-white bg-primary-600 px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {loading ? 'Importando...' : 'Confirmar importação'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
