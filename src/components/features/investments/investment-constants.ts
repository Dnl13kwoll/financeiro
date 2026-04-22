export type InvestmentType =
  | 'cdb' | 'lci' | 'lca' | 'poupanca'
  | 'tesouro_selic' | 'tesouro_ipca' | 'tesouro_pre'
  | 'acoes' | 'fii' | 'etf' | 'bdr'
  | 'fundo_di' | 'fundo_multi' | 'fundo_acoes'
  | 'pgbl' | 'vgbl'
  | 'cripto' | 'outro'

export type RateType = 'pct_cdi' | 'ipca_plus' | 'fixed' | 'selic' | 'other'

export const TYPE_LABELS: Record<InvestmentType, string> = {
  cdb: 'CDB',
  lci: 'LCI',
  lca: 'LCA',
  poupanca: 'Poupança',
  tesouro_selic: 'Tesouro SELIC',
  tesouro_ipca: 'Tesouro IPCA+',
  tesouro_pre: 'Tesouro Prefixado',
  acoes: 'Ações',
  fii: 'FII',
  etf: 'ETF',
  bdr: 'BDR',
  fundo_di: 'Fundo DI',
  fundo_multi: 'Fundo Multimercado',
  fundo_acoes: 'Fundo de Ações',
  pgbl: 'PGBL',
  vgbl: 'VGBL',
  cripto: 'Criptomoeda',
  outro: 'Outro',
}

export const TYPE_GROUPS: { label: string; types: InvestmentType[] }[] = [
  { label: 'Renda Fixa', types: ['cdb', 'lci', 'lca', 'poupanca', 'tesouro_selic', 'tesouro_ipca', 'tesouro_pre'] },
  { label: 'Renda Variável', types: ['acoes', 'fii', 'etf', 'bdr'] },
  { label: 'Fundos', types: ['fundo_di', 'fundo_multi', 'fundo_acoes'] },
  { label: 'Previdência', types: ['pgbl', 'vgbl'] },
  { label: 'Outros', types: ['cripto', 'outro'] },
]

export const TYPE_COLORS: Record<string, string> = {
  'Renda Fixa':     '#16a34a',
  'Renda Variável': '#2563eb',
  'Fundos':         '#7c3aed',
  'Previdência':    '#d97706',
  'Outros':         '#6b7280',
}

export const RATE_LABELS: Record<RateType, string> = {
  pct_cdi:  '% do CDI',
  ipca_plus: 'IPCA +',
  fixed:    'Taxa fixa % a.a.',
  selic:    '% da SELIC',
  other:    'Outro',
}

export const LIQUIDITY_OPTIONS = [
  'Diária (D+0)',
  'D+1',
  'D+30',
  'D+60',
  'D+90',
  'No vencimento',
  'Sem liquidez',
]

// Taxas de referência aproximadas (Abril 2026)
export const REFERENCE_RATES = {
  selic: 13.75,
  cdi: 13.65,
  ipca_12m: 4.83,
}

// Tipos que têm rentabilidade calculável
export const FIXED_INCOME_TYPES: InvestmentType[] = [
  'cdb', 'lci', 'lca', 'poupanca',
  'tesouro_selic', 'tesouro_ipca', 'tesouro_pre',
  'fundo_di',
]

export function getTypeGroup(type: InvestmentType): string {
  for (const g of TYPE_GROUPS) {
    if ((g.types as string[]).includes(type)) return g.label
  }
  return 'Outros'
}

export function calcEstimatedYield(
  invested: number,
  rateType: RateType | null,
  rateValue: number | null,
  startDate: string,
): number | null {
  if (!rateType || rateValue === null) return null
  const days = Math.max(1, Math.floor((Date.now() - new Date(startDate + 'T12:00:00').getTime()) / 86400000))
  const years = days / 365
  let annualRate = 0

  if (rateType === 'pct_cdi') annualRate = (rateValue / 100) * (REFERENCE_RATES.cdi / 100)
  else if (rateType === 'selic')   annualRate = (rateValue / 100) * (REFERENCE_RATES.selic / 100)
  else if (rateType === 'fixed')   annualRate = rateValue / 100
  else if (rateType === 'ipca_plus') annualRate = (REFERENCE_RATES.ipca_12m + rateValue) / 100
  else return null

  const gross = invested * (Math.pow(1 + annualRate, years) - 1)
  return Math.max(0, gross)
}
