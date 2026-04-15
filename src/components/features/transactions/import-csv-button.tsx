'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Upload, AlertCircle, CheckCircle2, Settings2 } from 'lucide-react'

type ParsedRow = {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
}

type Account = { id: string; name: string }

type ColumnMap = {
  date: number
  description: number
  amount: number
  type_col: number | null
}

function parseDate(str: string): string | null {
  const mBR = str.trim().match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
  const mISO = str.trim().match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/)
  if (mBR) return `${mBR[3]}-${mBR[2]}-${mBR[1]}`
  if (mISO) return str.trim().replace(/\//g, '-')
  return null
}

function splitLine(line: string): string[] {
  return line.split(/[;,]/).map(c => c.replace(/^"|"$/g, '').trim())
}

function autoDetectColumns(headers: string[]): ColumnMap {
  const lh = headers.map(h => h.toLowerCase())
  const dateIdx = lh.findIndex(h => /data|date|dt/.test(h))
  const descIdx = lh.findIndex(h => /descri|memo|hist|lançamento|lancamento|detail/.test(h))
  const amtIdx = lh.findIndex(h => /valor|amount|value|vl|credit|debit/.test(h))
  return {
    date: dateIdx >= 0 ? dateIdx : 0,
    description: descIdx >= 0 ? descIdx : 1,
    amount: amtIdx >= 0 ? amtIdx : 2,
    type_col: null,
  }
}

function parseRowsWithMap(lines: string[], headers: string[], map: ColumnMap, defaultType: 'expense' | 'income' | 'auto'): ParsedRow[] {
  const rows: ParsedRow[] = []
  for (const line of lines) {
    const cols = splitLine(line)
    if (cols.length < 2) continue
    const dateRaw = cols[map.date] ?? ''
    const isoDate = parseDate(dateRaw)
    if (!isoDate) continue
    const amountRaw = (cols[map.amount] ?? '').replace(/\s/g, '')
    const amount = Math.abs(parseFloat(amountRaw.replace(/\./g, '').replace(',', '.')))
    if (isNaN(amount) || amount === 0) continue
    const isNegative = amountRaw.startsWith('-')
    const desc = cols[map.description] ?? ''
    const type = defaultType === 'auto' ? (isNegative ? 'expense' : 'income') : defaultType
    rows.push({ date: isoDate, description: desc, amount, type })
  }
  return rows
}

export function ImportCSVButton({ coupleId, userId, accounts }: { coupleId: string; userId: string; accounts: Account[] }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'done'>('upload')
  const [rawLines, setRawLines] = useState<string[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [colMap, setColMap] = useState<ColumnMap>({ date: 0, description: 1, amount: 2, type_col: null })
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [defaultType, setDefaultType] = useState<'expense' | 'income' | 'auto'>('auto')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length < 2) { setError('Arquivo muito curto ou sem dados.'); return }
      const hdrs = splitLine(lines[0])
      setHeaders(hdrs)
      setRawLines(lines.slice(1))
      setColMap(autoDetectColumns(hdrs))
      setStep('map')
    }
    reader.readAsText(file, 'UTF-8')
  }

  function applyMap() {
    const parsed = parseRowsWithMap(rawLines, headers, colMap, defaultType)
    if (parsed.length === 0) { setError('Nenhuma linha válida encontrada com este mapeamento.'); return }
    setRows(parsed)
    setError('')
    setStep('preview')
  }

  async function handleImport() {
    if (!accountId) { setError('Selecione uma conta'); return }
    setLoading(true)
    const supabase = createClient()
    const payload = rows.map(r => ({
      type: r.type,
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
    setStep('done')
    setLoading(false)
    router.refresh()
  }

  function handleClose() {
    setOpen(false)
    setStep('upload')
    setRows([])
    setRawLines([])
    setHeaders([])
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
        <Upload className="w-4 h-4" />
        Importar CSV
      </button>

      <Modal open={open} onClose={handleClose} title="Importar Extrato CSV">
        {step === 'done' ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">{rows.length} transações importadas!</p>
            <button onClick={handleClose} className="mt-4 text-sm text-primary-600 hover:underline">Fechar</button>
          </div>
        ) : step === 'upload' ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              Suporta CSV com cabeçalho. Na próxima etapa você pode mapear as colunas manualmente.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo CSV</label>
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white file:text-sm file:font-medium hover:file:bg-primary-700"
              />
            </div>
            {error && <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
          </div>
        ) : step === 'map' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Settings2 className="w-4 h-4 text-gray-400" />
              Mapeamento de colunas — {rawLines.length} linhas encontradas
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['date', 'description', 'amount'] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                    {field === 'date' ? 'Data' : field === 'description' ? 'Descrição' : 'Valor'}
                  </label>
                  <select
                    value={(colMap as any)[field]}
                    onChange={e => setColMap(prev => ({ ...prev, [field]: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {headers.map((h, i) => <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo padrão</label>
                <select value={defaultType} onChange={e => setDefaultType(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="auto">Auto (pelo sinal)</option>
                  <option value="expense">Tudo Saída</option>
                  <option value="income">Tudo Entrada</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Conta destino</label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            {/* Preview row 1 */}
            {rawLines[0] && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600 truncate">
                Amostra: {splitLine(rawLines[0]).map((v, i) => <span key={i} className="mr-2">[{i}] {v}</span>)}
              </div>
            )}
            {error && <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setStep('upload')} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Voltar</button>
              <button onClick={applyMap} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Ver prévia →</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">{rows.length} transações — prévia:</p>
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
                      <td className={`px-2 py-1.5 ${r.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>{r.type === 'expense' ? 'Saída' : 'Entrada'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 20 && <p className="text-center text-xs text-gray-400 py-2">+{rows.length - 20} mais...</p>}
            </div>
            {error && <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setStep('map')} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Voltar</button>
              <button onClick={handleImport} disabled={loading}
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
