import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id, role, couples(currency)')
    .eq('user_id', user!.id)
    .single() as { data: { couple_id: string; role: string; couples: { currency?: string } | null } | null }

  const { data: members } = member
    ? await supabase
        .from('couple_members')
        .select('role, profiles(name, email)')
        .eq('couple_id', member.couple_id)
    : { data: [] as any[] }

  const { data: invitations } = member
    ? await supabase
        .from('invitations')
        .select('email, status, expires_at')
        .eq('couple_id', member.couple_id)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Configurações" />

      <div className="p-6 max-w-2xl space-y-6">
        {/* Perfil */}
        <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Meu Perfil</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium text-gray-900">Nome:</span>{' '}
              {user?.user_metadata?.full_name ?? '—'}
            </p>
            <p>
              <span className="font-medium text-gray-900">Email:</span>{' '}
              {user?.email}
            </p>
          </div>
        </section>

        {/* Casal */}
        {member ? (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Casal</h3>
            <p className="text-sm text-gray-500 mb-3">
              Moeda:{' '}
              <span className="font-medium text-gray-900">
                {(member.couples as { currency?: string } | null)?.currency ?? 'BRL'}
              </span>
            </p>
            <div className="space-y-2">
              {(members ?? []).map((m, i) => {
                const profile = m.profiles as { name?: string; email?: string } | null
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700">
                      {profile?.name ?? profile?.email ?? '—'}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {m.role === 'owner' ? 'Dono' : 'Membro'}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Casal</h3>
            <p className="text-sm text-gray-500">
              Você não está vinculado a nenhum casal ainda.
            </p>
          </section>
        )}

        {/* Convites */}
        {member && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Convites</h3>
            {(invitations ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum convite enviado.</p>
            ) : (
              <div className="space-y-2">
                {(invitations ?? []).map((inv, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{inv.email}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        inv.status === 'accepted'
                          ? 'bg-green-100 text-green-700'
                          : inv.status === 'expired'
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {inv.status === 'accepted'
                        ? 'Aceito'
                        : inv.status === 'expired'
                        ? 'Expirado'
                        : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
