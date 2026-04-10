import { createClient } from '@/lib/supabase/server'

export async function Header({ title }: { title: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {user?.user_metadata?.full_name ?? user?.email}
          </p>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        {user?.user_metadata?.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.user_metadata.avatar_url}
            alt="avatar"
            className="w-8 h-8 rounded-full"
          />
        )}
      </div>
    </header>
  )
}
