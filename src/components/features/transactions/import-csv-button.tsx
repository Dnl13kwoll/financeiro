'use client'
import { useState, useRef, useTransition} from 'react'
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

type FormatProfile = {
  name: string
  separator: string | RegExp
  colMap: ColumnMap
  typeMap?: Record<string, 'income' | 'expense'>
  defaultType: 'expense' | 'income' | 'auto'
}

const FORMAT_PROFILES: Record<string, FormatProfile> = {
  auto: {
    name: 'Detectar automaticamente',
    separator: /[;,]/,
    colMap: { date: 0, description: 1, amount: 2, type_col: null },
    defaultType: 'auto',
  },
  nubank: {
    name: 'Nubank (fatura)',
    // date,category,title,amount
    separator: ',',
    colMap: { date: 0, description: 2, amount: 3, type_col: null },
    defaultType: 'expense',
  },
  nubank_conta: {
    name: 'Nubank (conta corrente)',
    // Data;Valor;Identificador;Descrição
    separator: ';',
    colMap: { date: 0, description: 3, amount: 1, type_col: null },
    defaultType: 'auto',
  },
  itau: {
    name: 'Itaú',
    // Data;Histórico;Docto.;Crédito;Débito;Saldo
    separator: ';',
    colMap: { date: 0, description: 1, amount: 3, type_col: null },
    typeMap: {},
    defaultType: 'auto',
  },
  bradesco: {
    name: 'Bradesco',
    // Data;Histórico;Docto.;Crédito (R$);Débito (R$);Saldo (R$)
    separator: ';',
    colMap: { date: 0, description: 1, amount: 3, type_col: null },
    defaultType: 'auto',
  },
  santander: {
    name: 'Santander',
    // Data;Descrição;Valor
    separator: ';',
    colMap: { date: 0, description: 1, amount: 2, type_col: null },
    defaultType: 'auto',
  },
  bb: {
    name: 'Banco do Brasil',
    // Data;Dependência Origem;Histórico;Data Balancete;Número do documento;Valor
    separator: ',',
    colMap: { date: 0, description: 2, amount: 5, type_col: null },
    defaultType: 'auto',
  },
  caixa: {
    name: 'Caixa Econômica',
    // Data;Histórico;Valor;Saldo
    separator: ';',
    colMap: { date: 0, description: 1, amount: 2, type_col: null },
    defaultType: 'auto',
  },
  c6: {
    name: 'C6 Bank',
    // Data;Descrição;Valor
    separator: ';',
    colMap: { date: 0, description: 1, amount: 2, type_col: null },
    defaultType: 'auto',
  },
  sicoob: {
    name: 'Sicoob / Sicredi',
    // Data;Histórico;Valor;Saldo
    separator: ';',
    colMap: { date: 0, description: 1, amount: 2, type_col: null },
    defaultType: 'auto',
  },
  inter: {
    name: 'Banco Inter',
    // Data;Tipo Lançamento;Histórico;Valor
    separator: ';',
    colMap: { date: 0, description: 2, amount: 3, type_col: 1 },
    typeMap: { 'crédito': 'income', 'credito': 'income', 'débito': 'expense', 'debito': 'expense', 'entrada': 'income', 'saída': 'expense', 'saida': 'expense' },
    defaultType: 'auto',
  },
  mobills: {
    name: 'Mobills',
    // Data;Categoria;Nome;Valor;Tipo;Status
    separator: ';',
    colMap: { date: 0, description: 2, amount: 3, type_col: 4 },
    typeMap: { 'despesa': 'expense', 'receita': 'income', 'transferencia': 'expense', 'transferência': 'expense' },
    defaultType: 'auto',
  },
  organizze: {
    name: 'Organizze',
    // Data,Descrição,Categoria,Valor,Tipo
    separator: ',',
    colMap: { date: 0, description: 1, amount: 3, type_col: 4 },
    typeMap: { 'receita': 'income', 'despesa': 'expense', '-1': 'expense', '1': 'income' },
    defaultType: 'auto',
  },
  guiabolso: {
    name: 'Guiabolso / Pluggy',
    // date;description;amount;category
    separator: ';',
    colMap: { date: 0, description: 1, amount: 2, type_col: null },
    defaultType: 'auto',
  },
}

