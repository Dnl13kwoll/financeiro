import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Transações' }
import { NewTransactionButton } from '@/components/features/transactions/new-transaction-button'
import { TransactionsTable } from '@/components/features/transactions/transactions-table'
import { TransactionFilters } from '@/components/features/transactions/transaction-filters'
import { CategoryManager } from '@/components/features/categories/category-manager'
import { CategoryRules } from '@/components/features/categories/category-rules'
import { ImportCSVButton } from '@/components/features/transactions/import-csv-button'
import { ImportOFXButton } from '@/components/features/transactions/import-ofx-button'
import { ExportButton } from '@/components/features/transactions/export-button'
import { TransactionSummary } from '@/components/features/transactions/transaction-summary'
import { CategoryTotals } from '@/components/features/transactions/category-totals'
import { Suspense } from 'react'
import { SortHeader } from '@/components/features/transactions/sort-header'
import Link from 'next/link'
// SortHeader/Link kept for pagination below

const PAGE_SIZE = 50

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date_from?: string; date_to?: string; type?: string; category_id?: string; account_id?: string; q?: string; tag?: string; sort?: string; dir?: string; private?: string; reconciled?: string; amount_min?: string; amount_max?: string; page?: string; no_category?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .single()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const now = new Date()
  let monthStart: string
  let monthEnd: string
  if (params.date_from && params.date_to) {
    monthStart = params.date_from
    monthEnd = params.date_to
  } else {
    const monthParam = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const [year, month] = monthParam.split('-').map(Number)
    monthStart = new Date(year, month - 1, 1).toISOString().slice(0, 10)
    monthEnd = new Date(year, month, 0).toISOString().slice(0, 10)
  }

  const sortCol = params.sort && ['date', 'amount', 'description'].includes(params.sort) ? params.sort : 'date'
  const sortAsc = params.dir === 'asc'
  const currentPage = parseInt(params.page ?? '1')

  let query = coupleId
    ? supabase
        .from('transactions')
        .select('*, categories(name, color), accounts(name, color)')
        .eq('couple_id', coupleId)
        .gte('competence_date', monthStart)
        .lte('competence_date', monthEnd)
        .is('deleted_at', null)
        .order(sortCol, { ascending: sortAsc })
    : null

  if (query && params.type) query = (query as any).eq('type', params.type)
  if (query && params.category_id) query = (query as any).eq('category_id', params.category_id)
  if (query && params.account_id) query = (query as any).eq('account_id', params.account_id)
  if (query && params.private === '1') query = (query as any).eq('is_private', true)
  if (query && params.reconciled === '1') query = (query as any).eq('reconciled', true)
  if (query && params.amount_min) query = (query as any).gte('amount', parseFloat(params.amount_min))
  if (query && params.amount_max) query = (query as any).lte('amount', parseFloat(params.amount_max))

  const transactionsRes = query ? await query : null

  const accountsRes = coupleId
    ? await supabase.from('accounts').select('id, name').eq('couple_id', coupleId).is('deleted_at', null)
    : null

  const categoriesRes = await supabase.from('categories').select('id, name, type, couple_id').order('name')

  const rulesRes = coupleId
    ? await (supabase.from('category_rules') as any)
        .select('id, pattern, match_type, category_id, categories(name)')
        .eq('couple_id', coupleId)
    : null

  let transactions: any[] = transactionsRes?.data ?? []
  const accounts: { id: string; name: string }[] = (accountsRes?.data ?? []) as any[]
  const categories: { id: string; name: string; type: 'income' | 'expense'; couple_id?: string }[] = (categoriesRes?.data ?? []) as any[]
  const rules: any[] = ((rulesRes?.data ?? []) as any[]).map((r: any) => ({
    id: r.id, pattern: r.pattern, match_type: r.match_type, category_id: r.category_id,
    category_name: r.categories?.name,
  }))

  if (params.q) {
    const q = params.q.toLowerCase()
    transactions = transactions.filter(t =>
      (t.description ?? '').toLowerCase().includes(q) ||
      (t.categories?.name ?? '').toLowerCase().includes(q)
    )
  }
  if (params.tag) {
    const tag = params.tag.toLowerCase()
    transactions = transactions.filter(t =>
      (t.tags ?? []).some((tg: string) => tg.toLowerCase().includes(tag))
    )
  }
  if (params.no_category === '1') {
    transactions = transactions.filter(t => !t.category_id)
  }

  // Summary
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // Category totals
  const catMap = new Map<string, number>()
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const name = (t.categories as any)?.name ?? 'Sem categoria'
    catMap.set(name, (catMap.get(name) ?? 0) + t.amount)
  })
  const categoryTotals = Array.from(catMap.entries())
    .map(([name, total]) => ({ name, total, pct: totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)

  // Tag totals
  const tagMap = new Map<string, number>()
  transactions.filter(t => t.type === 'expense').forEach(t => {
    ;(t.tags ?? []).forEach((tag: string) => {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + t.amount)
    })
  })
  const tagTotals = Array.from(tagMap.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)

  // Pagination
  const totalCount = transactions.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const paginated = transactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    if (params.month) sp.set('month', params.month)
    if (params.date_from) sp.set('date_from', params.date_from)
    if (params.date_to) sp.set('date_to', params.date_to)
    if (params.type) sp.set('type', params.type)
    if (params.category_id) sp.set('category_id', params.category_id)
    if (params.account_id) sp.set('account_id', params.account_id)
    if (params.q) sp.set('q', params.q)
    if (params.tag) sp.set('tag', params.tag)
    if (params.sort) sp.set('sort', params.sort)
    if (params.dir) sp.set('dir', params.dir)
    if (params.private) sp.set('private', params.private)
    if (params.reconciled) sp.set('reconciled', params.reconciled)
    if (params.amount_min) sp.set('amount_min', params.amount_min)
    if (params.amount_max) sp.set('amount_max', params.amount_max)
    sp.set('page', String(p))
    return `/transactions?${sp.toString()}`
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Transações" />

      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap gap-2 justify-between">
          <Suspense>
            <TransactionFilters accounts={accounts} categories={categories} />
          </Suspense>
          <div className="flex gap-2 flex-wrap">
            {coupleId && <ExportButton coupleId={coupleId} filters={{ monthStart, monthEnd, type: params.type, category_id: params.category_id, account_id: params.account_id, q: params.q, tag: params.tag }} />}
            {coupleId && <ImportCSVButton coupleId={coupleId} userId={user!.id} accounts={accounts} />}
            {coupleId && <ImportOFXButton coupleId={coupleId} userId={user!.id} accounts={accounts} />}
            {coupleId && <CategoryManager categories={categories} coupleId={coupleId} />}
            {coupleId && <CategoryRules coupleId={coupleId} categories={categories} rules={rules} />}
            {coupleId && (
              <NewTransactionButton
                coupleId={coupleId}
                userId={user!.id}
                accounts={accounts}
                categories={categories}
              />
            )}
          </div>
        </div>

        {/* Summary cards */}
        {transactions.length > 0 && (
          <TransactionSummary income={totalIncome} expense={totalExpense} />
        )}

        <TransactionsTable
          transactions={paginated}
          accounts={accounts}
          categories={categories}
          coupleId={coupleId}
          userId={user!.id}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{totalCount} transações · página {currentPage} de {totalPages}</span>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link href={pageUrl(currentPage - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  ← Anterior
                </Link>
              )}
              {currentPage < totalPages && (
                <Link href={pageUrl(currentPage + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Próxima →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Category totals */}
        <CategoryTotals categories={categoryTotals} />

        {/* Tag totals */}
        {tagTotals.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Despesas por tag</h3>
            <div className="flex flex-wrap gap-2">
              {tagTotals.map(t => (
                <a
                  key={t.name}
                  href={`/transactions?tag=${encodeURIComponent(t.name)}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium hover:bg-primary-100 transition-colors"
                >
                  <span>{t.name}</span>
                  <span className="text-primary-500">·</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.total)}</span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
