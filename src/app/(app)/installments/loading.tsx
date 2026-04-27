import { Skeleton, SkeletonTable } from '@/components/ui/skeleton'

export default function InstallmentsLoading() {
  return (
    <div className="flex flex-col flex-1">
      <div className="h-16 bg-white border-b border-gray-100" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-44" />
        </div>
        <SkeletonTable rows={6} />
        <SkeletonTable rows={4} />
      </div>
    </div>
  )
}
