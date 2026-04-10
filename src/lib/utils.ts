import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(
    typeof date === 'string' ? new Date(date) : date
  )
}

/**
 * Calcula a competence_date de uma compra no cartão de crédito.
 * Se o dia da compra for maior que o closing_day, vai para o próximo mês.
 */
export function calcCompetenceDate(purchaseDate: Date, closingDay: number): Date {
  const day = purchaseDate.getDate()
  const month = purchaseDate.getMonth()
  const year = purchaseDate.getFullYear()

  if (day > closingDay) {
    return new Date(year, month + 1, 1)
  }
  return new Date(year, month, 1)
}
