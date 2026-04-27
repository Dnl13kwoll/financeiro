import { Sidebar } from '@/components/layout/sidebar'
import { ServiceWorkerRegister } from '@/components/layout/sw-register'
import { PWAInstallBanner } from '@/components/layout/pwa-install-banner'
import { QuickAddFab } from '@/components/layout/quick-add-fab'
import { ToastContainer } from '@/components/ui/toast'
import { KeyboardShortcuts } from '@/components/ui/keyboard-shortcuts'
import { ShortcutsHelp } from '@/components/ui/shortcuts-help'
import { OnboardingTour } from '@/components/features/onboarding/onboarding-tour'
import { RealtimeSync } from '@/components/layout/realtime-sync'
import { ConfirmDialogProvider } from '@/components/ui/confirm-dialog'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <ServiceWorkerRegister />
      <KeyboardShortcuts />
      <ShortcutsHelp />
      <RealtimeSync />
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden pt-14 lg:pt-0">{children}</main>
      <PWAInstallBanner />
      <QuickAddFab />
      <ToastContainer />
      <OnboardingTour />
      <ConfirmDialogProvider />
    </div>
  )
}
