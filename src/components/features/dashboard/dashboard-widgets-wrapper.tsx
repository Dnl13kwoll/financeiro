'use client'
import { useDashboardWidgets, DashboardCustomizeButton, type WidgetKey } from './dashboard-customize'

export function DashboardWidgetsWrapper({ children }: { children: React.ReactNode }) {
  // This wrapper just renders children — visibility is handled per-widget
  return <>{children}</>
}

// Thin wrapper: show/hide a named widget based on localStorage
export function Widget({ id, children }: { id: WidgetKey; children: React.ReactNode }) {
  // Widget visibility is driven by the parent DashboardController
  // We just render — the controller decides
  return <>{children}</>
}

// The controller component renders the customize button + all widgets
export function DashboardController({
  slots,
}: {
  slots: Partial<Record<WidgetKey, React.ReactNode>>
}) {
  const { show, toggle, hidden } = useDashboardWidgets()

  return (
    <>
      <div className="flex justify-end mb-2">
        <DashboardCustomizeButton hidden={hidden} toggle={toggle} />
      </div>
      {(Object.entries(slots) as [WidgetKey, React.ReactNode][]).map(([key, node]) =>
        show(key) ? <div key={key}>{node}</div> : null
      )}
    </>
  )
}
