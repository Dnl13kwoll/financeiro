'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, ChevronRight, Users, Wallet, Mail, Copy, Check } from 'lucide-react'

type Step = 'couple' | 'account' | 'invite' | 'done'

const STEPS: Step[] = ['couple', 'account', 'invite']
const STEP_LABELS: Record<Step, string> = {
  couple: 'Criar casal',
  account: 'Primeira conta',
  invite: 'Convidar parceiro(a)',
  done: 'Pronto',
}
const STEP_ICONS: Record<Step, React.ElementType> = {
  couple: Users,
  account: Wallet,
  invite: Mail,
  done: CheckCircle2,
}

export function OnboardingWizard({ userId }: { userId: string }) {
  const [step, setStep] = useState<Step>('couple')
  const [loading, setLoading] = useState(false)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSent, setInviteSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const stepIndex = STEPS.indexOf(step)

  async function handleCreateCouple(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/couple', { method: 'POST' })
    let json: any = {}
    try { json = await res.json() } catch {}
    if (!res.ok) { setError(json.error ?? `Erro ao criar casal (${res.status})`); setLoading(false); return }
    setCoupleId(json.coupleId)
    setLoading(false)
    setStep('account')
  }

  async function handleCreateAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!coupleId) return
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const supabase = createClient()
    await supabase.from('accounts').insert({
      name: data.get('account_name') as string,
      type: data.get('type') as string,
      initial_balance: parseFloat(data.get('initial_balance') as string) || 0,
      couple_id: coupleId,
      user_id: userId,
    })
    setLoading(false)
    setStep('invite')
  }

  async function handleSendInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!coupleId || !inviteEmail) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, coupleId }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao enviar convite'); setLoading(false); return }
      setInviteSent(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopyLink() {
    if (!coupleId) return
    setLoading(true)
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupleId }),
      })
      const json = await res.json()
      if (json.inviteUrl) {
        await navigator.clipboard.writeText(json.inviteUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tudo pronto!</h2>
        <p className="text-gray-500 mb-8 max-w-xs">
          {inviteSent
            ? 'Seu casal foi criado e o convite foi enviado. Assim que seu parceiro(a) aceitar, vocês terão acesso completo às finanças juntos.'
            : 'Seu casal e primeira conta foram criados. Você pode convidar seu parceiro(a) depois em Configurações.'}
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors"
        >
          Ir para o Dashboard <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-400 mt-1">para casais</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => {
            const Icon = STEP_ICONS[s]
            const done = i < stepIndex
            const current = s === step
            return (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    done    ? 'bg-green-500 border-green-500 text-white' :
                    current ? 'bg-primary-600 border-primary-600 text-white' :
                              'border-gray-200 text-gray-300 bg-white'
                  }`}>
                    {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-medium whitespace-nowrap ${current ? 'text-primary-700' : done ? 'text-green-600' : 'text-gray-300'}`}>
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 mb-4 transition-colors ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step cards */}
        {step === 'couple' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Bem-vindo!</h2>
                <p className="text-xs text-gray-400">Vamos criar o perfil do seu casal</p>
              </div>
            </div>
            <form onSubmit={handleCreateCouple} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do casal</label>
                <input
                  name="couple_name"
                  required
                  placeholder="Ex: João e Maria, Nós dois..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {loading ? 'Criando...' : 'Criar casal'} <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {step === 'account' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Adicione uma conta</h2>
                <p className="text-xs text-gray-400">Sua conta principal para registrar transações</p>
              </div>
            </div>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da conta</label>
                <input name="account_name" required placeholder="Ex: Nubank, Carteira, Bradesco..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select name="type" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="bank">Conta Bancária</option>
                  <option value="cash">Dinheiro</option>
                  <option value="credit_card">Cartão de Crédito</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo atual</label>
                <input name="initial_balance" type="number" step="0.01" defaultValue="0" placeholder="0,00"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {loading ? 'Salvando...' : 'Criar conta'} <ChevronRight className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setStep('invite')}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors">
                Pular por agora
              </button>
            </form>
          </div>
        )}

        {step === 'invite' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Convidar parceiro(a)</h2>
                <p className="text-xs text-gray-400">Para gerenciar as finanças juntos</p>
              </div>
            </div>

            {inviteSent ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Convite enviado!</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      Seu parceiro(a) receberá um e-mail com o link para se juntar ao casal.
                    </p>
                  </div>
                </div>
                <button onClick={() => setStep('done')}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors">
                  Ir para o Dashboard <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleSendInvite} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail do parceiro(a)</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button type="submit" disabled={loading || !inviteEmail}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    {loading ? 'Enviando...' : 'Enviar convite por e-mail'}
                  </button>
                </form>

                <div className="relative flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 shrink-0">ou</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <button
                  onClick={handleCopyLink}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {copied
                    ? <><Check className="w-4 h-4 text-green-500" /> Link copiado!</>
                    : <><Copy className="w-4 h-4" /> Copiar link de convite</>
                  }
                </button>

                <button onClick={() => setStep('done')}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors">
                  Pular — convidar depois em Configurações
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
