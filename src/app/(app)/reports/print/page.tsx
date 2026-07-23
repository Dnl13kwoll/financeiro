export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Imprimir Relatório' }
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { PrintTrigger } from './print-trigger'

export default async function PrintReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: monthParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const targetDate = monthParam
    ? new Date(monthParam + '-02')
    : now

  const year = targetDate.getFullYear()
  const month = targetDate.getMonth()
  const monthStart = new Date(year, month, 1).toISOString().slice(0, 10)
  const monthEnd = new Date(year, month + 1, 0).toISOString().slice(0, 10)
  const monthLabel = targetDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id, couples(currency)')
    .eq('user_id', user!.id)
    .maybeSingle()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null
  const currency: string = (memberRes.data as any)?.couples?.currency ?? 'BRL'

  if (!coupleId) return <p>Sem casal configurado.</p>

  const [txRes, catRes, installRes, recurringRes, goalsRes] = await Promise.all([
    supabase.from('transactions').select('type, amount').eq('couple_id', coupleId).gte('competence_date', monthStart).lte('competence_date', monthEnd).is('deleted_at', null).neq('type', 'transfer'),
    supabase.from('transactions').select('amount, categories(name)').eq('couple_id', coupleId).eq('type', 'expense').gte('competence_date', monthStart).lte('competence_date', monthEnd).is('deleted_at', null),
    supabase.from('installment_items').select('due_date, amount, paid, installments!inner(description, couple_id)').gte('due_date', monthStart).lte('due_date', monthEnd).eq('canceled', false).eq('installments.couple_id', coupleId),
    supabase.from('recurring_accounts').select('name, amount, day_due, type, recurring_records(paid, reference_month, amount)').eq('couple_id', coupleId).eq('active', true),
    supabase.from('goals').select('name, current_amount, target_amount').eq('couple_id', coupleId),
  ])

  const txs: any[] = txRes.data ?? []
  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : null

  const catMap = new Map<string, number>()
  ;(catRes.data ?? []).forEach((t: any) => {
    const name = (t.categories as any)?.name ?? 'Outros'
    catMap.set(name, (catMap.get(name) ?? 0) + t.amount)
  })
  const catData = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])

  const installments = installRes.data ?? []
  const installPaid = installments.filter((i: any) => i.paid)
  const installPending = installments.filter((i: any) => !i.paid)

  const recurring: any[] = recurringRes.data ?? []
  const recurringWithStatus = recurring.map(rec => {
    const record = (rec.recurring_records ?? []).find((r: any) => r.reference_month === monthStart)
    return { ...rec, paid: record?.paid ?? false, recordAmount: record?.amount ?? rec.amount ?? 0 }
  })

  const goals: any[] = (goalsRes.data ?? []).slice(0, 5)

  return (
    <>
      <PrintTrigger />
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: white; padding: 32px; font-size: 13px; }
        h1 { font-size: 22px; font-weight: 700; color: #1e40af; margin-bottom: 4px; }
        h2 { font-size: 14px; font-weight: 600; color: #374151; margin: 20px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
        .subtitle { font-size: 12px; color: #6b7280; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
        .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; }
        .card-label { font-size: 11px; color: #6b7280; }
        .card-value { font-size: 18px; font-weight: 700; margin-top: 2px; }
        .green { color: #16a34a; }
        .red { color: #dc2626; }
        .blue { color: #2563eb; }
        .gray { color: #374151; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; padding: 6px 8px; background: #f3f4f6; font-weight: 600; color: #374151; }
        td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; }
        .bar-wrap { background: #e5e7eb; border-radius: 4px; height: 6px; margin-top: 3px; }
        .bar { background: #3b82f6; border-radius: 4px; height: 6px; }
        .badge { display: inline-block; padding: 1px 7px; border-radius: 99px; font-size: 11px; font-weight: 500; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 12px; }
        .print-btn { position: fixed; top: 16px; right: 16px; background: #2563eb; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
      `}</style>

      <button className="print-btn no-print" onClick={() => {}} id="print-btn">🖨️ Salvar PDF</button>

      <h1>Relatório Financeiro</h1>
      <p className="subtitle" style={{ textTransform: 'capitalize' }}>{monthLabel} · Gerado em {now.toLocaleDateString('pt-BR')}</p>

      {/* Resumo */}
      <h2>Resumo do mês</h2>
      <div className="grid-4">
        <div className="card">
          <p className="card-label">Receitas</p>
          <p className="card-value green">{formatCurrency(totalIncome, currency)}</p>
        </div>
        <div className="card">
          <p className="card-label">Despesas</p>
          <p className="card-value red">{formatCurrency(totalExpense, currency)}</p>
        </div>
        <div className="card">
          <p className="card-label">Saldo do mês</p>
          <p className={`card-value ${balance >= 0 ? 'green' : 'red'}`}>{formatCurrency(balance, currency)}</p>
        </div>
        <div className="card">
          <p className="card-label">Taxa de poupança</p>
          <p className={`card-value ${(savingsRate ?? 0) >= 10 ? 'green' : 'red'}`}>{savingsRate !== null ? `${savingsRate}%` : '—'}</p>
        </div>
      </div>

      {/* Gastos por categoria */}
      {catData.length > 0 && (
        <>
          <h2>Gastos por categoria</h2>
          <table>
            <thead><tr><th>Categoria</th><th style={{ textAlign: 'right' }}>Valor</th><th style={{ width: '35%' }}>Proporção</th></tr></thead>
            <tbody>
              {catData.map(([name, total]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>{formatCurrency(total, currency)}</td>
                  <td>
                    <div className="bar-wrap">
                      <div className="bar" style={{ width: `${Math.round((total / totalExpense) * 100)}%` }} />
                    </div>
                    <span style={{ fontSize: 10, color: '#6b7280' }}>{Math.round((total / totalExpense) * 100)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Parcelamentos do mês */}
      {installments.length > 0 && (
        <>
          <h2>Parcelamentos do mês</h2>
          <table>
            <thead><tr><th>Descrição</th><th>Vencimento</th><th style={{ textAlign: 'right' }}>Valor</th><th>Status</th></tr></thead>
            <tbody>
              {[...installPaid, ...installPending].map((item: any, i) => (
                <tr key={i}>
                  <td>{(item.installments as any)?.description ?? '—'}</td>
                  <td>{new Date(item.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.amount, currency)}</td>
                  <td><span className={`badge ${item.paid ? 'badge-green' : 'badge-red'}`}>{item.paid ? 'Pago' : 'Pendente'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Contas recorrentes */}
      {recurringWithStatus.length > 0 && (
        <>
          <h2>Contas recorrentes</h2>
          <table>
            <thead><tr><th>Nome</th><th>Dia</th><th style={{ textAlign: 'right' }}>Valor</th><th>Status</th></tr></thead>
            <tbody>
              {recurringWithStatus.sort((a, b) => (b.paid ? 0 : 1) - (a.paid ? 0 : 1)).map((rec: any, i) => (
                <tr key={i}>
                  <td>{rec.name}</td>
                  <td>dia {rec.day_due}</td>
                  <td style={{ textAlign: 'right' }}>{rec.recordAmount ? formatCurrency(rec.recordAmount, currency) : '—'}</td>
                  <td><span className={`badge ${rec.paid ? 'badge-green' : 'badge-red'}`}>{rec.paid ? 'Pago' : 'Pendente'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Metas */}
      {goals.length > 0 && (
        <>
          <h2>Metas</h2>
          <table>
            <thead><tr><th>Meta</th><th style={{ textAlign: 'right' }}>Atual</th><th style={{ textAlign: 'right' }}>Objetivo</th><th>Progresso</th></tr></thead>
            <tbody>
              {goals.map((g: any, i) => {
                const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
                return (
                  <tr key={i}>
                    <td>{g.name}</td>
                    <td style={{ textAlign: 'right', color: '#2563eb' }}>{formatCurrency(g.current_amount, currency)}</td>
                    <td style={{ textAlign: 'right', color: '#6b7280' }}>{formatCurrency(g.target_amount, currency)}</td>
                    <td>
                      <div className="bar-wrap">
                        <div className="bar" style={{ width: `${pct}%`, background: pct >= 90 ? '#16a34a' : '#3b82f6' }} />
                      </div>
                      <span style={{ fontSize: 10, color: '#6b7280' }}>{pct}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}

      <div className="footer">
        Financeiro para casais · {monthLabel} · {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </>
  )
}
