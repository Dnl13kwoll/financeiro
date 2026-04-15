import { formatCurrency } from '@/lib/utils'
import { ArrowUpCircle, ArrowDownCircle, Scale } from 'lucide-react'

export function TransactionSummary({
  income,
  expense,
}: {
  income: number
  expense: number
}) {
  const balance = income - expense
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
        <ArrowUpCircle className="w-8 h-8 text-green-400 shrink-0" />
        <div>
          <p className="text-xs text-green-600">Receitas</p>
          <p className="font-bold text-green-700">{formatCurrency(income)}</p>
        </div>
      </div>
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
        <ArrowDownCircle className="w-8 h-8 text-red-400 shrink-0" />
        <div>
          <p className="text-xs text-red-600">Despesas</p>
          <p className="font-bold text-red-700">{formatCurrency(expense)}</p>
        </div>
      </div>
      <div className={`border rounded-xl p-4 flex items-center gap-3 ${balance >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
        <Scale className={`w-8 h-8 shrink-0 ${balance >= 0 ? 'text-blue-400' : 'text-red-400'}`} />
        <div>
          <p className={`text-xs ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Saldo</p>
          <p className={`font-bold ${balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatCurrency(balance)}</p>
        </div>
      </div>
    </div>
  )
}
