import { SkeletonCard, SkeletonSummaryCards } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="flex flex-col flex-1">
      <div className="h-16 bg-white border-b border-gray-100" />
      <div className="p-4 md:p-6 space-y-6">
        <SkeletonSummaryCards count={4} />
        <SkeletonCard rows={4} />
        <SkeletonCard rows={3} />
      </div>
    </div>
  )
}
