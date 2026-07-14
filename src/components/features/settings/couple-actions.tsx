'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Plus, UserPlus } from 'lucide-react'

export function CreateCoupleButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/couple', { method: 'POST' })
    let json: any = {}
    try { json = await res.json() } catch {}

    if (!res.ok) {
      setError(json.error ?? `Erro ao criar casal (${res.status})`)
      setLoading(false)
      return
    }

    window.location.href = '/settings'
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleCreate}
        disabled={loading}
        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
        {loading ? 'Criando...' : 'Criar Casal'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

export function InvitePartnerButton({ coupleId }: { coupleId: string }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, coupleId }),
    })
    let json: any = {}
    try { json = await res.json() } catch {}
    if (!res.ok) {
      setError(json.error ?? `Erro ao enviar convite (${res.status})`)
    } else {
      setSuccess(true)
      setInviteUrl(json.inviteUrl ?? '')
      setEmail('')
    }
    setLoading(false)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSuccess(false); setInviteUrl(''); setCopied(false); setError('') }}
        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        Convidar Parceiro
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Convidar Parceiro">
        {success ? (
          <div className="py-2 space-y-4">
            <p className="text-green-600 font-medium text-center">Convite criado!</p>
            {inviteUrl && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {email ? 'Email enviado. Compartilhe também o link abaixo caso não chegue:' : 'Compartilhe este link com seu parceiro:'}
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={inviteUrl}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 bg-gray-50 focus:outline-none"
                    onClick={e => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 whitespace-nowrap"
                  >
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}
            <button onClick={() => setOpen(false)} className="w-full text-sm text-gray-500 hover:text-gray-700">
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email do parceiro</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="parceiro@email.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Convite'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
