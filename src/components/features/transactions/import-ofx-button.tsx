'use client'
import { useState, useRef, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { FileInput } from 'lucide-react'

type ParsedTx = {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
}

function parseOFX(text: string): ParsedTx[] {
  const results: ParsedTx[] = []
  // Match STMTTRN blocks (both SGML and XML variants)
  const blocks = text.match(/<STMTTRN[\s\S]*?<\/STMTTRN>|<STMTTRN>([\s\S]*?)(?=<STMTTRN|$)/gi) ?? []
  for (const block of blocks) {
    const getField = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([^<\r\n]+)`, 'i'))
      return m ? m[1].trim() : null
    }
    const rawDate = getField('DTPOSTED') ?? getField('DTUSER') ?? ''
    const rawAmt = getField('TRNAMT') ?? '0'
    const name = getField('NAME') ?? getField('MEMO') ?? ''
    if (!rawDate || !name) continue

    // OFX date: YYYYMMDDHHMMSS or YYYYMMDD
    const y = rawDate.slice(0, 4), m = rawDate.slice(4, 6), d = rawDate.slice(6, 8)
    const date = `${y}-${m}-${d}`
    const amount = Math.abs(parseFloat(rawAmt.replace(',', '.')))
    const type: 'income' | 'expense' = parseFloat(rawAmt) >= 0 ? 'income' : 'expense'
    if (!isNaN(amount) && amount > 0) results.push({ date, description: name, amount, type })
  }
  return results
}

function parseQIF(text: string): ParsedTx[] {
  const results: ParsedTx[] = []
  const entries = text.split('^')
  for (const entry of entries) {
    const lines = entry.trim().split(/\r?\n/)
    let date = '', description = '', amount = 0
    for (const line of lines) {
      if (line.startsWith('D')) {
        // QIF date formats: M/D/Y, M-D-Y, D/M/Y
        const raw = line.slice(1).trim()
        const parts = raw.split(/[\/\-\.]/)
        if (parts.length === 3) {
          // Try M/D/Y (US) format
          const [a, b, c] = parts.map(p => p.replace(/'/g, '').padStart(2, '0'))
          const year = c.length === 2 ? `20${c}` : c
          date = `${year}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`
        }
      } else if (line.startsWith('T') || line.startsWith('U')) {
        amount = Math.abs(parseFloat(line.slice(1).replace(/,/g, '').trim()))
      } else if (line.startsWith('P')) {
        description = line.slice(1).trim()
      } else if (line.startsWith('M') && !description) {
        description = line.slice(1).trim()
      }
    }
    if (date && description && amount > 0) {
      const sign = entry.match(/T-|U-/) ? 'expense' : 'income'
      results.push({ date, description, amount, type: sign })
    }
  }
  return results
}

export function ImportOFXButton({
  coupleId,
  userId,
  accounts,
}: {
  coupleId: string
  userId: string
  accounts: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [parsed, setParsed] = useState<ParsedTx[]>([])
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const ext = file.name.split('.').pop()?.toLowerCase()
      const txs = ext === 'qif' ? parseQIF(text) : parseOFX(text)
      setParsed(txs)
      if (txs.length === 0) showToast('Nenhuma transação encontrada no arquivo.', 'error')
    }
    reader.readAsText(file, 'latin1')
  }

  async function handleImport() {
    if (!selectedAccount) { showToast('Selecione uma conta.', 'error'); return }
    setLoading(true)
    const supabase = createClient()
    const rows = parsed.map(t => ({
      couple_id: coupleId,
      user_id: userId,
      account_id: selectedAccount,
      type: t.type,
      amount: t.amount,
      description: t.description,
      date: t.date,
      competence_date: t.date,
      is_private: false,
      tags: [],
    }))
    // Insert in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      await supabase.from('transactions').insert(rows.slice(i, i + 50))
    }
    setLoading(false)
    setOpen(false)
    setParsed([])
    if (fileRef.current) fileRef.current.value = ''
    showToast(`${rows.length} transação(ões) importada(s)!`)
    startTransition(() => { router.refresh() })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
      >
        <FileInput className="w-4 h-4" />
        OFX / QIF
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Importar OFX / QIF">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo (.ofx, .qif)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".ofx,.qif,.OFX,.QIF"
              onChange={handleFile}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          {parsed.length > 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conta de destino</label>
                <select
                  value={selectedAccount}
                  onChange={e => setSelectedAccount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
                  {parsed.length} transação(ões) detectada(s) — pré-visualização
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                  {parsed.slice(0, 20).map((t, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <p className="text-gray-800 truncate max-w-48">{t.description}</p>
                        <p className="text-xs text-gray-400">{t.date}</p>
                      </div>
                      <span className={`font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'expense' ? '-' : '+'}R$ {t.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {parsed.length > 20 && (
                    <div className="px-3 py-2 text-xs text-gray-400 text-center">
                      +{parsed.length - 20} mais...
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Importando...' : `Importar ${parsed.length} transações`}
                </button>
              </div>
            </>
          )}

          {parsed.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              Selecione um arquivo OFX (exportado pelo internet banking) ou QIF para continuar.
            </p>
          )}
        </div>
      </Modal>
    </>
  )
}
