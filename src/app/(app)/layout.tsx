import { Sidebar } from '@/components/layout/sidebar'
import { ServiceWorkerRegister } from '@/components/layout/sw-register'
import { PWAInstallBanner } from '@/components/layout/pwa-install-banner'
import { QuickAddFab } from '@/components/layout/quick-add-fab'
import { ToastContainer } from '@/components/ui/toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <ServiceWorkerRegister />
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden pt-14 lg:pt-0">{children}</main>
      <PWAInstallBanner />
      <QuickAddFab />
      <ToastContainer />
    </div>
  )
}
