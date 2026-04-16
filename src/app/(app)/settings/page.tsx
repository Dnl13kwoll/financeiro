export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { CreateCoupleButton, InvitePartnerButton } from '@/components/features/settings/couple-actions'
import { LeaveCoupleButton } from '@/components/features/settings/leave-couple'
import { CurrencySelector } from '@/components/features/settings/currency-selector'
import { PushSubscribeButton } from '@/components/features/notifications/push-subscribe'
import { BackupButton } from '@/components/features/settings/backup-button'
import { BackupImport } from '@/components/features/settings/backup-import'
import { DangerZone } from '@/components/features/settings/danger-zone'
import { DailyLimitSetting } from '@/components/features/settings/daily-limit-setting'
import { EditProfile } from '@/components/features/settings/edit-profile'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id, role, couples(currency, daily_limit)')
    .eq('user_id', user!.id)
    .single()

  const memberData = memberRes.data as any
  const coupleId: string | null = memberData?.couple_id ?? null
  const role: string = memberData?.role ?? ''
  const currency: string = memberData?.couples?.currency ?? 'BRL'
  const dailyLimit: number | null = memberData?.couples?.daily_limit ?? null

  const membersRes = coupleId
    ? await supabase
        .from('couple_members')
        .select('role, profiles(name, email)')
        .eq('couple_id', coupleId)
    : null

  const invitationsRes = coupleId
    ? await supabase
        .from('invitations')
        .select('email, status, expires_at')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
    : null

  const members: any[] = membersRes?.data ?? []
  const invitations: any[] = invitationsRes?.data ?? []

  return (
    <div className="flex flex-col flex-1">
      <Header title="Configurações" />

      <div className="p-4 md:p-6 max-w-2xl space-y-6">
        {/* Perfil */}
        <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Meu Perfil</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">Nome:</span>
              <EditProfile currentName={user?.user_metadata?.full_name ?? ''} />
            </div>
            <p><span className="font-medium text-gray-900">Email:</span>{' '}{user?.email}</p>
          </div>
        </section>

        {/* Casal */}
        {coupleId ? (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Casal</h3>
              <div className="flex gap-2">
                {role === 'owner' && <InvitePartnerButton coupleId={coupleId} />}
                <LeaveCoupleButton userId={user!.id} coupleId={coupleId} />
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-gray-500">Moeda:</span>
              {role === 'owner'
                ? <CurrencySelector coupleId={coupleId} current={currency} />
                : <span className="text-sm font-medium text-gray-900">{currency}</span>
              }
            </div>
            {coupleId && role === 'owner' && (
              <DailyLimitSetting coupleId={coupleId} currentLimit={dailyLimit} />
            )}
            <div className="space-y-2">
              {members.map((m, i) => {
                const profile = m.profiles as { name?: string; email?: string } | null
                return (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{profile?.name ?? profile?.email ?? '—'}</span>
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
            <h3 className="font-semibold text-gray-900 mb-3">Casal</h3>
            <p className="text-sm text-gray-500 mb-4">
              Você não está vinculado a nenhum casal ainda. Crie um para começar a usar o app.
            </p>
            <CreateCoupleButton userId={user!.id} />
          </section>
        )}

        {/* Convites */}
        {coupleId && invitations.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Convites enviados</h3>
            <div className="space-y-2">
              {invitations.map((inv, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{inv.email}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    inv.status === 'accepted' ? 'bg-green-100 text-green-700'
                    : inv.status === 'expired' ? 'bg-gray-100 text-gray-500'
                    : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inv.status === 'accepted' ? 'Aceito' : inv.status === 'expired' ? 'Expirado' : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Notificações */}
        <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Notificações</h3>
          <p className="text-sm text-gray-500 mb-4">
            Receba avisos de vencimentos no celular mesmo com o app fechado.
          </p>
          <PushSubscribeButton />
        </section>

        {/* Backup */}
        <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Backup de dados</h3>
          <p className="text-sm text-gray-500 mb-4">
            Exporte todos os seus dados em JSON para backup ou migração.
          </p>
          <BackupButton />
        </section>

        {/* Importar backup */}
        <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Importar backup</h3>
          <p className="text-sm text-gray-500 mb-4">
            Restaure dados a partir de um arquivo de backup exportado anteriormente.
          </p>
          <BackupImport />
        </section>

        {/* Danger Zone — only for owners */}
        {coupleId && role === 'owner' && (
          <DangerZone coupleId={coupleId} />
        )}
      </div>
    </div>
  )
}
