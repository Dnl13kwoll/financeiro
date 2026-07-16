'use client'

export function MonthFilter({ accountId, defaultValue }: { accountId: string; defaultValue: string }) {
  return (
    <input
      type="month"
      defaultValue={defaultValue}
      onChange={(e) => {
        window.location.href = `/accounts/${accountId}?month=${e.target.value}`
      }}
      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
    />
  )
}
