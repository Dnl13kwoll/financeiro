import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!user) {
    return NextResponse.redirect(new URL('/login', appUrl))
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    const allKeys = Object.keys(process.env)
    const googleKeys = allKeys.filter(k => k.startsWith('GOOGLE'))
    const directCheck = process.env['GOOGLE_CLIENT_ID']
    return NextResponse.json({
      error: 'GOOGLE_CLIENT_ID not configured',
      google_keys_found: googleKeys,
      direct_type: typeof directCheck,
      direct_value: directCheck ? `${directCheck.substring(0, 15)}...` : null,
      total_env_keys: allKeys.length,
      next_public_app_url: process.env.NEXT_PUBLIC_APP_URL ?? null,
      hint: googleKeys.length === 0 ? 'Nenhuma variável GOOGLE_ encontrada no servidor' : `Encontradas: ${googleKeys.join(', ')}`,
    }, { status: 500 })
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${appUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: user.id,
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
