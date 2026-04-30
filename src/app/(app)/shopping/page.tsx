export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Lista de Compras' }
import { Header } from '@/components/layout/header'
import { PageTabs } from '@/components/ui/page-tabs'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import {
  NewShoppingListButton,
  AddShoppingItemButton,
  CheckShoppingItem,
  DeleteShoppingItem,
  DeleteShoppingList,
  CompleteShoppingList,
} from '@/components/features/shopping/shopping-actions'
import { ShoppingCart, CheckCircle2, Tag } from 'lucide-react'

export default async function ShoppingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const listsRes = coupleId
    ? await supabase.from('shopping_lists')
        .select('*, shopping_items(*)')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
    : null

  // Fetch current month budgets for linking
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const budgetsRes = coupleId
    ? await supabase.from('budgets')
        .select('id, amount, category_id, categories(id, name)')
        .eq('couple_id', coupleId)
        .eq('month', monthStart)
    : null
  const budgetCategories: { id: string; name: string; amount: number }[] =
    (budgetsRes?.data ?? []).map((b: any) => ({
      id: b.categories?.id ?? b.category_id,
      name: b.categories?.name ?? '—',
      amount: b.amount,
    }))

  const allLists: any[] = listsRes?.data ?? []
  const activeLists = allLists.filter((l: any) => !l.completed)
  const doneLists = allLists.filter((l: any) => l.completed)

  return (
    <div className="flex flex-col flex-1">
      <Header title="Listas" />
      <PageTabs tabs={[
        { href: '/wishlist', label: 'Desejos' },
        { href: '/shopping', label: 'Compras' },
      ]} />

      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {activeLists.length} {activeLists.length === 1 ? 'lista ativa' : 'listas ativas'}
          </p>
          {coupleId && <NewShoppingListButton coupleId={coupleId} userId={user!.id} budgetCategories={budgetCategories} />}
        </div>

        {activeLists.length === 0 && doneLists.length === 0 && (
          <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3">
            <ShoppingCart className="w-10 h-10 text-gray-200" />
            {coupleId ? 'Nenhuma lista criada ainda.' : 'Crie um casal em Configurações para começar.'}
          </div>
        )}

        {activeLists.map((list: any) => {
          const items: any[] = list.shopping_items ?? []
          const pending = items.filter((i: any) => !i.checked)
          const checked = items.filter((i: any) => i.checked)
          const estimatedTotal = items.reduce((s: number, i: any) => s + ((i.estimated_price ?? 0) * (i.quantity ?? 1)), 0)
          const actualTotal = items.filter((i: any) => i.checked && i.actual_price != null)
            .reduce((s: number, i: any) => s + ((i.actual_price ?? 0) * (i.quantity ?? 1)), 0)
          const progress = items.length > 0 ? Math.round((checked.length / items.length) * 100) : 0

          // Budget category link
          const linkedBudgetCat = list.budget_category_id
            ? budgetCategories.find(c => c.id === list.budget_category_id)
            : null
          const budgetLimit = list.budget ?? linkedBudgetCat?.amount ?? null
          const budgetUsed = actualTotal > 0 ? actualTotal : estimatedTotal
          const budgetOver = budgetLimit != null && budgetUsed > budgetLimit
          const budgetPct = budgetLimit ? Math.min(Math.round((budgetUsed / budgetLimit) * 100), 100) : 0

          // Group pending by category
          const byCategory: Record<string, any[]> = {}
          for (const item of pending) {
            const cat = item.category || 'Sem categoria'
            if (!byCategory[cat]) byCategory[cat] = []
            byCategory[cat].push(item)
          }

          return (
            <div key={list.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{list.name}</h2>
                    <div className="flex items-center gap-3 mt-0.5">
                      {items.length > 0 && (
                        <span className="text-xs text-gray-400">
                          {checked.length}/{items.length} itens
                        </span>
                      )}
                      {linkedBudgetCat && (
                        <span className="flex items-center gap-1 text-xs text-primary-600 font-medium">
                          <Tag className="w-3 h-3" />{linkedBudgetCat.name}
                        </span>
                      )}
                      {estimatedTotal > 0 && actualTotal === 0 && (
                        <span className="text-xs text-gray-400 financial-value">
                          Estimado: {formatCurrency(estimatedTotal)}
                        </span>
                      )}
                      {actualTotal > 0 && (
                        <span className={`text-xs font-medium financial-value ${budgetOver ? 'text-red-600' : 'text-green-600'}`}>
                          Gasto: {formatCurrency(actualTotal)}
                        </span>
                      )}
                      {budgetLimit != null && (
                        <span className={`text-xs font-medium financial-value ${budgetOver ? 'text-red-500' : 'text-gray-400'}`}>
                          / {formatCurrency(budgetLimit)} {budgetOver ? '(acima!)' : `(${budgetPct}%)`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {coupleId && <AddShoppingItemButton listId={list.id} userId={user!.id} />}
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {budgetLimit != null && (
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${budgetOver ? 'bg-red-400' : 'bg-primary-400'}`}
                          style={{ width: `${budgetPct}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Items by category */}
              {Object.entries(byCategory).map(([cat, catItems]) => (
                <div key={cat}>
                  {Object.keys(byCategory).length > 1 && (
                    <p className="text-xs font-medium text-gray-400 px-4 pt-2">{cat}</p>
                  )}
                  {catItems.map((item: any) => (
                    <div key={item.id} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                      <CheckShoppingItem id={item.id} checked={false} actualPrice={item.actual_price} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-800">{item.name}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          {item.quantity !== 1 && `${item.quantity}${item.unit ? ` ${item.unit}` : 'x'}`}
                        </span>
                        {item.estimated_price && (
                          <span className="text-xs text-gray-400 ml-2 financial-value">
                            {formatCurrency(item.estimated_price * item.quantity)}
                          </span>
                        )}
                      </div>
                      <DeleteShoppingItem id={item.id} />
                    </div>
                  ))}
                </div>
              ))}

              {/* Checked items */}
              {checked.length > 0 && (
                <div className="border-t border-gray-50">
                  <p className="text-xs font-medium text-gray-300 px-4 pt-2">Marcados ({checked.length})</p>
                  {checked.map((item: any) => (
                    <div key={item.id} className="group flex items-center gap-3 px-4 py-2 opacity-50">
                      <CheckShoppingItem id={item.id} checked={true} actualPrice={item.actual_price} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-500 line-through">{item.name}</span>
                        {item.actual_price && (
                          <span className="text-xs text-green-600 ml-2 financial-value">{formatCurrency(item.actual_price * item.quantity)}</span>
                        )}
                      </div>
                      <DeleteShoppingItem id={item.id} />
                    </div>
                  ))}
                </div>
              )}

              {items.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-gray-300">
                  Adicione itens à lista
                </div>
              )}

              {/* Footer actions */}
              <div className="px-4 py-2 border-t border-gray-50 flex items-center justify-end gap-2">
                <CompleteShoppingList id={list.id} completed={false} />
                <DeleteShoppingList id={list.id} />
              </div>
            </div>
          )
        })}

        {/* Completed lists */}
        {doneLists.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Listas concluídas ({doneLists.length})
            </p>
            <div className="space-y-2">
              {doneLists.map((list: any) => {
                const items: any[] = list.shopping_items ?? []
                const actualTotal = items.filter((i: any) => i.checked && i.actual_price != null)
                  .reduce((s: number, i: any) => s + ((i.actual_price ?? 0) * (i.quantity ?? 1)), 0)
                return (
                  <div key={list.id} className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-500 line-through">{list.name}</span>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">{items.length} itens</span>
                        {actualTotal > 0 && (
                          <span className="text-xs text-gray-400 financial-value">Gasto: {formatCurrency(actualTotal)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <CompleteShoppingList id={list.id} completed={true} />
                      <DeleteShoppingList id={list.id} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
