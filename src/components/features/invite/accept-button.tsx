'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AcceptInviteButton({ token, invitationId, coupleId, email }: {
  token: string
  invitationId: string
  coupleId: string
  email: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleAccept() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = `/login?redirect=/invite/${token}`
      return
    }

    const memberPayload: any = {
      user_id: user.id,
      couple_id: coupleId,
      role: 'member',
    }
    const { error: memberErr } = await (supabase.from('couple_members') as any).insert(memberPayload)

    if (memberErr) {
      setError('Erro ao entrar no casal: ' + memberErr.message)
      setLoading(false)
      return
    }

    await (supabase.from('invitations') as any)
      .update({ status: 'accepted' })
      .eq('id', invitationId)

    setDone(true)
    setLoading(false)
    setTimeout(() => { window.location.href = '/dashboard' }, 2000)
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <p className="text-green-600 font-semibold text-lg">Convite aceito!</p>
        <p className="text-gray-500 text-sm mt-1">Redirecionando para o dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Aceitando...' : 'Aceitar convite'}
      </button>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  )
}
