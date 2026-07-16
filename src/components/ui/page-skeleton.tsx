export function PageSkeleton() {
  return (
    <div className="flex flex-col flex-1 animate-pulse">
      <div className="border-b border-gray-100 p-4 md:p-6 flex items-center justify-between">
        <div className="h-6 w-36 bg-gray-200 rounded-lg" />
        <div className="h-8 w-24 bg-gray-100 rounded-lg" />
      </div>
      <div className="p-4 md:p-6 space-y-4 max-w-4xl">
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-gray-100 rounded-xl" />
          <div className="h-20 bg-gray-100 rounded-xl" />
          <div className="h-20 bg-gray-100 rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl w-4/5" />
          <div className="h-12 bg-gray-100 rounded-xl w-3/5" />
        </div>
      </div>
    </div>
  )
}
