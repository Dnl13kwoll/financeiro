import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from '@/components/features/onboarding/onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already in a couple, redirect to dashboard
  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .maybeSingle()

  if ((memberRes.data as any)?.couple_id) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      <OnboardingWizard userId={user!.id} />
    </div>
  )
}
