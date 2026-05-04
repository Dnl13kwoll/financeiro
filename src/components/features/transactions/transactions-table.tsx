'use client'
import { useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Paperclip, LayoutList, AlignJustify } from 'lucide-react'
import { TransactionActions } from './transaction-actions'
import { BulkActionsBar } from './bulk-actions'
import { ReconcileToggle } from './reconcile-toggle'
import Link from 'next/link'
import type { Transaction } from '@/types/database'

type TxType = 'income' | 'expense' | 'transfer'
const typeConfig: Record<TxType, { label: string; color: string; icon: React.ReactNode }> = {
  income: { label: 'Entrada', color: 'text-green-600', icon: <ArrowUpCircle className="w-4 h-4 text-green-500" /> },
  expense: { label: 'Saída', color: 'text-red-600', icon: <ArrowDownCircle className="w-4 h-4 text-red-500" /> },
  transfer: { label: 'Transferência', color: 'text-blue-600', icon: <ArrowLeftRight className="w-4 h-4 text-blue-500" /> },
}

type TxRow = {
  id: string
  type: TxType
  amount: number
  description?: string | null
  category_id?: string | null
  account_id: string
  date: string
  is_private: boolean
  reconciled?: boolean
  tags?: string[]
  comment?: string | null
  receipt_url?: string | null
  split_id?: string | null
  categories?: { name?: string; color?: string | null } | null
  accounts?: { name?: string; color?: string | null } | null
}

export function TransactionsTable({
  transactions,
  accounts,
  categories,
  coupleId,
  userId,
}: {
  transactions: TxRow[]
  accounts: { id: string; name: string; color?: string | null }[]
  categories: { id: string; name: string; type: 'income' | 'expense'; color?: string | null }[]
  coupleId: string | null
  userId: string
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [compact, setCompact] = useState(false)

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleAll() {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(transactions.map(t => t.id))
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50">
          <span className="text-xs text-gray-400">{transactions.length} transações</span>
          <button
            onClick={() => setCompact(v => !v)}
            title={compact ? 'Modo expandido' : 'Modo compacto'}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            {compact ? <AlignJustify className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left text-xs">
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === transactions.length && transactions.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3 hidden md:table-cell">Categoria</th>
              <th className="px-4 py-3 hidden md:table-cell">Conta</th>
              <th className="px-4 py-3 hidden sm:table-cell">Data</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 hidden sm:table-cell" title="Conciliado"></th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => {
              const config = typeConfig[t.type as TxType]
              const isSelected = selectedIds.includes(t.id)
              return (
                <tr
                  key={t.id}
                  className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-primary-50' : ''}`}
                >
                  <td className={`px-3 ${compact ? 'py-1' : 'py-3'}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(t.id)}
                      className="rounded"
                    />
                  </td>
                  <td className={`px-4 ${compact ? 'py-1' : 'py-3'}`}>
                    <div className="flex items-center gap-1.5">
                      {config.icon}
                      {!compact && <span className="text-xs text-gray-500 hidden sm:inline">{config.label}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    <div className="flex flex-col gap-0.5">
                      <span>
                        {t.description ?? '—'}
                        {t.is_private && <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">privado</span>}
                        {t.split_id && <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">divisão</span>}
                      </span>
                      {/* categoria + conta visíveis apenas no mobile */}
                      <div className="flex items-center gap-2 md:hidden">
                        {t.categories?.name && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.categories.color ?? '#d1d5db' }} />
                            {t.categories.name}
                          </span>
                        )}
                        {t.accounts?.name && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                            {t.accounts.name}
                          </span>
                        )}
                      </div>
                      {t.comment && <span className="text-xs text-gray-400 italic">💬 {t.comment}</span>}
                      {t.receipt_url && (
                        <a href={t.receipt_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                          <Paperclip className="w-3 h-3" /> comprovante
                        </a>
                      )}
                      {(t.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(t.tags as string[]).map((tag) => (
                            <Link key={tag} href={`/transactions?tag=${encodeURIComponent(tag)}`} className="text-xs bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-full hover:bg-primary-100 transition-colors">{tag}</Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      {t.categories?.color && (
                        <span className="w-2 h-2 rounded-full shrink-0 inline-block" style={{ backgroundColor: t.categories.color }} />
                      )}
                      {t.categories?.name ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      {t.accounts?.color && (
                        <span className="w-2 h-2 rounded-full shrink-0 inline-block" style={{ backgroundColor: t.accounts.color }} />
                      )}
                      {t.accounts?.name ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{formatDate(t.date)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${config.color}`}>
                    {t.type === 'expense' ? '-' : ''}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <ReconcileToggle id={t.id} reconciled={t.reconciled ?? false} />
                  </td>
                  <td className="px-4 py-3">
                    <TransactionActions
                      transaction={{ id: t.id, type: t.type, amount: t.amount, description: t.description, category_id: t.category_id, account_id: t.account_id, date: t.date, is_private: t.is_private, tags: t.tags ?? [], comment: t.comment, split_id: t.split_id }}
                      accounts={accounts}
                      categories={categories}
                      coupleId={coupleId ?? undefined}
                      userId={userId}
                    />
                  </td>
                </tr>
              )
            })}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-gray-400">
                  {coupleId ? 'Nenhuma transação encontrada.' : 'Crie um casal em Configurações para começar.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <BulkActionsBar
        selectedIds={selectedIds}
        categories={categories}
        onClearSelection={() => setSelectedIds([])}
      />
    </>
  )
}
