'use client'

type MonthData = { label: string; income: number; expense: number }
type CategorySummary = { name: string; total: number }

const MONTH_LABELS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmt(value: number) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export function AnnualExportButtons({
  year,
  monthlyData,
  categorySummary,
  totalIncome,
  totalExpense,
}: {
  year: number
  monthlyData: MonthData[]
  categorySummary: CategorySummary[]
  totalIncome: number
  totalExpense: number
}) {
  function downloadCSV() {
    const lines = [
      `Relatório Anual ${year}`,
      '',
      'Resumo',
      `Receitas,${totalIncome.toFixed(2)}`,
      `Despesas,${totalExpense.toFixed(2)}`,
      `Saldo,${(totalIncome - totalExpense).toFixed(2)}`,
      '',
      'Por Mês',
      'Mês,Receitas,Despesas,Saldo',
      ...monthlyData.map((m, i) =>
        `${MONTH_LABELS[i]},${m.income.toFixed(2)},${m.expense.toFixed(2)},${(m.income - m.expense).toFixed(2)}`
      ),
      '',
      'Por Categoria (Despesas)',
      'Categoria,Total',
      ...categorySummary.map(c => `"${c.name}",${c.total.toFixed(2)}`),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + lines], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financeiro-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function printPDF() {
    const monthRows = monthlyData.map((m, i) => {
      const bal = m.income - m.expense
      return `<tr>
        <td>${MONTH_LABELS[i]}</td>
        <td class="green">${m.income > 0 ? fmt(m.income) : '—'}</td>
        <td class="red">${m.expense > 0 ? fmt(m.expense) : '—'}</td>
        <td class="${bal >= 0 ? 'green' : 'red'}">${m.income === 0 && m.expense === 0 ? '—' : fmt(bal)}</td>
      </tr>`
    }).join('')

    const catRows = categorySummary.map(c =>
      `<tr><td>${c.name}</td><td>R$ ${c.total.toFixed(2).replace('.', ',')}</td></tr>`
    ).join('')

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Anual ${year}</title>
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
    h2 { font-size: 15px; margin-bottom: 10px; margin-top: 20px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Relatório Financeiro Anual</h1>
  <p class="sub">Ano: ${year}</p>
  <div class="summary">
    <div class="card"><div class="label">Receitas ${year}</div><div class="value green">${fmt(totalIncome)}</div></div>
    <div class="card"><div class="label">Despesas ${year}</div><div class="value red">${fmt(totalExpense)}</div></div>
    <div class="card"><div class="label">Saldo ${year}</div><div class="value">${fmt(totalIncome - totalExpense)}</div></div>
  </div>
  <h2>Por Mês</h2>
  <table>
    <thead><tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Saldo</th></tr></thead>
    <tbody>${monthRows}</tbody>
  </table>
  <h2>Despesas por Categoria</h2>
  <table>
    <thead><tr><th>Categoria</th><th>Total</th></tr></thead>
    <tbody>${catRows}</tbody>
  </table>
  <script>window.onload = () => window.print()</script>
</body>
</html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  return (
    <div className="flex gap-2 flex-wrap">
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
