import { Sidebar } from '@/components/layout/sidebar'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { ServiceWorkerRegister } from '@/components/layout/sw-register'
import { PWAInstallBanner } from '@/components/layout/pwa-install-banner'
import { QuickAddFab } from '@/components/layout/quick-add-fab'
import { ToastContainer } from '@/components/ui/toast'
import { KeyboardShortcuts } from '@/components/ui/keyboard-shortcuts'
import { ShortcutsHelp } from '@/components/ui/shortcuts-help'
import { CommandPalette } from '@/components/ui/command-palette'
import { OnboardingTour } from '@/components/features/onboarding/onboarding-tour'
import { RealtimeSync } from '@/components/layout/realtime-sync'
import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog'
import { MonthlyCloseReminder } from '@/components/layout/monthly-close-reminder'
import { BudgetAlertChecker } from '@/components/features/budget/budget-alert-checker'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const memberRes = user
    ? await supabase.from('couple_members').select('couple_id').eq('user_id', user.id).limit(1).maybeSingle()
    : null
  const coupleId: string | null = (memberRes?.data as any)?.couple_id ?? null

  return (
    <div className="flex min-h-screen">
      <ServiceWorkerRegister />
      <KeyboardShortcuts />
      <ShortcutsHelp />
      <CommandPalette />
      <RealtimeSync />
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden pt-14 lg:pt-0 pb-16 lg:pb-0">{children}</main>
      <MobileBottomNav />
      <PWAInstallBanner />
      <QuickAddFab />
      <ToastContainer />
      <OnboardingTour />
      <ConfirmDialogProvider />
      <MonthlyCloseReminder />
      {coupleId && <BudgetAlertChecker coupleId={coupleId} />}
    </div>
  )
}
