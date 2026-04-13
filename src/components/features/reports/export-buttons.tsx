'use client'

type Row = {
  date: string
  type: string
  description: string
  category: string
  account: string
  amount: number
}

type CategorySummary = { name: string; total: number }

export function ExportButtons({
  transactions,
  categorySummary,
  month,
}: {
  transactions: Row[]
  categorySummary: CategorySummary[]
  month: string
}) {
  function downloadCSV() {
    const header = 'Data,Tipo,Descrição,Categoria,Conta,Valor\n'
    const rows = transactions.map(t =>
      [t.date, t.type, `"${t.description}"`, `"${t.category}"`, `"${t.account}"`, t.amount.toFixed(2)].join(',')
    ).join('\n')
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financeiro-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function printPDF() {
    const totalExpenses = transactions.filter(t => t.type === 'Saída').reduce((s, t) => s + t.amount, 0)
    const totalIncome = transactions.filter(t => t.type === 'Entrada').reduce((s, t) => s + t.amount, 0)

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório ${month}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #111; font-size: 13px; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    p.sub { color: #666; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-size: 12px; }
    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
    .summary { display: flex; gap: 24px; margin-bottom: 24px; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; flex: 1; }
    .card .label { font-size: 12px; color: #6b7280; }
    .card .value { font-size: 18px; font-weight: bold; margin-top: 4px; }
    .green { color: #16a34a; } .red { color: #dc2626; }
    h2 { font-size: 15px; margin-bottom: 10px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Relatório Financeiro</h1>
  <p class="sub">Período: ${month}</p>
  <div class="summary">
    <div class="card"><div class="label">Receitas</div><div class="value green">R$ ${totalIncome.toFixed(2).replace('.', ',')}</div></div>
    <div class="card"><div class="label">Despesas</div><div class="value red">R$ ${totalExpenses.toFixed(2).replace('.', ',')}</div></div>
    <div class="card"><div class="label">Saldo</div><div class="value">R$ ${(totalIncome - totalExpenses).toFixed(2).replace('.', ',')}</div></div>
  </div>
  <h2>Por Categoria</h2>
  <table>
    <thead><tr><th>Categoria</th><th>Total</th></tr></thead>
    <tbody>
      ${categorySummary.map(c => `<tr><td>${c.name}</td><td>R$ ${c.total.toFixed(2).replace('.', ',')}</td></tr>`).join('')}
    </tbody>
  </table>
  <h2>Transações</h2>
  <table>
    <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Conta</th><th>Valor</th></tr></thead>
    <tbody>
      ${transactions.map(t => `<tr>
        <td>${t.date}</td>
        <td>${t.type}</td>
        <td>${t.description}</td>
        <td>${t.category}</td>
        <td>${t.account}</td>
        <td>R$ ${t.amount.toFixed(2).replace('.', ',')}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <script>window.onload = () => window.print()</script>
</body>
</html>`

    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={downloadCSV}
        className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        Exportar CSV
      </button>
      <button
        onClick={printPDF}
        className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        Exportar PDF
      </button>
    </div>
  )
}
