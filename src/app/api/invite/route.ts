import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const { email, coupleId } = await req.json()

    if (!coupleId) {
      return NextResponse.json({ error: 'coupleId é obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('couple_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('couple_id', coupleId)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const inviteEmail = email || `link-only+${token}@invite.local`

    const { error: dbError } = await supabase.from('invitations').upsert({
      couple_id: coupleId,
      email: inviteEmail,
      token,
      expires_at: expiresAt,
      status: 'pending',
    }, { onConflict: 'couple_id,email' })

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://financeiro.salusmetrics.com.br'
    const inviteUrl = `${appUrl}/invite/${token}`
    const senderName = user.user_metadata?.full_name ?? 'Alguém'

    if (email && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Financeiro Casal <noreply@salusmetrics.com.br>',
        to: email,
        subject: `${senderName} te convidou para o Financeiro Casal`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <h2 style="color: #111827; margin-bottom: 8px;">Convite para o Financeiro Casal</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">
              <strong style="color: #111827;">${senderName}</strong> te convidou para gerenciar as finanças juntos.
            </p>
            <a
              href="${inviteUrl}"
              style="display: inline-block; background: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;"
            >
              Aceitar convite
            </a>
            <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
              Este link expira em 7 dias. Se você não esperava este convite, pode ignorar este email.
            </p>
          </div>
        `,
      })
    }

    return NextResponse.json({ ok: true, inviteUrl })
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? 'Erro interno') }, { status: 500 })
  }
}
