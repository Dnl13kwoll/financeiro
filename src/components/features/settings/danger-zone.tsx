'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { Trash2, AlertTriangle } from 'lucide-react'

export function DangerZone({ coupleId }: { coupleId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const CONFIRM_PHRASE = 'EXCLUIR TUDO'

  async function handleDeleteAll() {
    if (confirmText !== CONFIRM_PHRASE) return
    setLoading(true)

    try {
      const supabase = createClient()

      // Delete all couple data in order (respecting foreign keys)
      const tables = [
        'notifications',
        'goal_contributions',
        'goal_history',
        'goals',
        'wishlist_votes',
        'wishlist_items',
        'networth_snapshots',
        'budgets',
        'monthly_plans',
        'card_invoice_payments',
        'installment_items',
        'installments',
        'recurring_accounts',
        'transaction_templates',
        'transactions',
        'accounts',
        'categories',
        'invitations',
        'couple_members',
        'couples',
      ]

      for (const table of tables) {
        if (table === 'categories') {
          await (supabase.from(table) as any).delete().eq('couple_id', coupleId)
        } else if (table === 'couples') {
          await (supabase.from(table) as any).delete().eq('id', coupleId)
        } else {
          await (supabase.from(table) as any).delete().eq('couple_id', coupleId)
        }
      }

      showToast('Todos os dados foram excluídos.')
      router.push('/settings')
      router.refresh()
    } catch {
      showToast('Erro ao excluir dados. Tente novamente.', 'error')
      setLoading(false)
    }
  }

  return (
    <section className="bg-white rounded-xl border border-red-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h3 className="font-semibold text-red-700">Zona de Perigo</h3>
      </div>

      {!confirmOpen ? (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Exclui permanentemente todos os dados do casal: transações, contas, metas, orçamentos, planejamento e histórico. Esta ação não pode ser desfeita.
          </p>
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir todos os dados
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-medium text-red-800 mb-1">Confirme a exclusão</p>
            <p className="text-sm text-red-700">
              Para confirmar, digite <strong>{CONFIRM_PHRASE}</strong> no campo abaixo:
            </p>
          </div>

          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <div className="flex gap-3">
            <button
              onClick={() => { setConfirmOpen(false); setConfirmText('') }}
              className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={confirmText !== CONFIRM_PHRASE || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {loading ? 'Excluindo...' : 'Confirmar exclusão'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
