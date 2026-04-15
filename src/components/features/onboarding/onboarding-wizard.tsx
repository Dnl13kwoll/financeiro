'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { CheckCircle2, ChevronRight } from 'lucide-react'

type Step = 'couple' | 'account' | 'done'

export function OnboardingWizard({ userId }: { userId: string }) {
  const [step, setStep] = useState<Step>('couple')
  const [loading, setLoading] = useState(false)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const router = useRouter()

  async function handleCreateCouple(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const supabase = createClient()

    // Create couple
    const { data: couple, error: coupleErr } = await (supabase
      .from('couples') as any)
      .insert({ name: data.get('couple_name') as string, currency: 'BRL' })
      .select('id')
      .single()

    if (coupleErr || !couple) {
      showToast('Erro ao criar casal.', 'error')
      setLoading(false)
      return
    }

    // Join as member
    await (supabase.from('couple_members') as any).insert({ couple_id: couple.id, user_id: userId, role: 'owner' })

    setCoupleId(couple.id)
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

    await (supabase.from('accounts') as any).insert({
      name: data.get('account_name') as string,
      type: data.get('type') as string,
      initial_balance: parseFloat(data.get('initial_balance') as string) || 0,
      couple_id: coupleId,
      user_id: userId,
    })

    setLoading(false)
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tudo pronto!</h2>
        <p className="text-gray-500 mb-8">Seu casal e primeira conta foram criados com sucesso.</p>
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
        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {(['couple', 'account'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                step === s ? 'bg-primary-600 border-primary-600 text-white' :
                i < ['couple', 'account'].indexOf(step) ? 'bg-green-500 border-green-500 text-white' :
                'border-gray-300 text-gray-400'
              }`}>
                {i + 1}
              </div>
              <span className={`text-xs font-medium ${step === s ? 'text-primary-700' : 'text-gray-400'}`}>
                {s === 'couple' ? 'Criar casal' : 'Primeira conta'}
              </span>
              {i < 1 && <div className="flex-1 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {step === 'couple' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Bem-vindo! 👋</h2>
            <p className="text-gray-500 text-sm mb-6">Vamos começar criando o perfil do seu casal.</p>

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
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Criando...' : 'Criar casal'} <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {step === 'account' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Adicione uma conta</h2>
            <p className="text-gray-500 text-sm mb-6">Cadastre sua conta principal para começar a registrar transações.</p>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da conta</label>
                <input
                  name="account_name"
                  required
                  placeholder="Ex: Nubank, Carteira, Bradesco..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  name="type"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="bank">Conta Bancária</option>
                  <option value="cash">Dinheiro</option>
                  <option value="credit_card">Cartão de Crédito</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo atual</label>
                <input
                  name="initial_balance"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                  placeholder="0,00"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Salvando...' : 'Criar conta'} <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setStep('done')}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
              >
                Pular por agora
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
