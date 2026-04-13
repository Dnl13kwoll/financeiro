'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Plus, UserPlus } from 'lucide-react'

export function CreateCoupleButton({ userId }: { userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data: couple, error: coupleErr } = await (supabase.from('couples') as any)
      .insert({ currency: 'BRL' })
      .select()
      .single()

    if (coupleErr) {
      setError('Erro ao criar casal: ' + coupleErr.message)
      setLoading(false)
      return
    }

    const memberPayload: any = {
      user_id: userId,
      couple_id: couple.id,
      role: 'owner',
    }
    const { error: memberErr } = await supabase.from('couple_members').insert(memberPayload)

    if (memberErr) {
      setError('Erro ao criar membro: ' + memberErr.message)
      setLoading(false)
      return
    }

    setLoading(false)
    window.location.reload()
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
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const invitePayload: any = { couple_id: coupleId, email }
    const { error: err } = await supabase.from('invitations').insert(invitePayload)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      setEmail('')
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSuccess(false); setError('') }}
        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        Convidar Parceiro
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Convidar Parceiro">
        {success ? (
          <div className="text-center py-4">
            <p className="text-green-600 font-medium">Convite enviado!</p>
            <p className="text-sm text-gray-500 mt-1">O convite foi registrado com sucesso.</p>
            <button onClick={() => setOpen(false)} className="mt-4 text-sm text-primary-600 hover:underline">
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
