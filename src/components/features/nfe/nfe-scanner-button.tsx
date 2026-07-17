'use client'
import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { QrCode, Camera, Link2, Loader2, ShoppingCart, CheckCircle2, AlertCircle } from 'lucide-react'

type Account = { id: string; name: string; color?: string | null }
type Category = { id: string; name: string; type: 'income' | 'expense'; color?: string | null }

interface NFeProduct {
  name: string
  qty: number
  unit_price: number
  total: number
}

interface NFeData {
  establishment: string
  cnpj: string
  date: string
  total: number
  products: NFeProduct[]
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function NfeScannerButton({
  coupleId,
  userId,
  accounts,
  categories,
}: {
  coupleId: string
  userId: string
  accounts: Account[]
  categories: Category[]
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'url' | 'camera'>('url')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [nfe, setNfe] = useState<NFeData | null>(null)
  const [error, setError] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [categoryId, setCategoryId] = useState('')
  const [savePrices, setSavePrices] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

  const expenseCategories = categories.filter(c => c.type === 'expense')

  async function handleFetch(nfeUrl: string) {
    setLoading(true)
    setError('')
    setNfe(null)
    try {
      const res = await fetch('/api/nfe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: nfeUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao processar nota fiscal')
        return
      }
      setNfe(data)
    } catch {
      setError('Erro de conexão. Verifique sua internet.')
    } finally {
      setLoading(false)
    }
  }

  async function handleImageCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')

    try {
      // Use BarcodeDetector API (Chrome/Android)
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        const bitmap = await createImageBitmap(file)
        const barcodes = await detector.detect(bitmap)
        if (barcodes.length > 0) {
          const decoded = barcodes[0].rawValue as string
          setUrl(decoded)
          setTab('url')
          await handleFetch(decoded)
          return
        }
      }
      setError('QR code não detectado na imagem. Cole a URL manualmente.')
      setTab('url')
    } catch {
      setError('Não foi possível ler o QR code. Cole a URL manualmente.')
      setTab('url')
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSave() {
    if (!nfe) return
    setSaving(true)
    const supabase = createClient()

    try {
      // Save main transaction
      const { error: txErr } = await supabase.from('transactions').insert({
        type: 'expense',
        amount: nfe.total,
        description: nfe.establishment || 'Compra de mercado',
        category_id: categoryId || null,
        account_id: accountId,
        date: nfe.date,
        competence_date: nfe.date,
        user_id: userId,
        couple_id: coupleId,
        comment: nfe.cnpj ? `CNPJ: ${nfe.cnpj}` : null,
        tags: ['nfe'],
      })

      if (txErr) {
        showToast('Erro ao salvar transação: ' + txErr.message, 'error')
        return
      }

      // Save product prices to price-history
      if (savePrices && nfe.products.length > 0) {
        const priceRows = nfe.products.map(p => ({
          couple_id: coupleId,
          user_id: userId,
          product_name: p.name,
          price: p.unit_price,
          store: nfe.establishment || null,
          recorded_at: nfe.date,
        }))
        // Best-effort — ignore errors
        await supabase.from('price_history').insert(priceRows).then(() => {})
      }

      showToast(`Transação de ${fmt(nfe.total)} salva!${savePrices && nfe.products.length > 0 ? ` + ${nfe.products.length} preços registrados.` : ''}`)
      setOpen(false)
      reset()
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setUrl('')
    setNfe(null)
    setError('')
    setTab('url')
    setSavePrices(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
        title="Escanear cupom fiscal (NFe)"
      >
        <QrCode className="w-4 h-4" />
        <span className="hidden sm:inline">NFe</span>
      </button>

      <Modal open={open} onClose={() => { setOpen(false); reset() }} title="Escanear Cupom Fiscal">
        <div className="space-y-4">

          {/* Result view */}
          {nfe ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Nota fiscal lida com sucesso
                </div>
                <p className="text-sm text-green-800 font-medium">{nfe.establishment || '—'}</p>
                {nfe.cnpj && <p className="text-xs text-green-600 mt-0.5">CNPJ: {nfe.cnpj}</p>}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-green-600">
                    {new Date(nfe.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-lg font-bold text-green-800">{fmt(nfe.total)}</p>
                </div>
              </div>

              {/* Products */}
              {nfe.products.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <ShoppingCart className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {nfe.products.length} produto{nfe.products.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                    {nfe.products.map((p, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2">
                        <div>
                          <p className="text-xs font-medium text-gray-800 leading-tight">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.qty}× {fmt(p.unit_price)}</p>
                        </div>
                        <p className="text-xs font-semibold text-gray-700 shrink-0 ml-4">{fmt(p.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {nfe.products.length === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  Não foi possível extrair os produtos desta nota. Apenas o total será salvo.
                </p>
              )}

              {/* Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conta</label>
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sem categoria</option>
                  {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Save prices toggle */}
              {nfe.products.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={savePrices}
                    onChange={e => setSavePrices(e.target.checked)}
                    className="rounded"
                  />
                  Salvar preços dos produtos no Histórico de Preços
                </label>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={reset}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !accountId}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? 'Salvando...' : 'Salvar transação'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                {([
                  { key: 'url', label: 'Colar URL', icon: Link2 },
                  { key: 'camera', label: 'Câmera', icon: Camera },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 transition-colors border-l border-gray-200 first:border-l-0 ${
                      tab === key ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* URL tab */}
              {tab === 'url' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Escaneie o QR code do cupom fiscal com a câmera do celular. O celular abrirá uma página da SEFAZ — copie a URL e cole abaixo.
                  </p>
                  <textarea
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://www.nfce.fazenda.sp.gov.br/..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono resize-none"
                  />
                  <button
                    type="button"
                    disabled={!url.trim() || loading}
                    onClick={() => handleFetch(url.trim())}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Buscando na SEFAZ...</>
                      : <><QrCode className="w-4 h-4" /> Buscar nota fiscal</>
                    }
                  </button>
                </div>
              )}

              {/* Camera tab */}
              {tab === 'camera' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Tire uma foto do QR code do cupom. Funciona melhor no Chrome para Android.
                    Se não funcionar, use a aba &ldquo;Colar URL&rdquo;.
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageCapture}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
                  >
                    {loading
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> Lendo QR code...</>
                      : <><Camera className="w-5 h-5" /> Fotografar QR code</>
                    }
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
