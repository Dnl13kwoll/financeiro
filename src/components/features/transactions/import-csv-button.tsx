'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react'

type ParsedRow = {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  raw: string
}

type Account = { id: string; name: string }

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const rows: ParsedRow[] = []

  for (const line of lines) {
    // Try common Brazilian bank CSV formats
    // Format: date,description,amount
    const cols = line.split(/[;,]/).map(c => c.replace(/^"|"$/g, '').trim())
    if (cols.length < 2) continue

    // Try to find a date
    const dateStr = cols.find(c => /\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(c) || /\d{4}[\/\-]\d{2}[\/\-]\d{2}/.test(c))
    if (!dateStr) continue

    // Parse date to YYYY-MM-DD
    let isoDate = ''
    const mBR = dateStr.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
    const mISO = dateStr.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/)
    if (mBR) isoDate = `${mBR[3]}-${mBR[2]}-${mBR[1]}`
    else if (mISO) isoDate = dateStr.replace(/\//g, '-')
    if (!isoDate) continue

    // Find amount (a number, possibly with comma as decimal)
    const amountStr = cols.find(c => /^-?[\d.,]+$/.test(c.replace(/\s/g, '')) && c !== dateStr)
    if (!amountStr) continue
    const amount = Math.abs(parseFloat(amountStr.replace(/\./g, '').replace(',', '.')))
    if (isNaN(amount) || amount === 0) continue
    const isNegative = amountStr.trim().startsWith('-')

    // Description: the longest text column
    const desc = cols
      .filter(c => c !== dateStr && c !== amountStr && isNaN(parseFloat(c.replace(',', '.'))))
      .sort((a, b) => b.length - a.length)[0] ?? ''

    rows.push({
      date: isoDate,
      description: desc,
      amount,
      type: isNegative ? 'expense' : 'income',
      raw: line,
    })
  }

  return rows
}

export function ImportCSVButton({
  coupleId,
  userId,
  accounts,
}: {
  coupleId: string
  userId: string
  accounts: Account[]
}) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [defaultType, setDefaultType] = useState<'expense' | 'income' | 'auto'>('auto')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError('')
    setRows([])
    setDone(false)
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        setError('Não foi possível interpretar o arquivo. Verifique se é um CSV com colunas de data, descrição e valor.')
        return
      }
      setRows(parsed)
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleImport() {
    if (!accountId) { setError('Selecione uma conta'); return }
    setLoading(true)
    const supabase = createClient()
    const payload = rows.map(r => ({
      type: defaultType === 'auto' ? r.type : defaultType,
      amount: r.amount,
      description: r.description || null,
      account_id: accountId,
      date: r.date,
      competence_date: r.date,
      user_id: userId,
      couple_id: coupleId,
    }))

    const { error: err } = await supabase.from('transactions').insert(payload as any)
    if (err) { setError(err.message); setLoading(false); return }

    setDone(true)
    setLoading(false)
    router.refresh()
  }

  function handleClose() {
    setOpen(false)
    setRows([])
    setError('')
    setDone(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Importar CSV
      </button>

      <Modal open={open} onClose={handleClose} title="Importar Extrato CSV">
        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">{rows.length} transações importadas!</p>
            <button onClick={handleClose} className="mt-4 text-sm text-primary-600 hover:underline">Fechar</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              Suporta CSV de bancos brasileiros (Nubank, Inter, Itaú, etc). O arquivo deve ter colunas de <strong>data</strong>, <strong>descrição</strong> e <strong>valor</strong>.
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo CSV</label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFile}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white file:text-sm file:font-medium hover:file:bg-primary-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conta destino</label>
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo padrão</label>
                <select
                  value={defaultType}
                  onChange={e => setDefaultType(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="auto">Automático (pelo sinal)</option>
                  <option value="expense">Tudo como Saída</option>
                  <option value="income">Tudo como Entrada</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {rows.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">{rows.length} transações encontradas — prévia:</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500">Data</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500">Descrição</th>
                        <th className="px-2 py-1.5 text-right font-medium text-gray-500">Valor</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500">Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 20).map((r, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-2 py-1.5 text-gray-600">{r.date}</td>
                          <td className="px-2 py-1.5 text-gray-700 truncate max-w-[120px]">{r.description || '—'}</td>
                          <td className="px-2 py-1.5 text-right font-medium">R$ {r.amount.toFixed(2)}</td>
                          <td className={`px-2 py-1.5 ${r.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                            {defaultType === 'auto' ? (r.type === 'expense' ? 'Saída' : 'Entrada') : (defaultType === 'expense' ? 'Saída' : 'Entrada')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 20 && <p className="text-center text-xs text-gray-400 py-2">+{rows.length - 20} mais...</p>}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={handleClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
              <button
                onClick={handleImport}
                disabled={rows.length === 0 || loading}
                className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Importando...' : `Importar ${rows.length} transações`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
