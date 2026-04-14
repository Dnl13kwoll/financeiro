import { createClient } from '@/lib/supabase/server'
import { ThemeSwitcher } from './theme-switcher'
import { GlobalSearch } from './global-search'

export async function Header({ title }: { title: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-4 md:px-6 flex items-center justify-between shrink-0">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="flex items-center gap-2 md:gap-3">
        <GlobalSearch />
        <ThemeSwitcher />
        <div className="text-right hidden sm:block">
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
            className="w-8 h-8 rounded-full shrink-0"
          />
        )}
      </div>
    </header>
  )
}
