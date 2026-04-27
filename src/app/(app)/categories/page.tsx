export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Categorias' }
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { CategoryManager } from '@/components/features/categories/category-manager'
import { Tag } from 'lucide-react'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members').select('couple_id')
    .eq('user_id', user!.id).limit(1).maybeSingle()
  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const categoriesRes = await supabase
    .from('categories').select('id, name, type, couple_id, color, sort_order').order('name')
  const categories: any[] = (categoriesRes.data ?? []) as any[]

  const custom = categories.filter(c => c.couple_id)
  const defaults = categories.filter(c => !c.couple_id)

  // Usage count per category
  let usageMap: Record<string, number> = {}
  if (coupleId) {
    const { data: txCounts } = await supabase
      .from('transactions')
      .select('category_id')
      .eq('couple_id', coupleId)
      .is('deleted_at', null)
      .not('category_id', 'is', null)

    for (const tx of (txCounts ?? []) as any[]) {
      usageMap[tx.category_id] = (usageMap[tx.category_id] ?? 0) + 1
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Categorias" />

      <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto w-full">

        {!coupleId && (
          <div className="text-center text-gray-400 py-16">Crie um casal em Configurações para gerenciar categorias.</div>
        )}

        {coupleId && (
          <>
            {/* Header action */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {custom.length} personalizada{custom.length !== 1 ? 's' : ''} · {defaults.length} padrão
              </p>
              <CategoryManager categories={categories} coupleId={coupleId} />
            </div>

            {/* Custom categories */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Categorias personalizadas</h2>
              {custom.length === 0 ? (
                <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
                  <Tag className="w-8 h-8 text-gray-200" />
                  <p className="text-sm">Nenhuma categoria personalizada ainda.</p>
                  <p className="text-xs">Clique em &ldquo;Gerenciar Categorias&rdquo; para criar suas próprias.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {custom.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((c: any) => (
                    <div key={c.id} className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50 rounded-lg">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color ?? '#6366f1' }} />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-800">{c.name}</span>
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${c.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {c.type === 'expense' ? 'Saída' : 'Entrada'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {usageMap[c.id] ? `${usageMap[c.id]} uso${usageMap[c.id] !== 1 ? 's' : ''}` : 'Não usada'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Default categories */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Categorias padrão</h2>
              <div className="grid grid-cols-2 gap-1">
                {defaults.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-2 py-1.5 px-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${c.type === 'expense' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                      {c.type === 'expense' ? '−' : '+'}
                    </span>
                    <span className="text-sm text-gray-600 truncate">{c.name}</span>
                    {usageMap[c.id] ? (
                      <span className="text-xs text-gray-300 ml-auto shrink-0">{usageMap[c.id]}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
