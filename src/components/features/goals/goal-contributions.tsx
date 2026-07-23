'use client'
import { useState, useEffect, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'
import { History, Plus } from 'lucide-react'

function CelebrationOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [onDone])

  const emojis = ['🎉', '🥳', '⭐', '🏆', '✨', '🎊', '💪', '🎯']
  const particles = Array.from({ length: 24 }, (_, i) => ({
    emoji: emojis[i % emojis.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.8}s`,
    duration: `${1.5 + Math.random()}s`,
  }))

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute text-2xl animate-bounce"
          style={{
            left: p.left,
            top: '-2rem',
            animationDelay: p.delay,
            animationDuration: p.duration,
            animation: `fall ${p.duration} ${p.delay} forwards`,
          }}
        >
          {p.emoji}
        </span>
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-40px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl border border-green-100 px-8 py-6 text-center pointer-events-auto animate-in zoom-in-90 duration-300">
          <p className="text-4xl mb-2">🏆</p>
          <p className="text-xl font-bold text-green-700">Meta Concluída!</p>
          <p className="text-sm text-gray-500 mt-1">Parabéns pelo objetivo alcançado!</p>
        </div>
      </div>
    </div>
  )
}

type Contribution = {
  id: string
  amount: number
  note: string | null
  contributed_at: string
  profiles?: { full_name?: string }
}

export function GoalContributions({
  goalId,
  coupleId,
  userId,
  currentAmount,
  targetAmount,
  contributions,
}: {
  goalId: string
  coupleId: string
  userId: string
  currentAmount: number
  targetAmount: number
  contributions: Contribution[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const amount = parseFloat(data.get('amount') as string)
    const supabase = createClient()

    const { error: insertErr } = await supabase.from('goal_contributions').insert({
      goal_id: goalId,
      couple_id: coupleId,
      contributed_by: userId,
      amount,
      note: (data.get('note') as string) || null,
      contributed_at: data.get('date') as string,
    })
    if (insertErr) {
      showToast('Erro: ' + insertErr.message, 'error')
      setLoading(false)
      return
    }

    // Atomic server-side increment — avoids read-modify-write race between partners
    const { error: updateErr } = await supabase.rpc('increment_goal_amount', { goal_id: goalId, delta: amount })
    if (updateErr) {
      showToast('Erro ao atualizar meta: ' + updateErr.message, 'error')
      setLoading(false)
      return
    }

    const newAmount = currentAmount + amount
    setLoading(false)
    setOpen(false)
    form.reset()
    if (newAmount >= targetAmount) {
      setCelebrating(true)
    } else {
      showToast('Aporte registrado!')
    }
    startTransition(() => { router.refresh() })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      {celebrating && <CelebrationOverlay onDone={() => setCelebrating(false)} />}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
        title="Histórico de aportes"
      >
        <History className="w-3.5 h-3.5" /> Aportes
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Aportes da Meta">
        <div className="space-y-4">
          <form onSubmit={handleAdd} className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Registrar aporte</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Valor</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data</label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={today}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Observação (opcional)</label>
              <input
                name="note"
                placeholder="Ex: salário, bônus..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> {loading ? 'Salvando...' : 'Registrar'}
            </button>
          </form>

          {contributions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Histórico</p>
              {contributions.map(c => (
                <div key={c.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700 financial-value">+{formatCurrency(c.amount)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(c.contributed_at + 'T12:00:00').toLocaleDateString('pt-BR')}
                      {c.note ? ` · ${c.note}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum aporte registrado ainda.</p>
          )}
        </div>
      </Modal>
    </>
  )
}
