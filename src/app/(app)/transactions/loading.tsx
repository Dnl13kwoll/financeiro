import { SkeletonTable, SkeletonSummaryCards } from '@/components/ui/skeleton'

export default function TransactionsLoading() {
  return (
    <div className="flex flex-col flex-1">
      <div className="h-16 bg-white border-b border-gray-100" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="h-10 bg-gray-100 rounded-xl animate-pulse w-full" />
        <SkeletonSummaryCards count={3} />
        <SkeletonTable rows={8} />
      </div>
    </div>
  )
}