function parseDate(str: string): string | null {
  const mBR = str.trim().match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
  const mISO = str.trim().match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/)
  if (mBR) return `${mBR[3]}-${mBR[2]}-${mBR[1]}`
  if (mISO) return str.trim().replace(/\//g, '-')
  return null
}

function splitLine(line: string, separator: string | RegExp): string[] {
  return line.split(separator).map(c => c.replace(/^"|"$/g, '').trim())
}

function autoDetectBank(firstLine: string, text: string): string | null {
  const lower = firstLine.toLowerCase()
  if (lower.includes('nubank') || (lower.includes('date') && lower.includes('category') && lower.includes('title'))) return 'nubank'
  if (lower.includes('itaú') || lower.includes('itau') || lower.includes('docto')) {
    if (lower.includes('crédito') && lower.includes('débito')) return 'itau'
  }
  if (lower.includes('bradesco') || (lower.includes('crédito (r$)') && lower.includes('débito (r$)'))) return 'bradesco'
  if (lower.includes('santander')) return 'santander'
  if (lower.includes('banco do brasil') || lower.includes('dependência origem') || lower.includes('dependencia origem')) return 'bb'
  if (lower.includes('caixa econômica') || lower.includes('caixa economica')) return 'caixa'
  if (lower.includes('c6 bank') || lower.includes('c6bank')) return 'c6'
  if (lower.includes('sicoob') || lower.includes('sicredi')) return 'sicoob'
  if (lower.includes('mobills')) return 'mobills'
  if (lower.includes('organizze')) return 'organizze'
  if (text.toLowerCase().includes('banco inter') || lower.includes('tipo lançamento')) return 'inter'
  return null
}

function autoDetectColumns(headers: string[]): ColumnMap {
  const lh = headers.map(h => h.toLowerCase())
  const dateIdx = lh.findIndex(h => /data|date|dt/.test(h))
  const descIdx = lh.findIndex(h => /descri|memo|hist|lançamento|lancamento|detail|nome|title/.test(h))
  const amtIdx = lh.findIndex(h => /valor|amount|value|vl|credit|debit/.test(h))
  return {
    date: dateIdx >= 0 ? dateIdx : 0,
    description: descIdx >= 0 ? descIdx : 1,
    amount: amtIdx >= 0 ? amtIdx : 2,
    type_col: null,
  }
}

