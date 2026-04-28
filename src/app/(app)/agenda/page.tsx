export const dynamic = 'force-dynamic'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { AgendaClient } from '@/components/features/agenda/agenda-client'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tokenRow } = await (supabase as any)
    .from('google_tokens')
    .select('google_email')
    .eq('user_id', user!.id)
    .maybeSingle()

  const isConnected = !!tokenRow
  const googleEmail: string | null = (tokenRow as any)?.google_email ?? null

  return (
    <div className="flex flex-col flex-1">
      <Header title="Agenda" />
      <AgendaClient isConnected={isConnected} googleEmail={googleEmail} />
    </div>
  )
}
