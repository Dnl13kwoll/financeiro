import { createClient } from '@/lib/supabase/server'
import { AcceptInviteButton } from '@/components/features/invite/accept-button'
import { notFound } from 'next/navigation'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const supabase = await createClient()

  const { data: invitation } = await supabase.from('invitations')
    .select('id, email, couple_id, status, expires_at, couples(currency)')
    .eq('token', token)
    .single()

  if (!invitation) return notFound()

  const expired = new Date(invitation.expires_at) < new Date()
  const alreadyAccepted = invitation.status === 'accepted'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Convite para Casal</h1>

        {alreadyAccepted ? (
          <p className="text-gray-500">Este convite já foi aceito.</p>
        ) : expired ? (
          <p className="text-red-500">Este convite expirou. Peça um novo convite ao seu parceiro.</p>
        ) : (
          <>
            <p className="text-gray-500 mb-6">
              Você foi convidado para gerenciar as finanças juntos.
              <br />
              <span className="text-sm text-gray-400 mt-1 block">Convite para: {invitation.email}</span>
            </p>
            <AcceptInviteButton
              token={token}
              invitationId={invitation.id}
              coupleId={invitation.couple_id}
              email={invitation.email}
            />
          </>
        )}
      </div>
    </div>
  )
}