function parseRowsWithProfile(lines: string[], map: ColumnMap, defaultType: 'expense' | 'income' | 'auto', separator: string | RegExp, typeMap?: Record<string, 'income' | 'expense'>): ParsedRow[] {
  const rows: ParsedRow[] = []
  for (const line of lines) {
    const cols = splitLine(line, separator)
    if (cols.length < 2) continue
    const dateRaw = cols[map.date] ?? ''
    const isoDate = parseDate(dateRaw)
    if (!isoDate) continue
    const amountRaw = (cols[map.amount] ?? '').replace(/\s/g, '')
    const amount = Math.abs(parseFloat(amountRaw.replace(/\./g, '').replace(',', '.')))
    if (isNaN(amount) || amount === 0) continue
    const isNegative = amountRaw.startsWith('-')
    const desc = cols[map.description] ?? ''
    let type: 'income' | 'expense'
    if (map.type_col !== null && typeMap) {
      const typeRaw = (cols[map.type_col] ?? '').toLowerCase().trim()
      type = typeMap[typeRaw] ?? (defaultType === 'auto' ? (isNegative ? 'expense' : 'income') : defaultType)
    } else if (defaultType === 'auto') {
      type = isNegative ? 'expense' : 'income'
    } else {
      type = defaultType
    }
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
  const [formatKey, setFormatKey] = useState<string>('auto')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer
      // Try UTF-8 first; fall back to ISO-8859-1 if replacement chars appear (Itaú, Bradesco, BB)
      const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
      const text = utf8.includes('�') ? new TextDecoder('iso-8859-1').decode(buffer) : utf8
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length < 2) { setError('Arquivo muito curto ou sem dados.'); return }

      // Auto-detect bank format from file content when in auto mode
      let activeFormatKey = formatKey
      if (formatKey === 'auto') {
        const detected = autoDetectBank(lines[0], text.slice(0, 500))
        if (detected) { activeFormatKey = detected; setFormatKey(detected) }
      }

      const profile = FORMAT_PROFILES[activeFormatKey] ?? FORMAT_PROFILES.auto
      const hdrs = splitLine(lines[0], profile.separator)
      setHeaders(hdrs)
      setRawLines(lines.slice(1))
      if (activeFormatKey === 'auto') {
        setColMap(autoDetectColumns(hdrs))
        setDefaultType('auto')
        setStep('map')
      } else {
        // Known format: use profile directly, skip manual mapping
        setColMap(profile.colMap)
        setDefaultType(profile.defaultType)
        const parsed = parseRowsWithProfile(lines.slice(1), profile.colMap, profile.defaultType, profile.separator, profile.typeMap)
        if (parsed.length === 0) { setError('Nenhuma linha válida encontrada. Verifique se o formato está correto.'); return }
        setRows(parsed)
        setStep('preview')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function applyMap() {
    const profile = FORMAT_PROFILES[formatKey] ?? FORMAT_PROFILES.auto
    const parsed = parseRowsWithProfile(rawLines, colMap, defaultType, profile.separator, profile.typeMap)
    if (parsed.length === 0) { setError('Nenhuma linha válida encontrada com este mapeamento.'); return }
    setRows(parsed)
    setError('')
    setStep('preview')
  }

  async function handleImport() {
    if (!accountId) { setError('Selecione uma conta'); return }
    setLoading(true)
    const supabase = createClient()

    // Detect duplicates: compare against existing transactions in the same date range
    const dates = rows.map(r => r.date)
    const minDate = dates.reduce((a, b) => a < b ? a : b)
    const maxDate = dates.reduce((a, b) => a > b ? a : b)
    const { data: existing } = await supabase
      .from('transactions')
      .select('date, description, amount, type')
      .eq('account_id', accountId)
      .gte('date', minDate)
      .lte('date', maxDate)
      .is('deleted_at', null)
    const existingKeys = new Set(
      (existing ?? []).map((t: any) => `${t.date}|${(t.description ?? '').toLowerCase()}|${t.amount}|${t.type}`)
    )
    const newRows = rows.filter(r =>
      !existingKeys.has(`${r.date}|${r.description.toLowerCase()}|${r.amount}|${r.type}`)
    )
    const dupes = rows.length - newRows.length

    if (newRows.length === 0) {
      setError(`Todas as ${rows.length} transações já existem nesta conta (nenhuma importada).`)
      setLoading(false)
      return
    }

    const payload = newRows.map(r => ({
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
    if (dupes > 0) setRows(newRows)
    setStep('done')
    setLoading(false)
    startTransition(() => { router.refresh() })
  }

  function handleClose() {
    setOpen(false)
    setStep('upload')
    setRows([])
    setRawLines([])
    setHeaders([])
    setError('')
    setFormatKey('auto')
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Formato do arquivo</label>
              <select
                value={formatKey}
                onChange={e => setFormatKey(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(FORMAT_PROFILES).map(([key, p]) => (
                  <option key={key} value={key}>{p.name}</option>
                ))}
              </select>
            </div>
            {formatKey === 'auto' ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                Detecção automática — o banco será identificado pelo cabeçalho do arquivo. Se não detectar, você ajusta o mapeamento manualmente.
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                Formato <strong>{FORMAT_PROFILES[formatKey]?.name}</strong> — mapeamento aplicado automaticamente.
              </div>
            )}
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
                Amostra: {splitLine(rawLines[0], /[;,]/).map((v, i) => <span key={i} className="mr-2">[{i}] {v}</span>)}
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
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">{rows.length} transações — prévia:</p>
              <select value={accountId} onChange={e => setAccountId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
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
              <button type="button" onClick={() => setStep(formatKey === 'auto' ? 'map' : 'upload')} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Voltar</button>
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
