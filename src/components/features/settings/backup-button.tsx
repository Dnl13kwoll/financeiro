'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download } from 'lucide-react'

export function BackupButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const supabase = createClient()

    const [transactions, installments, installmentItems, recurring, recurringRecords, accounts, budgets, goals, goalHistory, categories] = await Promise.all([
      supabase.from('transactions').select('*').is('deleted_at', null),
      supabase.from('installments').select('*'),
      supabase.from('installment_items').select('*'),
      supabase.from('recurring_accounts').select('*').eq('active', true),
      supabase.from('recurring_records').select('*'),
      supabase.from('accounts').select('*').is('deleted_at', null),
      supabase.from('budgets').select('*'),
      supabase.from('goals').select('*'),
      supabase.from('goal_history').select('*'),
      supabase.from('categories').select('*'),
    ])

    const backup = {
      exported_at: new Date().toISOString(),
      version: '1.0',
      data: {
        transactions: transactions.data ?? [],
        installments: installments.data ?? [],
        installment_items: installmentItems.data ?? [],
        recurring_accounts: recurring.data ?? [],
        recurring_records: recurringRecords.data ?? [],
        accounts: accounts.data ?? [],
        budgets: budgets.data ?? [],
        goals: goals.data ?? [],
        goal_history: goalHistory.data ?? [],
        categories: categories.data ?? [],
      },
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financeiro-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setLoading(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 text-sm text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      <Download className="w-4 h-4" />
      {loading ? 'Exportando...' : 'Baixar backup completo (JSON)'}
    </button>
  )
}
